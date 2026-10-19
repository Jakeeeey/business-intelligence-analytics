import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "vos_access_token";

type AnyRec = Record<string, unknown>;

export interface PunctualityDonutSegment {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface CompanyPunctualityReportData {
  todayDate: string;
  totalEmployees: number;
  presentCount: number;
  onTimeCount: number;
  lateCount: number;
  punctualityRate: number;
  lateRate: number;
  chartData: PunctualityDonutSegment[];
}

interface CachedPayload {
  data: CompanyPunctualityReportData;
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
    // 1. Fetch active employees and today's attendance logs
    const [roster, attendanceLogs] = await Promise.all([
      fetchDirectus<AnyRec>(
        `${baseUrl}/items/user?filter[is_employee][_eq]=1&limit=-1&fields=user_id,user_fname,user_lname,user_department,is_employee,separation_date`,
        headers
      ),
      fetchDirectus<AnyRec>(
        `${baseUrl}/items/attendance_log?filter[log_date][_eq]=${todayStr}&limit=-1&fields=log_id,user_id,department_id,log_date,status,time_in,time_out`,
        headers
      ),
    ]);

    // 2. Filter active employees
    const activeEmployees = roster.filter((u) => {
      if (u.is_employee === false || u.is_employee === 0 || u.is_employee === "0") {
        return false;
      }
      if (u.separation_date && String(u.separation_date).slice(0, 10) <= todayStr) {
        return false;
      }
      return true;
    });

    const totalEmployees = activeEmployees.length;
    const activeUserIdSet = new Set(activeEmployees.map((u) => Number(u.user_id)).filter((id) => id > 0));

    // 3. Process logs of active employees
    let onTimeCount = 0;
    let lateCount = 0;
    const presentUserIdSet = new Set<number>();

    attendanceLogs.forEach((log) => {
      const uid = Number(log.user_id);
      if (uid && activeUserIdSet.has(uid)) {
        presentUserIdSet.add(uid);
        const st = String(log.status || "").trim().toLowerCase();
        if (st.includes("on time") || st === "ontime") {
          onTimeCount++;
        } else if (st.includes("late") || st.includes("undertime")) {
          lateCount++;
        } else {
          onTimeCount++;
        }
      }
    });

    const presentCount = presentUserIdSet.size;
    const totalPunctualityLogged = onTimeCount + lateCount || presentCount;

    const punctualityRate =
      presentCount > 0 && totalPunctualityLogged > 0
        ? Math.round((onTimeCount / totalPunctualityLogged) * 100)
        : 0;

    const lateRate =
      presentCount > 0 && totalPunctualityLogged > 0
        ? Math.round((lateCount / totalPunctualityLogged) * 100)
        : 0;

    const chartData: PunctualityDonutSegment[] = [
      {
        name: "On Time",
        value: onTimeCount,
        percentage: punctualityRate,
        color: "#3b82f6", // blue-500
      },
      {
        name: "Late",
        value: lateCount,
        percentage: lateRate,
        color: "#f59e0b", // amber-500
      },
    ];

    const payload: CompanyPunctualityReportData = {
      todayDate: todayStr,
      totalEmployees,
      presentCount,
      onTimeCount,
      lateCount,
      punctualityRate,
      lateRate,
      chartData,
    };

    cachedResult = {
      data: payload,
      timestamp: Date.now(),
    };

    return NextResponse.json(payload);
  } catch (err: unknown) {
    console.error("[company-punctuality-report] Route error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load punctuality report" },
      { status: 500 }
    );
  }
}
