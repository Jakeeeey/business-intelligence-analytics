import { NextRequest, NextResponse } from "next/server";
import { getJwtSubFromReq } from "@/lib/directus";

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

async function upstreamJson<T>(url: string): Promise<{ ok: boolean, data?: T, error?: any }> {
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
  // We check existence in these tables for the current user.
  const checks = [
    `items/executive?filter[user_id][_eq]=${sub}&filter[is_deleted][_eq]=0&limit=1`,
    `items/division_sales_head?filter[user_id][_eq]=${sub}&filter[is_deleted][_eq]=0&limit=1`,
    `items/target_setting_approver?filter[approver_id][_eq]=${sub}&filter[is_deleted][_eq]=0&limit=1`
  ];

  try {
    const results = await Promise.all(checks.map(path => upstreamJson<{ data: any[] }>(`${UPSTREAM}/${path}`)));

    const hasFullAccess = results.some(r => r.ok && Array.isArray(r.data?.data) && r.data!.data.length > 0);

    if (hasFullAccess) {
      // Fetch all data
      const token = req.cookies.get("vos_access_token")?.value;
      const data = await fetchAllSalesData(startDate, endDate, token);
      return NextResponse.json(data);
    }

    // 2. Check Supervisor Role (Restricted Access)
    const spdRes = await upstreamJson<{ data: any[] }>(
      `${UPSTREAM}/items/supervisor_per_division?filter[supervisor_id][_eq]=${sub}&filter[is_deleted][_eq]=0&fields=id`
    );

    const supervisorRecords = spdRes.data?.data || [];

    if (supervisorRecords.length > 0) {
      // Get linked salesmen
      const spdIds = supervisorRecords.map((r: any) => r.id);
      const spsRes = await upstreamJson<{ data: any[] }>(
        `${UPSTREAM}/items/salesman_per_supervisor?filter[supervisor_per_division_id][_in]=${spdIds.join(",")}&filter[is_deleted][_eq]=0&fields=salesman_id`
      );

      const assignedSalesmanIds = new Set((spsRes.data?.data || []).map((r: any) => Number(r.salesman_id)));

      // Fetch all data and filter
      const token = req.cookies.get("vos_access_token")?.value;
      const allData = await fetchAllSalesData(startDate, endDate, token);

      // Filter logic: Keep record if salesmanId is in assigned set
      const filteredData = Array.isArray(allData)
        ? allData.filter((row: any) => assignedSalesmanIds.has(Number(row.salesmanId)))
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
import { NextRequest, NextResponse } from "next/server";
import { getJwtSubFromReq } from "@/lib/directus";

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

async function upstreamJson<T>(url: string): Promise<{ ok: boolean, data?: T, error?: any }> {
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
  // We check existence in these tables for the current user.
  const checks = [
    `items/executive?filter[user_id][_eq]=${sub}&filter[is_deleted][_eq]=0&limit=1`,
    `items/division_sales_head?filter[user_id][_eq]=${sub}&filter[is_deleted][_eq]=0&limit=1`,
    `items/target_setting_approver?filter[approver_id][_eq]=${sub}&filter[is_deleted][_eq]=0&limit=1`
  ];

  try {
    const results = await Promise.all(checks.map(path => upstreamJson<{ data: any[] }>(`${UPSTREAM}/${path}`)));

    const hasFullAccess = results.some(r => r.ok && Array.isArray(r.data?.data) && r.data!.data.length > 0);

    if (hasFullAccess) {
      // Fetch all data
      const token = req.cookies.get("vos_access_token")?.value;
      const data = await fetchAllSalesData(startDate, endDate, token);
      return NextResponse.json(data);
    }

    // 2. Check Supervisor Role (Restricted Access)
    const spdRes = await upstreamJson<{ data: any[] }>(
      `${UPSTREAM}/items/supervisor_per_division?filter[supervisor_id][_eq]=${sub}&filter[is_deleted][_eq]=0&fields=id`
    );

    const supervisorRecords = spdRes.data?.data || [];

    if (supervisorRecords.length > 0) {
      // Get linked salesmen
      const spdIds = supervisorRecords.map((r: any) => r.id);
      const spsRes = await upstreamJson<{ data: any[] }>(
        `${UPSTREAM}/items/salesman_per_supervisor?filter[supervisor_per_division_id][_in]=${spdIds.join(",")}&filter[is_deleted][_eq]=0&fields=salesman_id`
      );

      const assignedSalesmanIds = new Set((spsRes.data?.data || []).map((r: any) => Number(r.salesman_id)));

      // Fetch all data and filter
      const token = req.cookies.get("vos_access_token")?.value;
      const allData = await fetchAllSalesData(startDate, endDate, token);

      // Filter logic: Keep record if salesmanId is in assigned set
      const filteredData = Array.isArray(allData)
        ? allData.filter((row: any) => assignedSalesmanIds.has(Number(row.salesmanId)))
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
