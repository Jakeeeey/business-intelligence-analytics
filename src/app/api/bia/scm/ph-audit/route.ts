import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const env = (process as unknown as { env: Record<string, string | undefined> }).env;
const DIRECTUS_BASE = (env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
const DIRECTUS_TOKEN = env.DIRECTUS_STATIC_TOKEN || "";
const SPRING_API_BASE_URL = env.SPRING_API_BASE_URL;

type AnyRec = Record<string, unknown>;

function parseBit(val: unknown): boolean {
  if (!val) return false;
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val === 1;
  if (typeof val === "string") return val === "1" || val.toLowerCase() === "true";
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    if (Array.isArray(obj.data) && obj.data.length > 0) {
      return Number(obj.data[0]) === 1;
    }
  }
  return false;
}

async function directusGET(path: string, params?: Record<string, string>) {
  if (!DIRECTUS_BASE || !DIRECTUS_TOKEN) {
    return { ok: false, status: 500, error: "Directus credentials missing" };
  }
  const url = new URL(`${DIRECTUS_BASE}${path.startsWith("/") ? "" : "/"}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      url.searchParams.set(k, v);
    });
  }
  const r = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  if (!r.ok) {
    return { ok: false, status: r.status, error: `Directus error: ${r.statusText}` };
  }
  const body = (await r.json()) as { data?: AnyRec[] | AnyRec };
  return { ok: true, status: 200, data: body.data };
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const now = new Date();
    const year = parseInt(sp.get("year") || String(now.getFullYear()), 10);
    const month = parseInt(sp.get("month") || String(now.getMonth() + 1), 10);

    // Calculate start & end date of month in ISO format
    const startDate = `${year}-${String(month).padStart(2, "0")}-01 00:00:00`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")} 23:59:59`;

    // 1. Fetch branches lookup
    let branches: Array<{ id: number; name: string; code: string }> = [];
    let piRecords: AnyRec[] = [];

    // Attempt Directus fetch
    if (DIRECTUS_BASE && DIRECTUS_TOKEN) {
      const brRes = await directusGET("/items/branches", { fields: "id,branch_name,branch_code", limit: "-1" });

      if (brRes.ok && Array.isArray(brRes.data)) {
        branches = brRes.data.map((b) => ({
          id: Number(b.id),
          name: String(b.branch_name || b.branch_code || `Branch #${b.id}`).trim(),
          code: String(b.branch_code || "").trim(),
        }));
      }

      // Query physical_inventory items covering the month
      const piFilter = JSON.stringify({
        _and: [
          {
            starting_date: {
              _lte: endDate,
            },
          },
          {
            cutOff_date: {
              _gte: startDate,
            },
          },
        ],
      });

      const piRes = await directusGET("/items/physical_inventory", {
        filter: piFilter,
        fields: "*",
        limit: "-1",
        sort: "starting_date",
      });

      if (piRes.ok && Array.isArray(piRes.data)) {
        piRecords = piRes.data;
      }
    }

    // Fallback: If Directus returned no physical_inventory records or isn't connected, try Spring API
    if (piRecords.length === 0 && SPRING_API_BASE_URL) {
      const token = req.cookies.get("vos_access_token")?.value;
      try {
        const springRes = await fetch(
          `${SPRING_API_BASE_URL.replace(/\/$/, "")}/api/physical-inventory?year=${year}&month=${month}`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              "Content-Type": "application/json",
            },
            cache: "no-store",
          }
        );
        if (springRes.ok) {
          const sData = await springRes.json();
          if (Array.isArray(sData)) {
            piRecords = sData;
          } else if (Array.isArray(sData.data)) {
            piRecords = sData.data;
          }
        }
      } catch (e) {
        console.warn("Spring physical inventory fallback failed:", e);
      }
    }

    // Map lookups for quick lookup
    const branchMap = new Map<number, { name: string; code: string }>();
    branches.forEach((b) => branchMap.set(b.id, { name: b.name, code: b.code }));

    const mappedData = piRecords.map((r) => {
      const bInfo = branchMap.get(Number(r.branch_id));

      return {
        id: Number(r.id),
        ph_no: String(r.ph_no || ""),
        date_encoded: String(r.date_encoded || ""),
        cutOff_date: String(r.cutOff_date || ""),
        starting_date: String(r.starting_date || ""),
        price_type: String(r.price_type || ""),
        stock_type: String(r.stock_type || ""),
        branch_id: Number(r.branch_id),
        branch_name: bInfo?.name || `Branch #${r.branch_id}`,
        branch_code: bInfo?.code || "",
        remarks: String(r.remarks || ""),
        status: String(r.status || "PENDING_REVIEW"),
        isComitted: parseBit(r.isComitted),
        committed_at: r.committed_at ? String(r.committed_at) : null,
        isCancelled: parseBit(r.isCancelled),
        cancelled_at: r.cancelled_at ? String(r.cancelled_at) : null,
        is_scm: parseBit(r.is_scm),
        is_offset: parseBit(r.is_offset),
        total_amount: Number(r.total_amount || 0),
        category_id: Number(r.category_id),
        encoder_id: Number(r.encoder_id),
      };
    });

    return NextResponse.json({
      success: true,
      data: mappedData,
      branches,
      year,
      month,
    });
  } catch (error) {
    console.error("API error in ph-audit:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch physical inventory audit data",
        data: [],
        branches: [],
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
      },
      { status: 500 }
    );
  }
}

