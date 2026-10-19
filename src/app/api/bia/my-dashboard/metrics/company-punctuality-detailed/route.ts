import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "vos_access_token";

type AnyRec = Record<string, unknown>;

export interface EmployeePunctualityRankItem {
  userId: number;
  name: string;
  departmentName: string;
  onTimeCount: number;
  lateCount: number;
  totalDays: number;
  punctualityRate: number;
  timeIn?: string;
}

export interface CompanyPunctualityDetailedData {
  todayDate: string;
  monthDisplay: string;
  totalEmployees: number;
  today: {
    punctualityRate: number;
    presentCount: number;
    onTimeCount: number;
    lateCount: number;
    topEarly: EmployeePunctualityRankItem[];
    topLate: EmployeePunctualityRankItem[];
  };
  month: {
    punctualityRate: number;
    totalLogs: number;
    onTimeCount: number;
    lateCount: number;
    topEarly: EmployeePunctualityRankItem[];
    topLate: EmployeePunctualityRankItem[];
  };
}

interface CachedPayload {
  data: CompanyPunctualityDetailedData;
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

function formatTime(rawTime?: string | null): string {
  if (!rawTime) return "--:--";
  const s = String(rawTime).trim();
  const timePart = s.includes("T") ? s.split("T")[1].slice(0, 5) : s.slice(0, 5);
  const parts = timePart.split(":");
  if (parts.length < 2) return s;
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  if (isNaN(h)) return s;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
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
  const monthStartStr = `${ny}-${nm}-01`;
  const monthDisplay = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  try {
    // Fetch departments, users (active employees), and attendance logs for current month
    const [departments, roster, attendanceLogs] = await Promise.all([
      fetchDirectus<AnyRec>(
        `${baseUrl}/items/department?limit=-1&fields=department_id,department_name`,
        headers
      ),
      fetchDirectus<AnyRec>(
        `${baseUrl}/items/user?filter[is_employee][_eq]=1&limit=-1&fields=user_id,user_fname,user_lname,user_department,is_employee,separation_date`,
        headers
      ),
      fetchDirectus<AnyRec>(
        `${baseUrl}/items/attendance_log?filter[log_date][_gte]=${monthStartStr}&filter[log_date][_lte]=${todayStr}&limit=-1&fields=log_id,user_id,department_id,log_date,status,time_in,time_out`,
        headers
      ),
    ]);

    const deptMap = new Map<number, string>();
    departments.forEach((d) => {
      const did = Number(d.department_id);
      if (did) deptMap.set(did, String(d.department_name || `Dept #${did}`));
    });

    const activeEmployees = roster.filter((u) => {
      if (u.is_employee === false || u.is_employee === 0 || u.is_employee === "0") {
        return false;
      }
      if (u.separation_date && String(u.separation_date).slice(0, 10) <= todayStr) {
        return false;
      }
      return true;
    });

    const activeUserMap = new Map<
      number,
      { name: string; departmentName: string }
    >();

    activeEmployees.forEach((u) => {
      const uid = Number(u.user_id);
      if (uid > 0) {
        const fn = String(u.user_fname || "").trim();
        const ln = String(u.user_lname || "").trim();
        const name = `${fn} ${ln}`.trim() || `Employee #${uid}`;
        const deptId = Number(u.user_department);
        const departmentName = deptMap.get(deptId) || "General";
        activeUserMap.set(uid, { name, departmentName });
      }
    });

    const totalEmployees = activeEmployees.length;

    // Trackers for Today
    let todayOnTimeCount = 0;
    let todayLateCount = 0;
    const todayLogsByUserId = new Map<number, AnyRec>();

    // Trackers for Month-to-Date
    let monthOnTimeCount = 0;
    let monthLateCount = 0;
    let monthTotalLogs = 0;

    interface UserMonthStats {
      userId: number;
      name: string;
      departmentName: string;
      onTimeCount: number;
      lateCount: number;
      totalDays: number;
      earliestTimeIn?: string;
    }

    const userMonthStatsMap = new Map<number, UserMonthStats>();

    attendanceLogs.forEach((log) => {
      const uid = Number(log.user_id);
      if (!uid || !activeUserMap.has(uid)) return;

      const userMeta = activeUserMap.get(uid)!;
      const logDate = String(log.log_date || "").slice(0, 10);
      const st = String(log.status || "").trim().toLowerCase();
      const isLate = st.includes("late") || st.includes("undertime");
      const timeInStr = log.time_in ? String(log.time_in).trim() : undefined;

      monthTotalLogs++;
      if (isLate) {
        monthLateCount++;
      } else {
        monthOnTimeCount++;
      }

      let mStat = userMonthStatsMap.get(uid);
      if (!mStat) {
        mStat = {
          userId: uid,
          name: userMeta.name,
          departmentName: userMeta.departmentName,
          onTimeCount: 0,
          lateCount: 0,
          totalDays: 0,
        };
        userMonthStatsMap.set(uid, mStat);
      }

      mStat.totalDays++;
      if (isLate) {
        mStat.lateCount++;
      } else {
        mStat.onTimeCount++;
      }

      if (timeInStr && (!mStat.earliestTimeIn || timeInStr < mStat.earliestTimeIn)) {
        mStat.earliestTimeIn = timeInStr;
      }

      // Check if this log is for today
      if (logDate === todayStr) {
        todayLogsByUserId.set(uid, log);
        if (isLate) {
          todayLateCount++;
        } else {
          todayOnTimeCount++;
        }
      }
    });

    // 1. Process Today's Ranks
    const todayPresentCount = todayLogsByUserId.size;
    const todayPunctualityRate =
      todayPresentCount > 0
        ? Math.round((todayOnTimeCount / (todayOnTimeCount + todayLateCount || todayPresentCount)) * 100)
        : 0;

    const todayRankList: Array<{
      userId: number;
      name: string;
      departmentName: string;
      isLate: boolean;
      timeIn?: string;
    }> = [];

    todayLogsByUserId.forEach((log, uid) => {
      const userMeta = activeUserMap.get(uid);
      if (!userMeta) return;
      const st = String(log.status || "").trim().toLowerCase();
      const isLate = st.includes("late") || st.includes("undertime");
      const timeIn = log.time_in ? String(log.time_in) : undefined;
      todayRankList.push({
        userId: uid,
        name: userMeta.name,
        departmentName: userMeta.departmentName,
        isLate,
        timeIn,
      });
    });

    const todayTopEarly: EmployeePunctualityRankItem[] = todayRankList
      .filter((item) => !item.isLate)
      .sort((a, b) => String(a.timeIn || "99:99").localeCompare(String(b.timeIn || "99:99")))
      .slice(0, 3)
      .map((item) => ({
        userId: item.userId,
        name: item.name,
        departmentName: item.departmentName,
        onTimeCount: 1,
        lateCount: 0,
        totalDays: 1,
        punctualityRate: 100,
        timeIn: formatTime(item.timeIn),
      }));

    const todayTopLate: EmployeePunctualityRankItem[] = todayRankList
      .filter((item) => item.isLate)
      .sort((a, b) => String(b.timeIn || "00:00").localeCompare(String(a.timeIn || "00:00")))
      .slice(0, 3)
      .map((item) => ({
        userId: item.userId,
        name: item.name,
        departmentName: item.departmentName,
        onTimeCount: 0,
        lateCount: 1,
        totalDays: 1,
        punctualityRate: 0,
        timeIn: formatTime(item.timeIn),
      }));

    // 2. Process Month's Ranks
    const monthPunctualityRate =
      monthTotalLogs > 0
        ? Math.round((monthOnTimeCount / (monthOnTimeCount + monthLateCount || monthTotalLogs)) * 100)
        : 0;

    const allMonthStats = Array.from(userMonthStatsMap.values()).map((s) => ({
      ...s,
      punctualityRate: s.totalDays > 0 ? Math.round((s.onTimeCount / s.totalDays) * 100) : 0,
    }));

    // Top 3 Early (Most on-time check-ins MTD)
    const monthTopEarly: EmployeePunctualityRankItem[] = allMonthStats
      .filter((s) => s.onTimeCount > 0)
      .sort((a, b) => {
        if (b.onTimeCount !== a.onTimeCount) return b.onTimeCount - a.onTimeCount;
        if (b.punctualityRate !== a.punctualityRate) return b.punctualityRate - a.punctualityRate;
        return String(a.earliestTimeIn || "99:99").localeCompare(String(b.earliestTimeIn || "99:99"));
      })
      .slice(0, 3)
      .map((s) => ({
        userId: s.userId,
        name: s.name,
        departmentName: s.departmentName,
        onTimeCount: s.onTimeCount,
        lateCount: s.lateCount,
        totalDays: s.totalDays,
        punctualityRate: s.punctualityRate,
        timeIn: formatTime(s.earliestTimeIn),
      }));

    // Top 3 Always Late (Most late check-ins MTD)
    const monthTopLate: EmployeePunctualityRankItem[] = allMonthStats
      .filter((s) => s.lateCount > 0)
      .sort((a, b) => {
        if (b.lateCount !== a.lateCount) return b.lateCount - a.lateCount;
        return a.punctualityRate - b.punctualityRate;
      })
      .slice(0, 3)
      .map((s) => ({
        userId: s.userId,
        name: s.name,
        departmentName: s.departmentName,
        onTimeCount: s.onTimeCount,
        lateCount: s.lateCount,
        totalDays: s.totalDays,
        punctualityRate: s.punctualityRate,
        timeIn: formatTime(s.earliestTimeIn),
      }));

    const payload: CompanyPunctualityDetailedData = {
      todayDate: todayStr,
      monthDisplay,
      totalEmployees,
      today: {
        punctualityRate: todayPunctualityRate,
        presentCount: todayPresentCount,
        onTimeCount: todayOnTimeCount,
        lateCount: todayLateCount,
        topEarly: todayTopEarly,
        topLate: todayTopLate,
      },
      month: {
        punctualityRate: monthPunctualityRate,
        totalLogs: monthTotalLogs,
        onTimeCount: monthOnTimeCount,
        lateCount: monthLateCount,
        topEarly: monthTopEarly,
        topLate: monthTopLate,
      },
    };

    cachedResult = {
      data: payload,
      timestamp: Date.now(),
    };

    return NextResponse.json(payload);
  } catch (err: unknown) {
    console.error("[company-punctuality-detailed] Route error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load punctuality detailed report" },
      { status: 500 }
    );
  }
}
