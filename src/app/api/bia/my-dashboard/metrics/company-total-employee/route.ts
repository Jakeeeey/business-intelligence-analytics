import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "vos_access_token";

type AnyRec = Record<string, unknown>;

export interface DepartmentHeadcountSummary {
  name: string;
  count: number;
}

export interface CompanyTotalEmployeeData {
  todayDate: string;
  totalActive: number;
  totalDepartments: number;
  newHiresThisMonth: number;
  topDepartments: DepartmentHeadcountSummary[];
}

interface CachedPayload {
  data: CompanyTotalEmployeeData;
  timestamp: number;
}

let cachedResult: CachedPayload | null = null;
const CACHE_TTL_MS = 30000; // 30s

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

async function fetchDirectus<T>(url: string, headers: Record<string, string>): Promise<T[]> {
  try {
    const res = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data || []) as T[];
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    cookieStore.get(COOKIE_NAME)?.value ||
    process.env.DIRECTUS_STATIC_TOKEN;

  const isAuthDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";
  if (!token && !isAuthDisabled) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  const staticToken = process.env.DIRECTUS_STATIC_TOKEN;

  if (!baseUrl) {
    return NextResponse.json({ error: "API base URL not configured" }, { status: 500 });
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (staticToken) headers["Authorization"] = `Bearer ${staticToken}`;
  else if (token) headers["Authorization"] = `Bearer ${token}`;

  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "true";

  if (!force && cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cachedResult.data);
  }

  const now = new Date();
  const ny = now.getFullYear();
  const nm = String(now.getMonth() + 1).padStart(2, "0");
  const nd = String(now.getDate()).padStart(2, "0");
  const todayStr = `${ny}-${nm}-${nd}`;
  const currentMonthPrefix = `${ny}-${nm}`;

  try {
    const [departments, roster] = await Promise.all([
      fetchDirectus<AnyRec>(
        `${baseUrl}/items/department?limit=-1&fields=department_id,department_name`,
        headers
      ),
      fetchDirectus<AnyRec>(
        `${baseUrl}/items/user?filter[is_employee][_eq]=1&limit=-1&fields=user_id,user_department,is_employee,separation_date,user_dateOfHire,is_deleted,isDeleted`,
        headers
      ),
    ]);

    const deptMap = new Map<number, string>();
    departments.forEach((d) => {
      const did = Number(d.department_id);
      if (did) deptMap.set(did, String(d.department_name || `Dept #${did}`).trim());
    });

    const activeDeptCountMap = new Map<string, number>();
    let totalActive = 0;
    let newHiresThisMonth = 0;

    roster.forEach((u) => {
      // Deletion check
      if (parseBit(u.is_deleted) || parseBit(u.isDeleted)) return;

      // Employee check
      if (u.is_employee === false || u.is_employee === 0 || u.is_employee === "0") {
        return false;
      }

      // Separation date check
      if (u.separation_date && String(u.separation_date).slice(0, 10) <= todayStr) {
        return;
      }

      totalActive++;

      // New hire check
      if (u.user_dateOfHire && String(u.user_dateOfHire).slice(0, 7) === currentMonthPrefix) {
        newHiresThisMonth++;
      }

      // Department breakdown
      const deptId = Number(u.user_department);
      const deptName = (deptId ? deptMap.get(deptId) : null) || "Unassigned";
      activeDeptCountMap.set(deptName, (activeDeptCountMap.get(deptName) || 0) + 1);
    });

    const topDepartments: DepartmentHeadcountSummary[] = Array.from(activeDeptCountMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const payload: CompanyTotalEmployeeData = {
      todayDate: todayStr,
      totalActive,
      totalDepartments: activeDeptCountMap.size,
      newHiresThisMonth,
      topDepartments,
    };

    cachedResult = {
      data: payload,
      timestamp: Date.now(),
    };

    return NextResponse.json(payload);
  } catch (err: unknown) {
    console.error("[company-total-employee] Route error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load total employee count" },
      { status: 500 }
    );
  }
}
