import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  IntercompanyAttendanceData,
  IntercompanyAttendanceKpis,
  CompanyAttendanceSummary,
  IntercompanyEmployeeRecord,
  CompanyFilterOption,
  AttendanceStatus,
} from "@/modules/business-intelligence-analytics/hr/intercompany/attendance-report/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "vos_access_token";

type AnyRec = Record<string, unknown>;

interface CachedReport {
  data: IntercompanyAttendanceData;
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
  timeoutMs = 4500
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
      const end = new Date(paramEndDate);
      if (cur > end) {
        const temp = cur;
        cur = end;
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

    const cacheKey = `att_${startDate}_${endDate}_${targetDates.join(",")}`;
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

    // Filter valid operating companies (exclude inactive or deprecated staging ports like 8056)
    const validCompanies = companiesRaw.filter((c) => {
      if (!c.directus || typeof c.directus !== "string" || !c.directus.trim()) return false;
      if (String(c.status || "ACTIVE").toUpperCase() === "INACTIVE") return false;
      if (String(c.directus).includes(":8056")) return false;
      return true;
    });

    const userFields =
      "user_id,user_fname,user_lname,user_mname,suffix_name,user_department,user_position,user_email,user_contact,user_image,is_employee,separation_date,separation_cause,gender,is_deleted,isDeleted,employment_status_id";

    // 2. Concurrently query each company's active employees, departments, attendance logs, and all filed leaves
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
          statuses: statusesRaw,
          attendanceLogs: logsRaw,
          leaves: leavesRaw,
          isOnline: true,
        };
      })
    );

    // 3. Process and consolidate all data
    const allRecords: IntercompanyEmployeeRecord[] = [];
    const companySummaries: CompanyAttendanceSummary[] = [];
    const departmentNameSet = new Set<string>();
    const companiesList: CompanyFilterOption[] = [];

    let totalPresent = 0;
    let totalLate = 0;
    let totalAbsent = 0;
    let totalOnLeave = 0;
    let totalFiledLeave = 0;
    let totalPendingLeave = 0;
    let activeCompaniesCount = 0;

    companyFetchResults.forEach((res, idx) => {
      const origCompany = validCompanies[idx];
      const fallbackId = Number(origCompany.company_id);
      const fallbackName = String(origCompany.company_name || `Company #${fallbackId}`);
      const fallbackCode = String(origCompany.company_code || `CMP-${fallbackId}`);

      companiesList.push({
        companyId: fallbackId,
        companyName: fallbackName,
        companyCode: fallbackCode,
      });

      if (res.status === "rejected" || !res.value) {
        companySummaries.push({
          companyId: fallbackId,
          companyName: fallbackName,
          companyCode: fallbackCode,
          status: "OFFLINE",
          totalEmployees: 0,
          presentCount: 0,
          lateCount: 0,
          absentCount: 0,
          leaveCount: 0,
          filedLeaveCount: 0,
          attendanceRate: 0,
          punctualityRate: 0,
        });
        return;
      }

      const { companyId, companyName, companyCode, users, departments, statuses, attendanceLogs, leaves } =
        res.value;

      activeCompaniesCount++;

      // Department Map
      const deptMap = new Map<number, string>();
      departments.forEach((d) => {
        const id = Number(d.department_id || d.id);
        const name = String(d.department_name || d.name || "").trim();
        if (id && name) {
          deptMap.set(id, name);
          departmentNameSet.add(name);
        }
      });

      // Inactive employment status set (Resigned, Terminated, Inactive, AWOL, Separated)
      const inactiveStatusIds = new Set<number>([7, 8]);
      statuses.forEach((s) => {
        const nameLower = String(s.name || "").toLowerCase();
        if (
          nameLower.includes("resign") ||
          nameLower.includes("terminat") ||
          nameLower.includes("inactive") ||
          nameLower.includes("separat") ||
          nameLower.includes("awol") ||
          nameLower.includes("end of contract")
        ) {
          inactiveStatusIds.add(Number(s.id));
        }
      });

      // Attendance map by `${userId}_${logDate}`
      const attByUserAndDate = new Map<string, AnyRec>();
      attendanceLogs.forEach((log) => {
        const uid = Number(log.user_id);
        const lDate = log.log_date ? String(log.log_date).slice(0, 10) : "";
        if (uid && lDate) {
          attByUserAndDate.set(`${uid}_${lDate}`, log);
        }
      });

      // Filed leaves mapped
      const leavesList = leaves.map((lv) => {
        const start = lv.leave_start ? String(lv.leave_start).slice(0, 10) : "";
        const end = lv.leave_end ? String(lv.leave_end).slice(0, 10) : "";
        const rawStatus = String(lv.status || "").toLowerCase();
        return {
          userId: Number(lv.user_id),
          status: rawStatus === "approved" ? ("approved" as const) : ("pending" as const),
          leaveType: lv.leave_type ? String(lv.leave_type) : "Leave",
          reason: lv.reason ? String(lv.reason) : null,
          start,
          end,
          datesFormatted: start && end ? `${start} to ${end}` : start || end || null,
        };
      });

      // Filter active workforce
      const activeEmployeesForComp = users.filter((u) => {
        const isEmployee = parseBit(u.is_employee);
        if (!isEmployee) return false;

        const isDeleted = parseBit(u.is_deleted) || parseBit(u.isDeleted);
        if (isDeleted) return false;

        if (u.separation_cause && String(u.separation_cause).trim().length > 0) return false;

        const empStatusId = u.employment_status_id ? Number(u.employment_status_id) : null;
        if (empStatusId && inactiveStatusIds.has(empStatusId)) return false;

        const nameCombined = `${u.user_fname || ""} ${u.user_lname || ""}`.toLowerCase();
        if (
          nameCombined.includes("dummy") ||
          nameCombined.includes("throwaway") ||
          nameCombined.includes("qa test") ||
          nameCombined.includes("test account")
        ) {
          return false;
        }

        return Boolean(Number(u.user_id));
      });

      const compEmployees = activeEmployeesForComp.length;
      let compPresent = 0;
      let compLate = 0;
      let compAbsent = 0;
      let compLeave = 0;
      let compFiledLeave = 0;

      // Iterate through target dates for this company's active employees
      targetDates.forEach((tDate) => {
        activeEmployeesForComp.forEach((u) => {
          // If separated on or prior to this specific date, skip
          if (u.separation_date && String(u.separation_date).slice(0, 10) <= tDate) {
            return;
          }

          const userId = Number(u.user_id);
          const firstName = String(u.user_fname || "").trim();
          const lastName = String(u.user_lname || "").trim();
          const middleName = u.user_mname ? String(u.user_mname).trim() : undefined;
          const suffix = u.suffix_name ? String(u.suffix_name).trim() : "";
          const fullName =
            [firstName, middleName, lastName, suffix].filter(Boolean).join(" ") ||
            `Employee #${userId}`;

          const deptId = u.user_department ? Number(u.user_department) : null;
          const department = (deptId ? deptMap.get(deptId) : null) || "General Operations";
          departmentNameSet.add(department);

          const position = String(u.user_position || "").trim() || "Staff Member";
          const email = String(u.user_email || "").trim();
          const contact = String(u.user_contact || "").trim();
          const avatar = u.user_image ? String(u.user_image) : null;

          const rawGender = String(u.gender || "").trim().toLowerCase();
          let gender = "Other";
          if (rawGender === "male" || rawGender === "m") gender = "Male";
          else if (rawGender === "female" || rawGender === "f") gender = "Female";

          // Attendance & Filed Leave Calculation for this date
          const attLog = attByUserAndDate.get(`${userId}_${tDate}`);
          const leaveReq = leavesList.find(
            (lv) => lv.userId === userId && lv.start <= tDate && lv.end >= tDate
          );

          const hasFiledLeave = Boolean(leaveReq);
          let leaveStatus: "approved" | "pending" | null = null;
          let leaveType: string | null = null;
          let leaveReason: string | null = null;
          let leaveDates: string | null = null;

          if (leaveReq) {
            leaveStatus = leaveReq.status;
            leaveType = leaveReq.leaveType;
            leaveReason = leaveReq.reason;
            leaveDates = leaveReq.datesFormatted;

            compFiledLeave++;
            totalFiledLeave++;
            if (leaveStatus === "pending") {
              totalPendingLeave++;
            }
          }

          let status: AttendanceStatus = "Absent";
          let timeIn: string | null = null;
          let timeOut: string | null = null;
          let approveStatus: string | null = null;
          let imageTimeIn: string | null = null;
          let imageTimeOut: string | null = null;

          if (attLog) {
            const rawStatus = String(attLog.status || "").toLowerCase();
            if (rawStatus.includes("late")) {
              status = "Late";
              compLate++;
              totalLate++;
            } else {
              status = "On Time";
            }
            compPresent++;
            totalPresent++;

            timeIn = formatTimeString(attLog.time_in);
            timeOut = formatTimeString(attLog.time_out);
            approveStatus = attLog.approve_status ? String(attLog.approve_status) : "Approved";
            imageTimeIn = attLog.image_time_in ? String(attLog.image_time_in) : null;
            imageTimeOut = attLog.image_time_out ? String(attLog.image_time_out) : null;
          } else if (hasFiledLeave && leaveStatus === "approved") {
            status = "On Leave";
            compLeave++;
            totalOnLeave++;
          } else {
            status = "Absent";
            compAbsent++;
            totalAbsent++;
          }

          allRecords.push({
            id: isSingleDate ? `${companyId}-${userId}` : `${companyId}-${userId}-${tDate}`,
            userId,
            employeeId: `${companyCode}-${String(userId).padStart(4, "0")}`,
            name: fullName,
            firstName,
            lastName,
            middleName,
            email,
            contact,
            companyId,
            companyName,
            companyCode,
            department,
            departmentId: deptId,
            position,
            gender,
            avatar,
            attendanceStatus: status,
            timeIn,
            timeOut,
            logDate: tDate,
            approveStatus,
            imageTimeIn,
            imageTimeOut,
            hasFiledLeave,
            leaveStatus,
            leaveType,
            leaveReason,
            leaveDates,
          });
        });
      });

      const totalCompSlots = compPresent + compLate + compAbsent + compLeave;
      const compAttRate = totalCompSlots > 0 ? Math.round((compPresent / totalCompSlots) * 100) : 0;
      const compPunctRate =
        compPresent > 0 ? Math.round(((compPresent - compLate) / compPresent) * 100) : 0;

      companySummaries.push({
        companyId,
        companyName,
        companyCode,
        status: "ACTIVE",
        totalEmployees: compEmployees,
        presentCount: compPresent,
        lateCount: compLate,
        absentCount: compAbsent,
        leaveCount: compLeave,
        filedLeaveCount: compFiledLeave,
        attendanceRate: compAttRate,
        punctualityRate: compPunctRate,
      });
    });

    const uniqueEmployeesCount = new Set(allRecords.map((r) => `${r.companyId}-${r.userId}`)).size;
    const totalWorkforce = isSingleDate ? uniqueEmployeesCount : allRecords.length;

    const overallAttendanceRate =
      allRecords.length > 0 ? Math.round((totalPresent / allRecords.length) * 100) : 0;
    const overallPunctualityRate =
      totalPresent > 0 ? Math.round(((totalPresent - totalLate) / totalPresent) * 100) : 0;

    const kpis: IntercompanyAttendanceKpis = {
      totalWorkforce,
      totalPresent,
      totalLate,
      totalAbsent,
      totalOnLeave,
      totalFiledLeave,
      totalPendingLeave,
      overallAttendanceRate,
      overallPunctualityRate,
      activeCompaniesCount,
      totalCompaniesCount: validCompanies.length,
      totalDays: targetDates.length,
      uniqueEmployeesCount,
    };

    const payload: IntercompanyAttendanceData = {
      date: isSingleDate ? startDate : `${startDate} to ${endDate}`,
      startDate,
      endDate,
      dates: targetDates,
      kpis,
      companySummaries: companySummaries.sort((a, b) => b.totalEmployees - a.totalEmployees),
      records: allRecords,
      companiesList: companiesList.sort((a, b) => a.companyName.localeCompare(b.companyName)),
      departmentsList: Array.from(departmentNameSet).sort(),
      statusesList: ["On Time", "Late", "Absent", "On Leave", "Filed Leave"],
    };

    // Store in cache
    memoryCache.set(cacheKey, {
      data: payload,
      timestamp: Date.now(),
    });

    return NextResponse.json(payload);
  } catch (err: unknown) {
    console.error("[intercompany-attendance-report API Error]", err);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
