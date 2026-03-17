import { NextRequest, NextResponse } from "next/server";
import { getJwtSubFromReq } from "@/lib/directus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPSTREAM = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
const SPRING_BASE = (process.env.SPRING_API_BASE_URL || "").replace(/\/+$/, "");
const STATIC_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || "";

/* ---------------- Types & Interfaces ---------------- */

// Generic wrapper for Directus responses
interface DirectusResponse<T> {
  data: T[];
}

// Minimal shape for Supervisor records
interface SupervisorPerDivision {
  id: string | number;
}

// Minimal shape for Salesman records
interface SalesmanPerSupervisor {
  salesman_id: string | number;
}

// Shape for Spring Boot Sales Data
// We strictly define 'salesmanId' since we need it for filtering,
// and use 'unknown' for the rest of the payload so we don't drop fields.
interface SalesData {
  salesmanId: string | number;
  [key: string]: unknown;
}

/* ---------------- Helpers ---------------- */

function authHeaders() {
  const h: Record<string, string> = {};
  if (STATIC_TOKEN) h.Authorization = `Bearer ${STATIC_TOKEN}`;
  return h;
}

// Changed error from 'any' to 'unknown'
async function upstreamJson<T>(url: string): Promise<{ ok: boolean, data?: T, error?: unknown }> {
  try {
    const res = await fetch(url, {
      headers: authHeaders(),
      cache: "no-store",
    });

    if (!res.ok) {
      return { ok: false, error: `Upstream error: ${res.status}` };
    }

    const json = (await res.json()) as T;
    return { ok: true, data: json };
  } catch (e) {
    return { ok: false, error: e };
  }
}

/**
 * Fetch sales data from Spring Boot, optionally filtered by salesman IDs
 */
async function fetchAllSalesData(
    startDate?: string,
    endDate?: string,
    token?: string,
    salesmanIds?: number[]
): Promise<{ ok: boolean, data: SalesData[], error?: string }> {
  if (!SPRING_BASE) return { ok: false, data: [], error: "SPRING_BASE is not configured" };

  const url = new URL(`${SPRING_BASE}/api/view-sales-performance/all`);
  if (startDate) url.searchParams.append("startDate", startDate);
  if (endDate) url.searchParams.append("endDate", endDate);

  if (salesmanIds && salesmanIds.length > 0) {
    url.searchParams.append("salesmanIds", salesmanIds.join(","));
  }

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url.toString(), {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      return { ok: false, data: [], error: `Spring API returned ${res.status}` };
    }

    const json = (await res.json()) as SalesData[];
    return { ok: true, data: json };
  } catch (e) {
    console.error("Spring Fetch Error:", e);
    return { ok: false, data: [], error: "Failed to connect to Spring backend" };
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
  const token = req.cookies.get("vos_access_token")?.value;

  // 1. Check Full Access Roles (Executive, Division Head, Approver)
  const checks = [
    `items/executive?filter[user_id][_eq]=${sub}&filter[is_deleted][_eq]=0&limit=1`,
    `items/division_sales_head?filter[user_id][_eq]=${sub}&filter[is_deleted][_eq]=0&limit=1`,
    `items/target_setting_approver?filter[approver_id][_eq]=${sub}&filter[is_deleted][_eq]=0&limit=1`
  ];

  try {
    // We only care if the array has items, so a generic Record is sufficient here
    const results = await Promise.all(
        checks.map(path => upstreamJson<DirectusResponse<Record<string, unknown>>>(`${UPSTREAM}/${path}`))
    );

    const hasFullAccess = results.some(r => r.ok && Array.isArray(r.data?.data) && r.data.data.length > 0);

    if (hasFullAccess) {
      const result = await fetchAllSalesData(startDate, endDate, token);

      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
      return NextResponse.json(result.data);
    }

    // 2. Check Supervisor Role (Restricted Access)
    const spdRes = await upstreamJson<DirectusResponse<SupervisorPerDivision>>(
        `${UPSTREAM}/items/supervisor_per_division?filter[supervisor_id][_eq]=${sub}&filter[is_deleted][_eq]=0&fields=id&limit=-1`
    );

    const supervisorRecords = spdRes.data?.data || [];

    if (supervisorRecords.length > 0) {
      const spdIds = supervisorRecords.map((r) => r.id);

      const spsRes = await upstreamJson<DirectusResponse<SalesmanPerSupervisor>>(
          `${UPSTREAM}/items/salesman_per_supervisor?filter[supervisor_per_division_id][_in]=${spdIds.join(",")}&filter[is_deleted][_eq]=0&fields=salesman_id&limit=-1`
      );

      const assignedSalesmanIdsArray = (spsRes.data?.data || []).map((r) => Number(r.salesman_id));

      if (assignedSalesmanIdsArray.length === 0) {
        return NextResponse.json([]); // No salesmen assigned, return empty early
      }

      // Fetch data, passing the allowed IDs to Spring Boot
      const result = await fetchAllSalesData(startDate, endDate, token, assignedSalesmanIdsArray);

      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });

      // Fallback filter
      const assignedSalesmanIdsSet = new Set(assignedSalesmanIdsArray);
      const filteredData = Array.isArray(result.data)
          ? result.data.filter((row) => assignedSalesmanIdsSet.has(Number(row.salesmanId)))
          : [];

      return NextResponse.json(filteredData);
    }

    // 3. No Access
    return NextResponse.json([]);

  } catch (error) {
    console.error("RBAC implementation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}