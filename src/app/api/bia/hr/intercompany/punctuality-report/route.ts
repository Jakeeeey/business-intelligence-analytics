import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  IntercompanyPunctualityData,
  IntercompanyPunctualityKpis,
  CompanyPunctualitySummary,
  DepartmentPunctualitySummary,
  DailyPunctualityTrendPoint,
  PunctualityDistributionSegment,
  PunctualityLeaderboardItem,
  IntercompanyPunctualityRecord,
  CompanyFilterOption,
  PunctualityStatus,
} from "@/modules/business-intelligence-analytics/hr/intercompany/punctuality-report/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "vos_access_token";

type AnyRec = Record<string, unknown>;

interface CachedReport {
  data: IntercompanyPunctualityData;
  timestamp: number;
}

const memoryCache = new Map<string, CachedReport>();
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

async function fetchDirectusWithTimeout<T>(
  url: string,
  headers: Record<string, string>,
  timeoutMs = 5000
): Promise<T[]> {
  try {
    const res = await fetch(url, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? (json.data as T[]) : [];
  } catch {
    return [];
  }
}

function formatTimeString(isoOrTimeString: unknown): string | null {
  if (!isoOrTimeString || typeof isoOrTimeString !== "string") return null;
  const str = isoOrTimeString.trim();
  if (!str) return null;

  if (str.includes("T")) {
    const timePart = str.split("T")[1];
    if (timePart) {
      const [hh, mm] = timePart.split(":");
      const hNum = parseInt(hh, 10);
      if (!isNaN(hNum)) {
        const ampm = hNum >= 12 ? "PM" : "AM";
        const formattedH = hNum % 12 || 12;
        return `${String(formattedH).padStart(2, "0")}:${mm || "00"} ${ampm}`;
      }
    }
  }

  if (str.includes(":")) {
    const [hh, mm] = str.split(":");
    const hNum = parseInt(hh, 10);
    if (!isNaN(hNum)) {
      const ampm = hNum >= 12 ? "PM" : "AM";
      const formattedH = hNum % 12 || 12;
      return `${String(formattedH).padStart(2, "0")}:${mm || "00"} ${ampm}`;
    }
  }

  return str;
}

function parseTimeToMinutes(rawTimeIn: unknown): number | null {
  if (!rawTimeIn || typeof rawTimeIn !== "string") return null;
  const s = rawTimeIn.trim();
  if (!s) return null;

  const timePart = s.includes("T") ? s.split("T")[1] : s;
  const match = timePart.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;

  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (isNaN(h) || isNaN(m)) return null;

  const upper = s.toUpperCase();
  if (upper.includes("PM") && h < 12) {
    h += 12;
  } else if (upper.includes("AM") && h === 12) {
    h = 0;
  }

  return h * 60 + m;
}

/**
 * Calculates late minutes past standard shift (8:00 AM = 480 mins from midnight)
 */
function calculateDelayMinutes(rawTimeIn: string | null | undefined, scheduledHour = 8, scheduledMinute = 0): number {
  const arrivalTotalMinutes = parseTimeToMinutes(rawTimeIn);
  if (arrivalTotalMinutes === null) return 0;

  const scheduledTotalMinutes = scheduledHour * 60 + scheduledMinute;

  if (arrivalTotalMinutes > scheduledTotalMinutes) {
    return arrivalTotalMinutes - scheduledTotalMinutes;
  }
  return 0;
}

/**
 * Calculates early minutes before standard shift (8:00 AM = 480 mins from midnight) when on-time
 */
function calculateEarlyMinutes(rawTimeIn: string | null | undefined, scheduledHour = 8, scheduledMinute = 0): number {
  const arrivalTotalMinutes = parseTimeToMinutes(rawTimeIn);
  if (arrivalTotalMinutes === null) return 0;

  const scheduledTotalMinutes = scheduledHour * 60 + scheduledMinute;

  if (arrivalTotalMinutes <= scheduledTotalMinutes) {
    return scheduledTotalMinutes - arrivalTotalMinutes;
  }
  return 0;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token =
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      cookieStore.get(COOKIE_NAME)?.value ||
      process.env.DIRECTUS_STATIC_TOKEN;

    const isAuthDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";
    if (!token && !isAuthDisabled) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const primaryBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
    const staticToken = process.env.DIRECTUS_STATIC_TOKEN || "";

    if (!primaryBaseUrl) {
      return NextResponse.json(
        { error: "Directus API base URL not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const defaultDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;

    const paramStartDate = searchParams.get("startDate")?.trim();
    const paramEndDate = searchParams.get("endDate")?.trim();
    const paramDate = searchParams.get("date")?.trim();
    const paramDates = searchParams.get("dates")?.trim();

    let targetDates: string[] = [];

    if (paramDates) {
      targetDates = paramDates
        .split(",")
        .map((d) => d.trim().slice(0, 10))
        .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
    } else if (paramStartDate && paramEndDate) {
      let cur = new Date(paramStartDate);
      let end = new Date(paramEndDate);
      if (cur > end) {
        const temp = cur;
        cur = end;
        end = temp;
      }
      let count = 0;
      while (cur <= end && count < 62) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, "0");
        const d = String(cur.getDate()).padStart(2, "0");
        targetDates.push(`${y}-${m}-${d}`);
        cur.setDate(cur.getDate() + 1);
        count++;
      }
    } else if (paramDate) {
      targetDates = [paramDate.slice(0, 10)];
    }

    if (targetDates.length === 0) {
      targetDates = [defaultDate];
    }

    targetDates = Array.from(new Set(targetDates)).sort();
    const isSingleDate = targetDates.length === 1;
    const startDate = targetDates[0];
    const endDate = targetDates[targetDates.length - 1];
    const force = searchParams.get("force") === "true";

    const cacheKey = `punc_${startDate}_${endDate}_${targetDates.join(",")}`;
    if (!force && memoryCache.has(cacheKey)) {
      const cached = memoryCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return NextResponse.json(cached.data);
      }
    }

    const primaryHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (staticToken) primaryHeaders["Authorization"] = `Bearer ${staticToken}`;
    else if (token) primaryHeaders["Authorization"] = `Bearer ${token}`;

    // 1. Fetch company_list from primary Directus
    const companiesRaw = await fetchDirectusWithTimeout<AnyRec>(
      `${primaryBaseUrl}/items/company_list?limit=-1&fields=company_id,company_name,company_code,directus,directus_token,status,is_default,is_mother_company`,
      primaryHeaders,
      6000
    );

    const validCompanies = companiesRaw.filter((c) => {
      if (!c.directus || typeof c.directus !== "string" || !c.directus.trim()) return false;
      if (String(c.status || "ACTIVE").toUpperCase() === "INACTIVE") return false;
      return true;
    });

    const userFields =
      "user_id,user_fname,user_lname,user_mname,suffix_name,user_department,user_position,user_email,user_contact,user_image,is_employee,separation_date,separation_cause,gender,is_deleted,isDeleted,employment_status_id";

    // 2. Concurrently query each company's active employees, departments, attendance logs, and leave requests
    const companyFetchResults = await Promise.allSettled(
      validCompanies.map(async (company) => {
        const companyId = Number(company.company_id);
        const companyName = String(company.company_name || `Company #${companyId}`).trim();
        const companyCode = String(company.company_code || `CMP-${companyId}`).trim();
        const companyUrl = String(company.directus).replace(/\/+$/, "");
        const companyToken = (company.directus_token as string) || staticToken || token;

        const compHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (companyToken) {
          compHeaders["Authorization"] = `Bearer ${companyToken}`;
        }

        const logFilter = isSingleDate
          ? `filter[log_date][_eq]=${startDate}`
          : `filter[log_date][_gte]=${startDate}&filter[log_date][_lte]=${endDate}`;

        const leaveFilter = `filter[status][_neq]=rejected&filter[leave_start][_lte]=${endDate}&filter[leave_end][_gte]=${startDate}`;

        const [usersRaw, departmentsRaw, statusesRaw, logsRaw, leavesRaw] = await Promise.all([
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/user?limit=-1&fields=${userFields}`,
            compHeaders,
            5000
          ),
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/department?limit=-1&fields=department_id,department_name`,
            compHeaders,
            4000
          ),
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/employment_status?limit=-1&fields=id,name`,
            compHeaders,
            4000
          ),
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/attendance_log?${logFilter}&limit=-1&fields=log_id,user_id,department_id,log_date,time_in,time_out,status,approve_status,image_time_in,image_time_out`,
            compHeaders,
            6000
          ),
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/leave_request?${leaveFilter}&limit=-1&fields=leave_id,user_id,status,leave_type,leave_start,leave_end,reason,total_days`,
            compHeaders,
            5000
          ),
        ]);

        return {
          companyId,
          companyName,
          companyCode,
          users: usersRaw,
          departments: departmentsRaw,
          employmentStatuses: statusesRaw,
          logs: logsRaw,
          leaves: leavesRaw,
        };
      })
    );

    // 3. Process aggregates
    const allRecords: IntercompanyPunctualityRecord[] = [];
    const companySummaries: CompanyPunctualitySummary[] = [];
    const companiesList: CompanyFilterOption[] = [];
    const allDepartmentsSet = new Set<string>();

    const deptStatsMap = new Map<
      string,
      { totalLogs: number; onTimeCount: number; lateCount: number; totalDelayMinutes: number }
    >();

    const dailyTrendMap = new Map<
      string,
      { totalLogs: number; onTimeCount: number; lateCount: number; totalDelayMinutes: number }
    >();
    targetDates.forEach((td) => {
      dailyTrendMap.set(td, { totalLogs: 0, onTimeCount: 0, lateCount: 0, totalDelayMinutes: 0 });
    });

    const userPunctualityMap = new Map<
      string,
      {
        userId: number;
        employeeId: string;
        name: string;
        companyCode: string;
        companyName: string;
        department: string;
        position: string;
        avatar: string | null;
        totalDays: number;
        onTimeDays: number;
        lateDays: number;
        totalDelayMinutes: number;
        totalEarlyMinutes: number;
        maxEarlyMinutes: number;
        earliestArrivalMinutes: number | null;
        earliestArrival?: string | null;
      }
    >();

    let totalStaffSum = 0;
    let grandPresentLogs = 0;
    let grandOnTime = 0;
    let grandTotalLate = 0;
    let grandGracePeriod = 0;
    let grandModerateLate = 0;
    let grandSevereLate = 0;
    let grandUndertime = 0;
    let grandTotalDelayMinutes = 0;
    let activeCompaniesCount = 0;

    for (const result of companyFetchResults) {
      if (result.status !== "fulfilled") continue;
      const {
        companyId,
        companyName,
        companyCode,
        users,
        departments,
        employmentStatuses,
        logs,
        leaves,
      } = result.value;

      activeCompaniesCount++;
      companiesList.push({ companyId, companyName, companyCode });

      // Department Map
      const deptMap = new Map<number, string>();
      departments.forEach((d) => {
        const id = Number(d.department_id);
        const name = String(d.department_name || "").trim();
        if (id && name) deptMap.set(id, name);
      });

      // Inactive Status IDs
      const inactiveStatusIds = new Set<number>();
      employmentStatuses.forEach((st) => {
        const name = String(st.name || "").toLowerCase();
        if (
          name.includes("inactive") ||
          name.includes("resigned") ||
          name.includes("terminated") ||
          name.includes("separated")
        ) {
          inactiveStatusIds.add(Number(st.id));
        }
      });

      // Filter active employees
      const activeEmployees = users.filter((u) => {
        const isEmployee = parseBit(u.is_employee);
        if (!isEmployee) return false;

        const isDel = parseBit(u.is_deleted) || parseBit(u.isDeleted);
        if (isDel) return false;

        const empStatusId = Number(u.employment_status_id);
        if (empStatusId && inactiveStatusIds.has(empStatusId)) return false;

        if (u.separation_date) {
          const sepStr = String(u.separation_date).slice(0, 10);
          if (sepStr <= startDate) return false;
        }

        return true;
      });

      totalStaffSum += activeEmployees.length;

      // Group logs by employee + date
      const logsByUserAndDate = new Map<string, AnyRec>();
      logs.forEach((log) => {
        const uid = Number(log.user_id);
        const lDate = String(log.log_date || "").slice(0, 10);
        if (uid && lDate) {
          logsByUserAndDate.set(`${uid}_${lDate}`, log);
        }
      });

      // Group leaves
      const leavesByUser = new Map<number, AnyRec[]>();
      leaves.forEach((l) => {
        const uid = Number(l.user_id);
        if (uid) {
          const cur = leavesByUser.get(uid) || [];
          cur.push(l);
          leavesByUser.set(uid, cur);
        }
      });

      let compLogsCount = 0;
      let compOnTime = 0;
      let compGrace = 0;
      let compModerate = 0;
      let compSevere = 0;
      let compLate = 0;
      let compUndertime = 0;
      let compDelayMinutes = 0;

      activeEmployees.forEach((emp) => {
        const userId = Number(emp.user_id);
        const deptId = emp.user_department ? Number(emp.user_department) : null;
        const deptName = (deptId ? deptMap.get(deptId) : null) || "General Operations";
        allDepartmentsSet.add(deptName);

        const fn = String(emp.user_fname || "").trim();
        const ln = String(emp.user_lname || "").trim();
        const mn = emp.user_mname ? String(emp.user_mname).trim() : "";
        const name = `${fn} ${ln}`.trim() || `Staff #${userId}`;
        const employeeId = `${companyCode}-${String(userId).padStart(4, "0")}`;
        const position = String(emp.user_position || "Team Member").trim();
        const email = String(emp.user_email || "").trim();
        const contact = String(emp.user_contact || "").trim();
        const gender = String(emp.gender || "Unspecified").trim();
        const avatar = emp.user_image ? String(emp.user_image) : null;

        targetDates.forEach((currentDate) => {
          const logKey = `${userId}_${currentDate}`;
          const log = logsByUserAndDate.get(logKey);

          // Leave check
          const userLeaves = leavesByUser.get(userId) || [];
          const activeLeave = userLeaves.find((l) => {
            const lStart = String(l.leave_start || "").slice(0, 10);
            const lEnd = String(l.leave_end || "").slice(0, 10);
            return currentDate >= lStart && currentDate <= lEnd;
          });

          let puncStatus: PunctualityStatus = "Absent";
          let timeInFormatted: string | null = null;
          let timeOutFormatted: string | null = null;
          let arrivalMinutes: number | null = null;
          let earlyMinutes = 0;
          let delayMinutes = 0;
          let undertimeMinutes = 0;

          if (log) {
            compLogsCount++;
            grandPresentLogs++;
            timeInFormatted = formatTimeString(log.time_in);
            timeOutFormatted = formatTimeString(log.time_out);
            const rawStatus = String(log.status || "").toLowerCase();

            arrivalMinutes = parseTimeToMinutes(log.time_in);
            delayMinutes = calculateDelayMinutes(log.time_in as string | null);
            earlyMinutes = calculateEarlyMinutes(log.time_in as string | null);

            // Undertime detection
            if (rawStatus.includes("undertime")) {
              undertimeMinutes = 30; // default indicator
            }

            if (delayMinutes === 0) {
              if (undertimeMinutes > 0) {
                puncStatus = "Undertime";
                compUndertime++;
                grandUndertime++;
              } else {
                puncStatus = "On Time";
                compOnTime++;
                grandOnTime++;
              }
            } else if (delayMinutes <= 15) {
              puncStatus = "Grace Period";
              compGrace++;
              compLate++;
              grandGracePeriod++;
              grandTotalLate++;
              compDelayMinutes += delayMinutes;
              grandTotalDelayMinutes += delayMinutes;
            } else if (delayMinutes <= 30) {
              puncStatus = "Moderate Late";
              compModerate++;
              compLate++;
              grandModerateLate++;
              grandTotalLate++;
              compDelayMinutes += delayMinutes;
              grandTotalDelayMinutes += delayMinutes;
            } else {
              puncStatus = "Severe Late";
              compSevere++;
              compLate++;
              grandSevereLate++;
              grandTotalLate++;
              compDelayMinutes += delayMinutes;
              grandTotalDelayMinutes += delayMinutes;
            }

            // Department aggregations
            const dStat = deptStatsMap.get(deptName) || {
              totalLogs: 0,
              onTimeCount: 0,
              lateCount: 0,
              totalDelayMinutes: 0,
            };
            dStat.totalLogs++;
            if (delayMinutes === 0) dStat.onTimeCount++;
            else {
              dStat.lateCount++;
              dStat.totalDelayMinutes += delayMinutes;
            }
            deptStatsMap.set(deptName, dStat);

            // Daily trend aggregation
            const dtStat = dailyTrendMap.get(currentDate);
            if (dtStat) {
              dtStat.totalLogs++;
              if (delayMinutes === 0) dtStat.onTimeCount++;
              else {
                dtStat.lateCount++;
                dtStat.totalDelayMinutes += delayMinutes;
              }
            }

            // User Leaderboard tracking
            const userKey = `${companyId}_${userId}`;
            const uStat = userPunctualityMap.get(userKey) || {
              userId,
              employeeId,
              name,
              companyCode,
              companyName,
              department: deptName,
              position,
              avatar,
              totalDays: 0,
              onTimeDays: 0,
              lateDays: 0,
              totalDelayMinutes: 0,
              totalEarlyMinutes: 0,
              maxEarlyMinutes: 0,
              earliestArrivalMinutes: null,
              earliestArrival: null,
            };
            uStat.totalDays++;
            if (puncStatus === "On Time") {
              uStat.onTimeDays++;
              uStat.totalEarlyMinutes += earlyMinutes;
              if (earlyMinutes > uStat.maxEarlyMinutes) {
                uStat.maxEarlyMinutes = earlyMinutes;
              }
              if (
                arrivalMinutes !== null &&
                (uStat.earliestArrivalMinutes === null || arrivalMinutes < uStat.earliestArrivalMinutes)
              ) {
                uStat.earliestArrivalMinutes = arrivalMinutes;
                uStat.earliestArrival = timeInFormatted;
              }
            } else if (delayMinutes > 0) {
              uStat.lateDays++;
              uStat.totalDelayMinutes += delayMinutes;
            }
            userPunctualityMap.set(userKey, uStat);
          } else if (activeLeave) {
            puncStatus = "On Leave";
          } else {
            puncStatus = "Absent";
          }

          allRecords.push({
            id: `${companyId}-${userId}-${currentDate}`,
            userId,
            employeeId,
            name,
            firstName: fn,
            lastName: ln,
            middleName: mn || undefined,
            email,
            contact,
            companyId,
            companyName,
            companyCode,
            department: deptName,
            departmentId: deptId,
            position,
            gender,
            avatar,
            punctualityStatus: puncStatus,
            scheduledTimeIn: "08:00 AM",
            timeIn: timeInFormatted,
            timeOut: timeOutFormatted,
            rawTimeIn: (log?.time_in as string) || null,
            rawTimeOut: (log?.time_out as string) || null,
            arrivalMinutes,
            earlyMinutes,
            delayMinutes,
            undertimeMinutes,
            logDate: currentDate,
            approveStatus: (log?.approve_status as string) || null,
            imageTimeIn: (log?.image_time_in as string) || null,
            imageTimeOut: (log?.image_time_out as string) || null,
            hasFiledLeave: !!activeLeave,
            leaveStatus: activeLeave
              ? String(activeLeave.status).toLowerCase() === "approved"
                ? "approved"
                : "pending"
              : null,
            leaveType: (activeLeave?.leave_type as string) || null,
            leaveReason: (activeLeave?.reason as string) || null,
            leaveDates: activeLeave
              ? `${String(activeLeave.leave_start).slice(0, 10)} → ${String(activeLeave.leave_end).slice(0, 10)}`
              : null,
          });
        });
      });

      const compPunctualityRate =
        compLogsCount > 0 ? Math.round((compOnTime / compLogsCount) * 100) : 0;
      const compAvgDelay = compLate > 0 ? Math.round(compDelayMinutes / compLate) : 0;

      companySummaries.push({
        companyId,
        companyName,
        companyCode,
        status: "ACTIVE",
        totalEmployees: activeEmployees.length,
        totalLogs: compLogsCount,
        onTimeCount: compOnTime,
        gracePeriodCount: compGrace,
        moderateLateCount: compModerate,
        severeLateCount: compSevere,
        totalLateCount: compLate,
        undertimeCount: compUndertime,
        punctualityRate: compPunctualityRate,
        avgDelayMinutes: compAvgDelay,
      });
    }

    // Company summary sorting
    companySummaries.sort((a, b) => b.punctualityRate - a.punctualityRate);

    // Department summaries
    const departmentSummaries: DepartmentPunctualitySummary[] = [];
    deptStatsMap.forEach((val, dept) => {
      departmentSummaries.push({
        department: dept,
        totalLogs: val.totalLogs,
        onTimeCount: val.onTimeCount,
        lateCount: val.lateCount,
        punctualityRate:
          val.totalLogs > 0 ? Math.round((val.onTimeCount / val.totalLogs) * 100) : 0,
        avgDelayMinutes: val.lateCount > 0 ? Math.round(val.totalDelayMinutes / val.lateCount) : 0,
      });
    });
    departmentSummaries.sort((a, b) => b.punctualityRate - a.punctualityRate);

    // Daily Trends
    const dailyTrends: DailyPunctualityTrendPoint[] = [];
    targetDates.forEach((td) => {
      const st = dailyTrendMap.get(td);
      const total = st ? st.totalLogs : 0;
      const onTime = st ? st.onTimeCount : 0;
      const late = st ? st.lateCount : 0;
      const delay = st ? st.totalDelayMinutes : 0;
      dailyTrends.push({
        date: td,
        displayDate: td.slice(5),
        totalLogs: total,
        onTimeCount: onTime,
        lateCount: late,
        punctualityRate: total > 0 ? Math.round((onTime / total) * 100) : 0,
        avgDelayMinutes: late > 0 ? Math.round(delay / late) : 0,
      });
    });

    // Punctuality Distribution
    const distribution: PunctualityDistributionSegment[] = [
      {
        name: "On Time",
        count: grandOnTime,
        percentage: grandPresentLogs > 0 ? Math.round((grandOnTime / grandPresentLogs) * 100) : 0,
        color: "#10b981", // emerald
      },
      {
        name: "Grace (1-15m)",
        count: grandGracePeriod,
        percentage:
          grandPresentLogs > 0 ? Math.round((grandGracePeriod / grandPresentLogs) * 100) : 0,
        color: "#f59e0b", // amber
      },
      {
        name: "Moderate (16-30m)",
        count: grandModerateLate,
        percentage:
          grandPresentLogs > 0 ? Math.round((grandModerateLate / grandPresentLogs) * 100) : 0,
        color: "#f97316", // orange
      },
      {
        name: "Severe (>30m)",
        count: grandSevereLate,
        percentage:
          grandPresentLogs > 0 ? Math.round((grandSevereLate / grandPresentLogs) * 100) : 0,
        color: "#ef4444", // rose
      },
      {
        name: "Undertime",
        count: grandUndertime,
        percentage: grandPresentLogs > 0 ? Math.round((grandUndertime / grandPresentLogs) * 100) : 0,
        color: "#8b5cf6", // purple
      },
    ];

    // Leaderboards
    const allUsersArray: PunctualityLeaderboardItem[] = [];
    userPunctualityMap.forEach((u) => {
      const pRate = u.totalDays > 0 ? Math.round((u.onTimeDays / u.totalDays) * 100) : 0;
      const avgDelay = u.lateDays > 0 ? Math.round(u.totalDelayMinutes / u.lateDays) : 0;
      const avgEarly = u.onTimeDays > 0 ? Math.round(u.totalEarlyMinutes / u.onTimeDays) : 0;
      allUsersArray.push({
        userId: u.userId,
        employeeId: u.employeeId,
        name: u.name,
        companyCode: u.companyCode,
        companyName: u.companyName,
        department: u.department,
        position: u.position,
        avatar: u.avatar,
        totalDays: u.totalDays,
        onTimeDays: u.onTimeDays,
        lateDays: u.lateDays,
        punctualityRate: pRate,
        avgDelayMinutes: avgDelay,
        earliestArrival: u.earliestArrival,
        earliestArrivalMinutes: u.earliestArrivalMinutes,
        maxEarlyMinutes: u.maxEarlyMinutes,
        avgEarlyMinutes: avgEarly,
      });
    });

    // Top Punctual (based on on-time arrivals, calculated by earliest clock-in time rather than number of on-time days)
    const topPunctual = [...allUsersArray]
      .filter((u) => u.onTimeDays > 0 && u.earliestArrivalMinutes !== null)
      .sort(
        (a, b) =>
          (a.earliestArrivalMinutes ?? 9999) - (b.earliestArrivalMinutes ?? 9999) ||
          (b.avgEarlyMinutes ?? 0) - (a.avgEarlyMinutes ?? 0) ||
          a.avgDelayMinutes - b.avgDelayMinutes
      )
      .slice(0, 8);

    // Frequent Late (sorted by lateDays desc, avgDelayMinutes desc)
    const frequentLate = [...allUsersArray]
      .filter((u) => u.lateDays > 0)
      .sort((a, b) => b.lateDays - a.lateDays || b.avgDelayMinutes - a.avgDelayMinutes)
      .slice(0, 8);

    const overallRate =
      grandPresentLogs > 0 ? Math.round((grandOnTime / grandPresentLogs) * 100) : 0;
    const avgDelayMinutes =
      grandTotalLate > 0 ? Math.round(grandTotalDelayMinutes / grandTotalLate) : 0;

    const kpis: IntercompanyPunctualityKpis = {
      totalStaff: totalStaffSum,
      totalPresentLogs: grandPresentLogs,
      onTimeCount: grandOnTime,
      totalLateCount: grandTotalLate,
      gracePeriodCount: grandGracePeriod,
      moderateLateCount: grandModerateLate,
      severeLateCount: grandSevereLate,
      undertimeCount: grandUndertime,
      overallPunctualityRate: overallRate,
      averageDelayMinutes: avgDelayMinutes,
      totalDelayMinutes: grandTotalDelayMinutes,
      activeCompaniesCount,
      totalCompaniesCount: validCompanies.length,
      totalDays: targetDates.length,
      mostPunctualCompany: companySummaries[0]?.companyName || "N/A",
      mostPunctualDepartment: departmentSummaries[0]?.department || "N/A",
    };

    const finalData: IntercompanyPunctualityData = {
      date: startDate,
      startDate,
      endDate,
      dates: targetDates,
      kpis,
      companySummaries,
      departmentSummaries,
      dailyTrends,
      distribution,
      topPunctual,
      frequentLate,
      records: allRecords,
      companiesList,
      departmentsList: Array.from(allDepartmentsSet).sort(),
      statusesList: ["On Time", "Grace Period", "Moderate Late", "Severe Late", "Undertime", "Absent", "On Leave"],
    };

    memoryCache.set(cacheKey, { data: finalData, timestamp: Date.now() });

    return NextResponse.json(finalData);
  } catch (err) {
    console.error("[intercompany-punctuality-report API Error]", err);
    return NextResponse.json(
      { error: "Failed to generate intercompany punctuality report" },
      { status: 500 }
    );
  }
}
