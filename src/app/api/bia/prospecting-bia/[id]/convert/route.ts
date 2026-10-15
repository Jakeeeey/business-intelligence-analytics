import { NextRequest, NextResponse } from "next/server";
import { nowUTC } from "@/modules/business-intelligence-analytics/prospecting-bia/utils/datetime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIRECTUS_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

const NOT_SET_STORE_TYPE = 999; // `store_type` catalog id for "NOT SET"

type ProspectRecord = {
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
 * Converts an approved/converted prospect into a `customer` record.
 * Maps prospect fields onto the customer schema, applying safe NOT-NULL fallbacks,
 * and refuses to create a duplicate `customer_code`.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // 2. Duplicate guard by customer_code (unique on the customer table)
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

    // 3. Map prospect → customer (NOT-NULL fallbacks applied)
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
      encoder_id: prospect.encoder_id ?? 0,
      credit_type: prospect.credit_type ?? 0,
      company_code: prospect.company_code ?? -1,
      otherDetails: prospect.otherDetails ?? null,
      classification: prospect.classification ?? null,
      date_entered: nowUTC(),
      isActive: prospect.isActive ?? 0,
      isVAT: prospect.isVAT ?? 0,
      isEWT: prospect.isEWT ?? 0,
      latitude,
      longitude,
    };
    if (prospect.user_id) payload.user_id = prospect.user_id;

    // 4. Insert
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

    const { data: created } = await insertRes.json();
    return NextResponse.json(
      { success: true, data: created, message: "Prospect converted to a customer." },
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
