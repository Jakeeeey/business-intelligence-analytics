import { NextRequest, NextResponse } from "next/server";
import { nowUTC } from "@/modules/business-intelligence-analytics/prospecting-bia/utils/datetime";
import { normalizeProspectStatus } from "@/modules/business-intelligence-analytics/prospecting-bia/utils/prospect-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIRECTUS_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

const NOT_SET_STORE_TYPE = 999; // `store_type` catalog id for "NOT SET"

type ProspectRecord = {
  customer_id?: number | string | null;
  prospect_status?: unknown;
  customer_code?: string | null;
  customer_name?: string | null;
  type?: string | null;
  user_id?: number | null;
  store_name?: string | null;
  store_signage?: string | null;
  brgy?: string | null;
  city?: string | null;
  province?: string | null;
  contact_number?: string | null;
  customer_email?: string | null;
  tel_number?: string | null;
  bank_details?: string | null;
  customer_tin?: string | null;
  payment_term?: number | null;
  store_type?: number | null;
  price_type?: string | null;
  encoder_id?: number | null;
  credit_type?: number | null;
  company_code?: number | null;
  otherDetails?: string | null;
  classification?: number | null;
  isActive?: number | null;
  isVAT?: number | null;
  isEWT?: number | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  location?: { coordinates?: number[] | null } | null;
};

function authHeaders(): Headers {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  if (DIRECTUS_TOKEN) headers.set("Authorization", `Bearer ${DIRECTUS_TOKEN}`);
  return headers;
}

function num(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Reads the caller's user id (`sub`) from the `vos_access_token` JWT cookie.
 * @param {NextRequest} req - The incoming request.
 * @returns {number | null} The numeric `sub`, or null when absent/unparseable.
 */
function jwtSub(req: NextRequest): number | null {
  try {
    const token = req.cookies.get("vos_access_token")?.value;
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2 || !parts[1]) return null;
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const payload = JSON.parse(Buffer.from(padded, "base64").toString("utf-8")) as {
      sub?: unknown;
    };
    const sub = Number(payload.sub);
    return Number.isFinite(sub) && sub > 0 ? sub : null;
  } catch {
    return null;
  }
}

