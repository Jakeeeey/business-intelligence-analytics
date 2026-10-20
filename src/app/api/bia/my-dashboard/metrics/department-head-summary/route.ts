import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "vos_access_token";

type AnyRec = Record<string, unknown>;

export interface DepartmentHeadSummaryData {
  departmentId: number;
  departmentName: string;
  departmentHeadName: string;
  todayDate: string;
  totalEmployees: number;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  attendanceRate: number;
  onTimeCount: number;
  lateCount: number;
  punctualityRate: number;
  availableDepartments: Array<{ id: number; name: string }>;
}

interface CachedPayload {
  data: DepartmentHeadSummaryData;
  timestamp: number;
}

const cacheMap = new Map<string, CachedPayload>();
const CACHE_TTL_MS = 30000; // 30s

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    let s = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    const json = Buffer.from(s, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function fetchDirectus<T>(url: string, headers: Record<string, string>): Promise<T[]> {
  try {
    const res = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(6000) });
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
  const requestedDeptId = searchParams.get("departmentId");

  const now = new Date();
  const ny = now.getFullYear();
  const nm = String(now.getMonth() + 1).padStart(2, "0");
  const nd = String(now.getDate()).padStart(2, "0");
  const todayStr = `${ny}-${nm}-${nd}`;

  try {
    // 1. Fetch all departments
    const rawDepts = await fetchDirectus<AnyRec>(
      `${baseUrl}/items/department?limit=-1&fields=department_id,department_name,department_head,department_head_id`,
      headers
    );

    const availableDepartments = rawDepts
      .map((d) => ({
        id: Number(d.department_id),
        name: String(d.department_name || `Department #${d.department_id}`),
        head: d.department_head ? String(d.department_head) : null,
      }))
      .filter((d) => d.id > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    // 2. Resolve target department
    let targetDeptId: number | null = requestedDeptId ? Number(requestedDeptId) : null;

    if (!targetDeptId && token) {
      const jwt = decodeJwt(token);
      const userId = jwt?.id || jwt?.user_id || jwt?.sub;
      if (userId) {
        const userRes = await fetch(`${baseUrl}/items/user/${userId}?fields=user_id,user_department,is_department_head,user_fname,user_lname`, {
          headers,
          cache: "no-store",
          signal: AbortSignal.timeout(4000),
        }).catch(() => null);

        if (userRes && userRes.ok) {
          const userJson = await userRes.json().catch(() => null);
          const uDept = userJson?.data?.user_department;
          if (uDept) {
            targetDeptId = Number(uDept);
          }
        }
      }
    }

    if (!targetDeptId) {
      targetDeptId = availableDepartments[0]?.id || 1;
    }

    const cacheKey = `dept_${targetDeptId}`;
    if (!force) {
      const cached = cacheMap.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return NextResponse.json(cached.data);
      }
    }

    const currentDept = availableDepartments.find((d) => d.id === targetDeptId) || {
      id: targetDeptId,
      name: `Department #${targetDeptId}`,
      head: "Unassigned",
    };

    // 3. Concurrently fetch department roster, today's attendance logs, and today's approved leaves
    const [roster, attendanceLogs, leaveRequests] = await Promise.all([
      fetchDirectus<AnyRec>(
        `${baseUrl}/items/user?filter[user_department][_eq]=${targetDeptId}&filter[is_employee][_eq]=1&limit=-1&fields=user_id,user_fname,user_lname,user_department,is_employee,separation_date`,
        headers
      ),
      fetchDirectus<AnyRec>(
        `${baseUrl}/items/attendance_log?filter[department_id][_eq]=${targetDeptId}&filter[log_date][_eq]=${todayStr}&limit=-1&fields=log_id,user_id,department_id,log_date,status,time_in,time_out`,
        headers
      ),
      fetchDirectus<AnyRec>(
        `${baseUrl}/items/leave_request?filter[department_id][_eq]=${targetDeptId}&filter[status][_eq]=approved&filter[leave_start][_lte]=${todayStr}&filter[leave_end][_gte]=${todayStr}&limit=-1&fields=leave_id,user_id,department_id,leave_type,leave_start,leave_end,status`,
        headers
      ),
    ]);

    // Active employees
    const activeEmployees = roster.filter((u) => {
      if (u.separation_date && String(u.separation_date).slice(0, 10) <= todayStr) {
        return false;
      }
      return true;
    });

    const totalEmployees = activeEmployees.length > 0 ? activeEmployees.length : 0;
    const activeUserIdSet = new Set(activeEmployees.map((u) => Number(u.user_id)));

    // Present employees today
    const presentUserIdSet = new Set<number>();
    attendanceLogs.forEach((log) => {
      const uid = Number(log.user_id);
      if (uid && (activeUserIdSet.size === 0 || activeUserIdSet.has(uid))) {
        presentUserIdSet.add(uid);
      }
    });

    const presentCount = presentUserIdSet.size;

    // Approved leaves today
    const leaveUserIdSet = new Set<number>();
    leaveRequests.forEach((l) => {
      const uid = Number(l.user_id);
      if (uid && (activeUserIdSet.size === 0 || activeUserIdSet.has(uid))) {
        leaveUserIdSet.add(uid);
      }
    });

    const leaveCount = leaveUserIdSet.size;

    // Absent employees
    const absentCount = Math.max(0, totalEmployees - presentCount - leaveCount);
    const attendanceRate = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0;

    // Punctuality
    let onTimeCount = 0;
    let lateCount = 0;

    attendanceLogs.forEach((log) => {
      const st = String(log.status || "").trim().toLowerCase();
      if (st.includes("on time") || st === "ontime") {
        onTimeCount++;
      } else if (st.includes("late")) {
        lateCount++;
      } else if (st.includes("undertime")) {
        // default undertime
        lateCount++;
      } else {
        // fallback to on time
        onTimeCount++;
      }
    });

    const punctualityRate =
      presentCount > 0 ? Math.round((onTimeCount / (onTimeCount + lateCount || presentCount)) * 100) : 0;

    // Department Head display name
    let headName = currentDept.head || "Not Assigned";
    if (/^\d+$/.test(headName)) {
      const headUser = activeEmployees.find((u) => Number(u.user_id) === Number(headName));
      if (headUser) {
        headName = `${headUser.user_fname || ""} ${headUser.user_lname || ""}`.trim();
      } else {
        const headRes = await fetch(`${baseUrl}/items/user/${headName}?fields=user_fname,user_lname`, {
          headers,
          cache: "no-store",
          signal: AbortSignal.timeout(3000),
        }).catch(() => null);
        if (headRes && headRes.ok) {
          const headJson = await headRes.json().catch(() => null);
          if (headJson?.data) {
            const fn = headJson.data.user_fname || "";
            const ln = headJson.data.user_lname || "";
            const resolved = `${fn} ${ln}`.trim();
            if (resolved) headName = resolved;
          }
        }
      }
    }

    const payload: DepartmentHeadSummaryData = {
      departmentId: targetDeptId,
      departmentName: currentDept.name,
      departmentHeadName: headName,
      todayDate: todayStr,
      totalEmployees,
      presentCount,
      absentCount,
      leaveCount,
      attendanceRate,
      onTimeCount,
      lateCount,
      punctualityRate,
      availableDepartments: availableDepartments.map((d) => ({ id: d.id, name: d.name })),
    };

    cacheMap.set(cacheKey, { data: payload, timestamp: Date.now() });

    return NextResponse.json(payload);
  } catch (err: unknown) {
    console.error("[Department Head Summary API Error]:", err);
    return NextResponse.json(
      { error: "Failed to fetch department head summary", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
