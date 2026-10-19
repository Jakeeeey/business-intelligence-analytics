import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "vos_access_token";

type AnyRec = Record<string, unknown>;

export interface AttendanceDonutSegment {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface CompanyAttendanceReportData {
  todayDate: string;
  totalEmployees: number;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  attendanceRate: number;
  absentRate: number;
  leaveRate: number;
  chartData: AttendanceDonutSegment[];
}

interface CachedPayload {
  data: CompanyAttendanceReportData;
  timestamp: number;
}

let cachedResult: CachedPayload | null = null;
const CACHE_TTL_MS = 30000; // 30s

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

  try {
    // 1. Concurrently fetch all employees, today's attendance logs, and today's approved leaves
    const [roster, attendanceLogs, leaveRequests] = await Promise.all([
      fetchDirectus<AnyRec>(
        `${baseUrl}/items/user?filter[is_employee][_eq]=1&limit=-1&fields=user_id,user_fname,user_lname,user_department,is_employee,separation_date`,
        headers
      ),
      fetchDirectus<AnyRec>(
        `${baseUrl}/items/attendance_log?filter[log_date][_eq]=${todayStr}&limit=-1&fields=log_id,user_id,department_id,log_date,status,time_in,time_out`,
        headers
      ),
      fetchDirectus<AnyRec>(
        `${baseUrl}/items/leave_request?filter[status][_eq]=approved&filter[leave_start][_lte]=${todayStr}&filter[leave_end][_gte]=${todayStr}&limit=-1&fields=leave_id,user_id,status,leave_type`,
        headers
      ),
    ]);

    // 2. Filter active employees only
    const activeEmployees = roster.filter((u) => {
      // Must be marked as employee
      if (u.is_employee === false || u.is_employee === 0 || u.is_employee === "0") {
        return false;
      }
      // Must not be separated
      if (u.separation_date && String(u.separation_date).slice(0, 10) <= todayStr) {
        return false;
      }
      return true;
    });

    const totalEmployees = activeEmployees.length;
    const activeUserIdSet = new Set(activeEmployees.map((u) => Number(u.user_id)).filter((id) => id > 0));

    // 3. Count unique active employees present today
    const presentUserIdSet = new Set<number>();
    attendanceLogs.forEach((log) => {
      const uid = Number(log.user_id);
      if (uid && activeUserIdSet.has(uid)) {
        presentUserIdSet.add(uid);
      }
    });

    const presentCount = presentUserIdSet.size;

    // 4. Count unique active employees on approved leave today (excluding those already clocked in)
    const leaveUserIdSet = new Set<number>();
    leaveRequests.forEach((l) => {
      const uid = Number(l.user_id);
      if (uid && activeUserIdSet.has(uid) && !presentUserIdSet.has(uid)) {
        leaveUserIdSet.add(uid);
      }
    });

    const leaveCount = leaveUserIdSet.size;

    // 5. Calculate absentees
    const absentCount = Math.max(0, totalEmployees - presentCount - leaveCount);

    const attendanceRate = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0;
    const absentRate = totalEmployees > 0 ? Math.round((absentCount / totalEmployees) * 100) : 0;
    const leaveRate = totalEmployees > 0 ? Math.round((leaveCount / totalEmployees) * 100) : 0;

    const chartData: AttendanceDonutSegment[] = [
      {
        name: "Present",
        value: presentCount,
        percentage: attendanceRate,
        color: "#10b981", // emerald-500
      },
      {
        name: "Absent",
        value: absentCount,
        percentage: absentRate,
        color: "#f43f5e", // rose-500
      },
    ];

    if (leaveCount > 0) {
      chartData.push({
        name: "On Leave",
        value: leaveCount,
        percentage: leaveRate,
        color: "#a855f7", // purple-500
      });
    }

    const payload: CompanyAttendanceReportData = {
      todayDate: todayStr,
      totalEmployees,
      presentCount,
      absentCount,
      leaveCount,
      attendanceRate,
      absentRate,
      leaveRate,
      chartData,
    };

    cachedResult = {
      data: payload,
      timestamp: Date.now(),
    };

    return NextResponse.json(payload);
  } catch (err: unknown) {
    console.error("[company-attendance-report] Route error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load company attendance report" },
      { status: 500 }
    );
  }
}