/**
 * Finalizes a prospect in one operation: creates the linked `customer` row,
 * then marks the prospect `converted` and stores the 1:1 link both ways.
 * Idempotent when `customer_prospect.customer_id` is already set.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const recordId = parseInt(id, 10);
    if (Number.isNaN(recordId)) {
      return NextResponse.json({ success: false, message: "Invalid prospect id" }, { status: 400 });
    }

    if (!DIRECTUS_BASE) {
      return NextResponse.json({ success: false, message: "Directus is not configured" }, { status: 500 });
    }

    // 1. Load the prospect
    const prospectRes = await fetch(
      `${DIRECTUS_BASE}/items/customer_prospect/${recordId}`,
      { headers: authHeaders(), cache: "no-store" }
    );
    if (!prospectRes.ok) {
      return NextResponse.json({ success: false, message: "Prospect not found" }, { status: 404 });
    }
    const { data: prospect } = (await prospectRes.json()) as { data: ProspectRecord | null };
    if (!prospect) {
      return NextResponse.json({ success: false, message: "Prospect not found" }, { status: 404 });
    }

    // 2. Eligibility gate — only contacted, follow-up, or converted prospects can be finalized.
    const prospectStatus = normalizeProspectStatus(prospect.prospect_status);
    if (prospectStatus !== "contacted" && prospectStatus !== "follow-up" && prospectStatus !== "converted") {
      return NextResponse.json(
        { success: false, message: "Only contacted, follow-up, or converted prospects can be finalized." },
        { status: 400 }
      );
    }

    // 3. Idempotent: already finalized — do not create a second customer.
    const linkedCustomerId = Number(prospect.customer_id);
    if (Number.isFinite(linkedCustomerId) && linkedCustomerId > 0) {
      return NextResponse.json({ success: true, alreadyLinked: true }, { status: 200 });
    }

    // 4. Duplicate guard by customer_code (unique on the customer table)
    const customerCode = (prospect.customer_code ?? "").trim() || "0";
    const dupRes = await fetch(
      `${DIRECTUS_BASE}/items/customer?filter[customer_code][_eq]=${encodeURIComponent(customerCode)}&limit=1&fields=id`,
      { headers: authHeaders(), cache: "no-store" }
    );
    if (dupRes.ok) {
      const dupJson = (await dupRes.json()) as { data?: unknown[] };
      if (Array.isArray(dupJson.data) && dupJson.data.length > 0) {
        return NextResponse.json(
          { success: false, message: `A customer with code "${customerCode}" already exists.` },
          { status: 409 }
        );
      }
    }

    // 5. Resolve a real encoder id — never 0.
    const prospectEncoder = Number(prospect.encoder_id);
    const encoderId =
      Number.isFinite(prospectEncoder) && prospectEncoder > 0 ? prospectEncoder : jwtSub(req);
    if (!encoderId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot finalize: the prospect has no encoder and no user identity was found. Sign in again and retry.",
        },
        { status: 400 }
      );
    }

    // 6. Map prospect → customer (NOT-NULL fallbacks applied)
    const coords = prospect.location?.coordinates;
    const fromGeo = Array.isArray(coords) && coords.length === 2;
    const longitude = fromGeo ? num(coords?.[0]) : num(prospect.longitude);
    const latitude = fromGeo ? num(coords?.[1]) : num(prospect.latitude);

    const payload: Record<string, unknown> = {
      customer_code: customerCode,
      customer_name: prospect.customer_name ?? "0",
      type: prospect.type ?? "Regular",
      store_name: prospect.store_name ?? "0",
      store_signage: prospect.store_signage ?? prospect.store_name ?? "0",
      brgy: prospect.brgy ?? null,
      city: prospect.city ?? null,
      province: prospect.province ?? null,
      contact_number: prospect.contact_number ?? "0",
      customer_email: prospect.customer_email ?? null,
      tel_number: prospect.tel_number ?? null,
      bank_details: prospect.bank_details ?? null,
      customer_tin: prospect.customer_tin ?? null,
      payment_term: prospect.payment_term ?? null,
      store_type: prospect.store_type ?? NOT_SET_STORE_TYPE,
      price_type: prospect.price_type ?? null,
      encoder_id: encoderId,
      credit_type: prospect.credit_type ?? 0,
      company_code: prospect.company_code ?? -1,
      otherDetails: prospect.otherDetails ?? null,
      classification: prospect.classification ?? null,
      date_entered: nowUTC(),
      isActive: 1,
      isVAT: prospect.isVAT ?? 0,
      isEWT: prospect.isEWT ?? 0,
      latitude,
      longitude,
      prospect_id: recordId,
    };
    if (prospect.user_id) payload.user_id = prospect.user_id;

    // 7. Insert
    const insertRes = await fetch(`${DIRECTUS_BASE}/items/customer`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    if (!insertRes.ok) {
      const text = await insertRes.text().catch(() => "");
      console.error("[prospect convert] Directus error:", insertRes.status, text);
      return NextResponse.json(
        { success: false, message: "Failed to create the customer record" },
        { status: insertRes.status }
      );
    }

    const { data: created } = (await insertRes.json()) as { data: { id: number } & Record<string, unknown> };

    // 8. Only after a successful insert, link + mark converted.
    const linkRes = await fetch(`${DIRECTUS_BASE}/items/customer_prospect/${recordId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ prospect_status: "converted", customer_id: created.id }),
    });

    if (!linkRes.ok) {
      const text = await linkRes.text().catch(() => "");
      console.error("[prospect convert] link failed:", linkRes.status, text);
      return NextResponse.json(
        {
          success: false,
          message: `Customer ${created.id} was created but linking the prospect failed. Backfill it from the converted prospect.`,
          data: { customer: created, customer_id: created.id },
        },
        { status: 502 }
      );
    }

    const { data: updated } = await linkRes.json();
    return NextResponse.json(
      {
        success: true,
        data: { customer: created, prospect: updated },
        message: "Prospect converted to a customer.",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[prospect convert] error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
