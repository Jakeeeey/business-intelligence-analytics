import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  IntercompanyLeaveData,
  IntercompanyLeaveKpis,
  CompanyLeaveOtSummary,
  EmployeeLeaveAndOtSummary,
  DailyOtTrendPoint,
  StatusDistributionSegment,
  IntercompanyOvertimeRecord,
  IntercompanyLeaveRecord,
  CompanyFilterOption,
  RequestStatus,
} from "@/modules/business-intelligence-analytics/hr/intercompany/leave-report/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "vos_access_token";

type AnyRec = Record<string, unknown>;

interface CachedReport {
  data: IntercompanyLeaveData;
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

function normalizeStatus(rawStatus: unknown): RequestStatus {
  const s = String(rawStatus || "").trim().toLowerCase();
  if (s.includes("approv")) return "approved";
  if (s.includes("reject") || s.includes("decline") || s.includes("disapprov")) return "rejected";
  return "pending";
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
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;

    // Default start date to month start or 30 days ago
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultStart = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(
      2,
      "0"
    )}-01`;

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
      while (cur <= end && count < 92) {
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
      const cur = new Date(defaultStart);
      const end = new Date(todayStr);
      while (cur <= end) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, "0");
        const d = String(cur.getDate()).padStart(2, "0");
        targetDates.push(`${y}-${m}-${d}`);
        cur.setDate(cur.getDate() + 1);
      }
    }

    targetDates = Array.from(new Set(targetDates)).sort();
    const startDate = targetDates[0];
    const endDate = targetDates[targetDates.length - 1];
    const force = searchParams.get("force") === "true";

    const cacheKey = `leave_ot_${startDate}_${endDate}_${targetDates.join(",")}`;
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

    // 1. Fetch operating companies from primary Directus
    const companiesRaw = await fetchDirectusWithTimeout<AnyRec>(
      `${primaryBaseUrl}/items/company_list?limit=-1&fields=company_id,company_name,company_code,directus,directus_token,status,is_default,is_mother_company`,
      primaryHeaders,
      6000
    );

    const validCompanies = companiesRaw.filter((c) => {
      if (!c.directus || typeof c.directus !== "string" || !c.directus.trim()) return false;
      if (String(c.status || "ACTIVE").toUpperCase() === "INACTIVE") return false;
      if (String(c.directus).includes(":8056")) return false;
      return true;
    });

    const userFields =
      "user_id,user_fname,user_lname,user_mname,user_department,user_position,gender,is_employee,separation_date,is_deleted,isDeleted,employment_status_id";

    // 2. Concurrently query each company's users, departments, overtime_request, and leave_request
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

        const otFilter = `filter[request_date][_gte]=${startDate}&filter[request_date][_lte]=${endDate}`;
        const leaveFilter = `filter[leave_start][_lte]=${endDate}&filter[leave_end][_gte]=${startDate}`;

        const [usersRaw, departmentsRaw, statusesRaw, otRaw, leavesRaw] = await Promise.all([
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
            `${companyUrl}/items/overtime_request?${otFilter}&limit=-1&fields=*`,
            compHeaders,
            6000
          ),
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/leave_request?${leaveFilter}&limit=-1&fields=*`,
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
          overtimeRequests: otRaw,
          leaveRequests: leavesRaw,
        };
      })
    );

    // 3. Process aggregates
    const allOtRecords: IntercompanyOvertimeRecord[] = [];
    const allLeaveRecords: IntercompanyLeaveRecord[] = [];
    const companySummaries: CompanyLeaveOtSummary[] = [];
    const employeeSummariesMap = new Map<string, EmployeeLeaveAndOtSummary>();
    const companiesList: CompanyFilterOption[] = [];
    const allDepartmentsSet = new Set<string>();

    const dailyTrendMap = new Map<
      string,
      { totalOtMinutes: number; approvedOtMinutes: number; otCount: number; leaveCount: number }
    >();
    targetDates.forEach((d) => {
      dailyTrendMap.set(d, { totalOtMinutes: 0, approvedOtMinutes: 0, otCount: 0, leaveCount: 0 });
    });

    let grandEmployeesCount = 0;
    let grandOtMinutes = 0;
    let grandApprovedOtMinutes = 0;
    let grandOtRequests = 0;
    let grandApprovedOtRequests = 0;
    let grandPendingOtRequests = 0;
    let grandRejectedOtRequests = 0;

    let grandLeaveRequests = 0;
    let grandApprovedLeaveRequests = 0;
    let grandApprovedLeaveDays = 0;
    let grandPendingLeaveRequests = 0;

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
        overtimeRequests,
        leaveRequests,
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

      // Active employees
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

      grandEmployeesCount += activeEmployees.length;

      const userMetaMap = new Map<number, AnyRec>();
      activeEmployees.forEach((emp) => {
        const uid = Number(emp.user_id);
        userMetaMap.set(uid, emp);

        const dId = emp.user_department ? Number(emp.user_department) : null;
        const dName = (dId ? deptMap.get(dId) : null) || "General Operations";
        allDepartmentsSet.add(dName);

        const fn = String(emp.user_fname || "").trim();
        const ln = String(emp.user_lname || "").trim();
        const name = `${fn} ${ln}`.trim() || `Staff #${uid}`;
        const employeeId = `${companyCode}-${String(uid).padStart(4, "0")}`;
        const pos = String(emp.user_position || "Team Member").trim();
        const av = emp.user_image ? String(emp.user_image) : null;

        employeeSummariesMap.set(`${companyId}_${uid}`, {
          userId: uid,
          employeeId,
          name,
          companyId,
          companyName,
          companyCode,
          department: dName,
          position: pos,
          avatar: av,
          totalOtRequests: 0,
          approvedOtRequests: 0,
          pendingOtRequests: 0,
          rejectedOtRequests: 0,
          totalOtMinutes: 0,
          totalOtHours: 0,
          approvedOtMinutes: 0,
          approvedOtHours: 0,
          totalLeaveRequests: 0,
          approvedLeaveRequests: 0,
          pendingLeaveRequests: 0,
          rejectedLeaveRequests: 0,
          totalLeaveDays: 0,
          approvedLeaveDays: 0,
        });
      });

      let compTotalOtRequests = 0;
      let compApprovedOtRequests = 0;
      let compPendingOtRequests = 0;
      let compTotalOtMinutes = 0;
      let compApprovedOtMinutes = 0;

      let compTotalLeaveRequests = 0;
      let compApprovedLeaveRequests = 0;
      let compTotalLeaveDays = 0;
      let compApprovedLeaveDays = 0;

      // Process Overtime Requests
      overtimeRequests.forEach((ot) => {
        const uid = Number(ot.user_id);
        const emp = userMetaMap.get(uid);
        if (!emp) return; // exclude inactive / non-employee

        const otId = Number(ot.overtime_id || ot.id);
        const status = normalizeStatus(ot.status);
        const mins = Number(ot.duration_minutes) || 0;
        const hrs = Math.round((mins / 60) * 10) / 10;
        const reqDate = String(ot.request_date || "").slice(0, 10);

        compTotalOtRequests++;
        grandOtRequests++;
        compTotalOtMinutes += mins;
        grandOtMinutes += mins;

        if (status === "approved") {
          compApprovedOtRequests++;
          grandApprovedOtRequests++;
          compApprovedOtMinutes += mins;
          grandApprovedOtMinutes += mins;
        } else if (status === "pending") {
          compPendingOtRequests++;
          grandPendingOtRequests++;
        } else {
          grandRejectedOtRequests++;
        }

        // Daily trend tracking
        const dt = dailyTrendMap.get(reqDate);
        if (dt) {
          dt.otCount++;
          dt.totalOtMinutes += mins;
          if (status === "approved") {
            dt.approvedOtMinutes += mins;
          }
        }

        // Employee summary
        const empSum = employeeSummariesMap.get(`${companyId}_${uid}`);
        if (empSum) {
          empSum.totalOtRequests++;
          empSum.totalOtMinutes += mins;
          empSum.totalOtHours = Math.round((empSum.totalOtMinutes / 60) * 10) / 10;
          if (status === "approved") {
            empSum.approvedOtRequests++;
            empSum.approvedOtMinutes += mins;
            empSum.approvedOtHours = Math.round((empSum.approvedOtMinutes / 60) * 10) / 10;
          } else if (status === "pending") {
            empSum.pendingOtRequests++;
          } else {
            empSum.rejectedOtRequests++;
          }
        }

        const fn = String(emp.user_fname || "").trim();
        const ln = String(emp.user_lname || "").trim();
        const name = `${fn} ${ln}`.trim() || `Staff #${uid}`;
        const employeeId = `${companyCode}-${String(uid).padStart(4, "0")}`;
        const dId = emp.user_department ? Number(emp.user_department) : null;
        const dName = (dId ? deptMap.get(dId) : null) || "General Operations";

        allOtRecords.push({
          id: `${companyId}-ot-${otId}`,
          overtimeId: otId,
          userId: uid,
          employeeId,
          name,
          firstName: fn,
          lastName: ln,
          companyId,
          companyName,
          companyCode,
          department: dName,
          departmentId: dId,
          position: String(emp.user_position || "Team Member").trim(),
          gender: String(emp.gender || "Unspecified").trim(),
          avatar: emp.user_image ? String(emp.user_image) : null,
          requestDate: reqDate,
          otFrom: (ot.ot_from as string) || null,
          otTo: (ot.ot_to as string) || null,
          durationMinutes: mins,
          durationHours: hrs,
          purpose: String(ot.purpose || "Overtime Work").trim(),
          remarks: String(ot.remarks || "").trim(),
          status,
          currentApprovalLevel: Number(ot.current_approval_level) || 1,
          approverId: ot.approver_id ? Number(ot.approver_id) : null,
          approvedAt: (ot.approved_at as string) || null,
          filedAt: (ot.filed_at as string) || null,
        });
      });

      // Process Leave Requests
      leaveRequests.forEach((lv) => {
        const uid = Number(lv.user_id);
        const emp = userMetaMap.get(uid);
        if (!emp) return;

        const lvId = Number(lv.leave_id || lv.id);
        const status = normalizeStatus(lv.status);
        const days = parseFloat(String(lv.total_days || "1")) || 1;
        const lStart = String(lv.leave_start || "").slice(0, 10);
        const lEnd = String(lv.leave_end || "").slice(0, 10);

        compTotalLeaveRequests++;
        grandLeaveRequests++;
        compTotalLeaveDays += days;

        if (status === "approved") {
          compApprovedLeaveRequests++;
          grandApprovedLeaveRequests++;
          compApprovedLeaveDays += days;
          grandApprovedLeaveDays += days;
        } else if (status === "pending") {
          grandPendingLeaveRequests++;
        }

        // Daily trend tracking (log on leave start)
        const dt = dailyTrendMap.get(lStart);
        if (dt) {
          dt.leaveCount++;
        }

        // Employee summary
        const empSum = employeeSummariesMap.get(`${companyId}_${uid}`);
        if (empSum) {
          empSum.totalLeaveRequests++;
          empSum.totalLeaveDays += days;
          if (status === "approved") {
            empSum.approvedLeaveRequests++;
            empSum.approvedLeaveDays += days;
          } else if (status === "pending") {
            empSum.pendingLeaveRequests++;
          } else {
            empSum.rejectedLeaveRequests++;
          }
        }

        const fn = String(emp.user_fname || "").trim();
        const ln = String(emp.user_lname || "").trim();
        const name = `${fn} ${ln}`.trim() || `Staff #${uid}`;
        const employeeId = `${companyCode}-${String(uid).padStart(4, "0")}`;
        const dId = emp.user_department ? Number(emp.user_department) : null;
        const dName = (dId ? deptMap.get(dId) : null) || "General Operations";

        allLeaveRecords.push({
          id: `${companyId}-leave-${lvId}`,
          leaveId: lvId,
          userId: uid,
          employeeId,
          name,
          firstName: fn,
          lastName: ln,
          companyId,
          companyName,
          companyCode,
          department: dName,
          departmentId: dId,
          position: String(emp.user_position || "Team Member").trim(),
          gender: String(emp.gender || "Unspecified").trim(),
          avatar: emp.user_image ? String(emp.user_image) : null,
          leaveType: String(lv.leave_type || "Vacation Leave").toUpperCase(),
          leaveStart: lStart,
          leaveEnd: lEnd,
          totalDays: days,
          reason: String(lv.reason || "Personal Leave").trim(),
          remarks: (lv.remarks as string) || null,
          status,
          currentApprovalLevel: Number(lv.current_approval_level) || 1,
          approverId: lv.approver_id ? Number(lv.approver_id) : null,
          approvedAt: (lv.approved_at as string) || null,
          filedAt: (lv.filed_at as string) || null,
          isPaid: parseBit(lv.is_paid),
        });
      });

      const otRate =
        compTotalOtRequests > 0
          ? Math.round((compApprovedOtRequests / compTotalOtRequests) * 100)
          : 0;

      companySummaries.push({
        companyId,
        companyName,
        companyCode,
        status: "ACTIVE",
        totalEmployees: activeEmployees.length,
        totalOtRequests: compTotalOtRequests,
        approvedOtRequests: compApprovedOtRequests,
        pendingOtRequests: compPendingOtRequests,
        totalOtMinutes: compTotalOtMinutes,
        totalOtHours: Math.round((compTotalOtMinutes / 60) * 10) / 10,
        approvedOtMinutes: compApprovedOtMinutes,
        approvedOtHours: Math.round((compApprovedOtMinutes / 60) * 10) / 10,
        otApprovalRate: otRate,
        totalLeaveRequests: compTotalLeaveRequests,
        approvedLeaveRequests: compApprovedLeaveRequests,
        totalLeaveDays: compTotalLeaveDays,
        approvedLeaveDays: compApprovedLeaveDays,
      });
    }

    // Sort company summaries by highest approved overtime
    companySummaries.sort((a, b) => b.approvedOtMinutes - a.approvedOtMinutes);

    // Employee summaries list (sort by highest approved overtime hours)
    const employeeSummaries = Array.from(employeeSummariesMap.values()).sort(
      (a, b) => b.approvedOtMinutes - a.approvedOtMinutes || b.totalOtMinutes - a.totalOtMinutes
    );

    // Daily trends list
    const dailyTrends: DailyOtTrendPoint[] = [];
    targetDates.forEach((td) => {
      const cur = dailyTrendMap.get(td);
      const totalMins = cur ? cur.totalOtMinutes : 0;
      const appMins = cur ? cur.approvedOtMinutes : 0;
      dailyTrends.push({
        date: td,
        displayDate: td.slice(5),
        totalOtMinutes: totalMins,
        totalOtHours: Math.round((totalMins / 60) * 10) / 10,
        approvedOtMinutes: appMins,
        approvedOtHours: Math.round((appMins / 60) * 10) / 10,
        otRequestsCount: cur ? cur.otCount : 0,
        leaveRequestsCount: cur ? cur.leaveCount : 0,
      });
    });

    // Request status breakdown segment
    const totalRequests = grandOtRequests + grandLeaveRequests;
    const totalApproved = grandApprovedOtRequests + grandApprovedLeaveRequests;
    const totalPending = grandPendingOtRequests + grandPendingLeaveRequests;
    const totalRejected = grandRejectedOtRequests + (grandLeaveRequests - grandApprovedLeaveRequests - grandPendingLeaveRequests);

    const statusDistribution: StatusDistributionSegment[] = [
      {
        name: "Approved",
        count: totalApproved,
        percentage: totalRequests > 0 ? Math.round((totalApproved / totalRequests) * 100) : 0,
        color: "#10b981", // emerald
      },
      {
        name: "Pending",
        count: totalPending,
        percentage: totalRequests > 0 ? Math.round((totalPending / totalRequests) * 100) : 0,
        color: "#f59e0b", // amber
      },
      {
        name: "Rejected",
        count: Math.max(0, totalRejected),
        percentage:
          totalRequests > 0
            ? Math.round((Math.max(0, totalRejected) / totalRequests) * 100)
            : 0,
        color: "#ef4444", // rose
      },
    ];

    const topEmp = employeeSummaries[0]?.approvedOtHours > 0 ? employeeSummaries[0].name : "N/A";
    const topComp = companySummaries[0]?.approvedOtHours > 0 ? companySummaries[0].companyName : "N/A";

    const otApprovalRate =
      grandOtRequests > 0
        ? Math.round((grandApprovedOtRequests / grandOtRequests) * 100)
        : 0;

    const kpis: IntercompanyLeaveKpis = {
      totalEmployees: grandEmployeesCount,
      totalOtMinutes: grandOtMinutes,
      totalOtHours: Math.round((grandOtMinutes / 60) * 10) / 10,
      totalOtRequests: grandOtRequests,
      totalApprovedOtRequests: grandApprovedOtRequests,
      totalApprovedOtMinutes: grandApprovedOtMinutes,
      totalApprovedOtHours: Math.round((grandApprovedOtMinutes / 60) * 10) / 10,
      totalPendingOtRequests: grandPendingOtRequests,
      totalRejectedOtRequests: grandRejectedOtRequests,
      otApprovalRate,
      totalLeaveRequests: grandLeaveRequests,
      totalApprovedLeaveRequests: grandApprovedLeaveRequests,
      totalApprovedLeaveDays: Math.round(grandApprovedLeaveDays * 10) / 10,
      totalPendingLeaveRequests: grandPendingLeaveRequests,
      activeCompaniesCount,
      totalCompaniesCount: validCompanies.length,
      topOtEmployee: topEmp,
      topOtCompany: topComp,
    };

    // Sort requests by newest filed/request date
    allOtRecords.sort((a, b) => (b.requestDate || "").localeCompare(a.requestDate || ""));
    allLeaveRecords.sort((a, b) => (b.leaveStart || "").localeCompare(a.leaveStart || ""));

    const finalData: IntercompanyLeaveData = {
      startDate,
      endDate,
      dates: targetDates,
      kpis,
      companySummaries,
      employeeSummaries,
      dailyTrends,
      statusDistribution,
      overtimeRecords: allOtRecords,
      leaveRecords: allLeaveRecords,
      companiesList,
      departmentsList: Array.from(allDepartmentsSet).sort(),
      statusesList: ["Approved", "Pending", "Rejected"],
    };

    memoryCache.set(cacheKey, { data: finalData, timestamp: Date.now() });

    return NextResponse.json(finalData);
  } catch (err) {
    console.error("[intercompany-leave-report API Error]", err);
    return NextResponse.json(
      { error: "Failed to generate intercompany leave and overtime report" },
      { status: 500 }
    );
  }
}
