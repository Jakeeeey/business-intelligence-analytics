import { NextRequest, NextResponse } from "next/server";

/* ---------------- JWT Helpers (Self-contained) ---------------- */
function decodeJwtSub(token: string | null | undefined): number | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payloadPart = parts[1];
    const payloadB64 = payloadPart
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payloadPart.length / 4) * 4, "=");
    const json = Buffer.from(payloadB64, "base64").toString("utf8");
    const payload = JSON.parse(json);
    const sub = payload?.sub;
    const n = Number(sub);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function getJwtSubFromReq(req: NextRequest): number | null {
  const token = req.cookies.get("vos_access_token")?.value ?? null;
  return decodeJwtSub(token);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPSTREAM = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
const SPRING_BASE = (process.env.SPRING_API_BASE_URL || "").replace(/\/+$/, "");
const STATIC_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || "";

/* ---------------- Helpers ---------------- */
function authHeaders() {
  const h: Record<string, string> = {};
  if (STATIC_TOKEN) h.Authorization = `Bearer ${STATIC_TOKEN}`;
  return h;
}

async function upstreamJson<T>(url: string): Promise<{ ok: boolean, data?: T, error?: unknown }> {
  try {
    const res = await fetch(url, {
      headers: authHeaders(),
      cache: "no-store",
    });

    if (!res.ok) {
      return { ok: false, error: `Upstream error: ${res.status}` };
    }

    const json = await res.json();
    return { ok: true, data: json };
  } catch (e) {
    return { ok: false, error: e };
  }
}

/**
 * Fetch all sales data from Spring Boot
 */
async function fetchAllSalesData(startDate?: string, endDate?: string, token?: string) {
  if (!SPRING_BASE) return [];

  const url = new URL(`${SPRING_BASE}/api/view-sales-performance/all`);
  if (startDate) url.searchParams.append("startDate", startDate);
  if (endDate) url.searchParams.append("endDate", endDate);

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url.toString(), {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error("Spring Fetch Error:", e);
    return [];
  }
}

/* ---------------- Main Route ---------------- */
export async function GET(req: NextRequest) {
  const sub = getJwtSubFromReq(req);
  if (!sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  // 1. Check Full Access Roles (Executive, Division Head, Approver)
  const checks = [
    `items/executive?filter[user_id][_eq]=${sub}&filter[is_deleted][_eq]=0&limit=1`,
    `items/division_sales_head?filter[user_id][_eq]=${sub}&filter[is_deleted][_eq]=0&limit=1`,
    `items/target_setting_approver?filter[approver_id][_eq]=${sub}&filter[is_deleted][_eq]=0&limit=1`
  ];

  try {
    const results = await Promise.all(checks.map(path => upstreamJson<{ data: Record<string, unknown>[] }>(`${UPSTREAM}/${path}`)));

    const hasFullAccess = results.some(r => r.ok && Array.isArray(r.data?.data) && r.data!.data.length > 0);

    if (hasFullAccess) {
      const token = req.cookies.get("vos_access_token")?.value;
      const data = await fetchAllSalesData(startDate, endDate, token);
      return NextResponse.json(data);
    }

    // 2. Check Supervisor Role (Restricted Access)
    const spdRes = await upstreamJson<{ data: Record<string, unknown>[] }>(
      `${UPSTREAM}/items/supervisor_per_division?filter[supervisor_id][_eq]=${sub}&filter[is_deleted][_eq]=0&fields=id`
    );

    const supervisorRecords = spdRes.data?.data || [];

    if (supervisorRecords.length > 0) {
      const spdIds = supervisorRecords.map((r: Record<string, unknown>) => r.id);
      const spsRes = await upstreamJson<{ data: Record<string, unknown>[] }>(
        `${UPSTREAM}/items/salesman_per_supervisor?filter[supervisor_per_division_id][_in]=${spdIds.join(",")}&filter[is_deleted][_eq]=0&fields=salesman_id`
      );

      const assignedSalesmanIds = new Set((spsRes.data?.data || []).map((r: Record<string, unknown>) => Number(r.salesman_id)));

      const token = req.cookies.get("vos_access_token")?.value;
      const allData = await fetchAllSalesData(startDate, endDate, token);

      const filteredData = Array.isArray(allData)
        ? allData.filter((row: Record<string, unknown>) => assignedSalesmanIds.has(Number(row.salesmanId)))
        : [];

      return NextResponse.json(filteredData);
    }

    return NextResponse.json([]);

  } catch (error) {
    console.error("RBAC implementation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
