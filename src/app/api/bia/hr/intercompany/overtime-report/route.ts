import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  IntercompanyOvertimeData,
  IntercompanyOvertimeRecord,
  EmployeeOvertimeSummary,
  CompanyOvertimeSummary,
  IntercompanyOvertimeKpis,
  DailyOtTrendPoint,
  StatusDistributionSegment,
  CompanyFilterOption,
  RequestStatus,
} from "@/modules/business-intelligence-analytics/hr/intercompany/overtime-report/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "vos_access_token";
const CACHE_TTL_MS = 30 * 1000; // 30s in-memory cache

type AnyRec = Record<string, unknown>;

interface CacheEntry {
  data: IntercompanyOvertimeData;
  timestamp: number;
}
const memoryCache = new Map<string, CacheEntry>();

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

function getMonthStartAndToday(): { startStr: string; todayStr: string } {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return {
    startStr: `${year}-${month}-01`,
    todayStr: `${year}-${month}-${day}`,
  };
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    const staticToken =
      process.env.DIRECTUS_STATIC_TOKEN || "rTilKSsclzuQW8WfQWK1ba8wrD_LetNn";
    const primaryBaseUrl = (
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_DIRECTUS_URL ||
      "http://goatedcodoer:8091"
    ).replace(/\/+$/, "");

    const { searchParams } = new URL(request.url);
    const { startStr: defaultStart, todayStr } = getMonthStartAndToday();

    const paramStartDate = searchParams.get("startDate")?.trim();
    const paramEndDate = searchParams.get("endDate")?.trim();
    const paramDate = searchParams.get("date")?.trim();
    const paramDates = searchParams.get("dates")?.trim();
    const force = searchParams.get("force") === "true";

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

    const cacheKey = `ot_${startDate}_${endDate}_${targetDates.join(",")}`;
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
      if (String(c.directus).includes(":8056")) return false;
      return true;
    });

    if (validCompanies.length === 0) {
      return NextResponse.json(
        { error: "No active subsidiary company configurations found" },
        { status: 500 }
      );
    }

    const userFields =
      "user_id,user_fname,user_lname,user_mname,suffix_name,user_department,user_position,gender,user_image,is_employee,is_deleted,isDeleted";

    // 2. Concurrently query each company's active employees, departments, and overtime requests
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

        const [usersRaw, departmentsRaw, otRaw] = await Promise.all([
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
            `${companyUrl}/items/overtime_request?limit=-1&fields=overtime_id,user_id,department_id,request_date,sched_timeout,ot_from,ot_to,duration_minutes,purpose,remarks,status,current_approval_level,approver_id,approved_at,filed_at&filter[request_date][_gte]=${startDate}&filter[request_date][_lte]=${endDate}`,
            compHeaders,
            6000
          ),
        ]);

        return {
          companyId,
          companyName,
          companyCode,
          companyUrl,
          usersRaw,
          departmentsRaw,
          otRaw,
        };
      })
    );

    // 3. Process and aggregate records across all operating entities
    const allOvertimeRecords: IntercompanyOvertimeRecord[] = [];
    const companySummaries: CompanyOvertimeSummary[] = [];
    const employeeMap = new Map<string, EmployeeOvertimeSummary>();
    const departmentsSet = new Set<string>();

    for (const result of companyFetchResults) {
      if (result.status !== "fulfilled") continue;
      const {
        companyId,
        companyName,
        companyCode,
        usersRaw,
        departmentsRaw,
        otRaw,
      } = result.value;

      // Map departments
      const deptMap = new Map<number, string>();
      for (const d of departmentsRaw) {
        if (d.department_id && d.department_name) {
          const dName = String(d.department_name).trim();
          deptMap.set(Number(d.department_id), dName);
          departmentsSet.add(dName);
        }
      }

      // Filter active employees (exclude deleted / non-employees)
      const activeUsers = usersRaw.filter((u) => {
        if (parseBit(u.is_deleted) || parseBit(u.isDeleted)) return false;
        if (u.is_employee !== undefined && !parseBit(u.is_employee)) return false;
        return true;
      });

      // Map active employees
      const userLookup = new Map<number, AnyRec>();
      for (const u of activeUsers) {
        const uId = Number(u.user_id);
        userLookup.set(uId, u);

        const deptIdNum = Number(u.user_department);
        const deptName: string = (!isNaN(deptIdNum) && deptMap.get(deptIdNum)) ? deptMap.get(deptIdNum)! : "General";
        const fullName = [u.user_fname, u.user_mname, u.user_lname, u.suffix_name]
          .filter(Boolean)
          .join(" ")
          .trim() || `Employee #${uId}`;

        const empKey = `${companyId}-${uId}`;
        employeeMap.set(empKey, {
          userId: uId,
          employeeId: `EMP-${uId}`,
          name: fullName,
          companyId,
          companyName,
          companyCode,
          department: deptName,
          position: String(u.user_position || "Staff"),
          avatar: u.user_image ? String(u.user_image) : null,
          totalOtRequests: 0,
          approvedOtRequests: 0,
          pendingOtRequests: 0,
          rejectedOtRequests: 0,
          totalOtMinutes: 0,
          totalOtHours: 0,
          approvedOtMinutes: 0,
          approvedOtHours: 0,
          approvalRate: 0,
        });
      }

      // Filter OT records for the selected target dates
      const dateSet = new Set(targetDates);
      let compTotalOtReqs = 0;
      let compApprovedOtReqs = 0;
      let compPendingOtReqs = 0;
      let compRejectedOtReqs = 0;
      let compTotalOtMins = 0;
      let compApprovedOtMins = 0;

      for (const row of otRaw) {
        const rDate = row.request_date ? String(row.request_date).slice(0, 10) : "";
        if (!dateSet.has(rDate)) continue;

        const uId = Number(row.user_id);
        const emp = userLookup.get(uId);
        const rowDeptId = Number(row.department_id);
        const empDeptId = Number(emp?.user_department);
        let deptName = "General";
        if (!isNaN(rowDeptId) && deptMap.has(rowDeptId)) {
          deptName = deptMap.get(rowDeptId)!;
        } else if (!isNaN(empDeptId) && deptMap.has(empDeptId)) {
          deptName = deptMap.get(empDeptId)!;
        }

        const fullName = emp
          ? [emp.user_fname, emp.user_mname, emp.user_lname, emp.suffix_name]
              .filter(Boolean)
              .join(" ")
              .trim()
          : `Employee #${uId}`;

        const durationMinutes = Number(row.duration_minutes) || 0;
        const durationHours = Math.round((durationMinutes / 60) * 10) / 10;

        let normalizedStatus: RequestStatus = "pending";
        const s = String(row.status || "").toLowerCase();
        if (s === "approved") normalizedStatus = "approved";
        else if (s === "rejected" || s === "declined") normalizedStatus = "rejected";

        allOvertimeRecords.push({
          id: `${companyId}-ot-${row.overtime_id}`,
          overtimeId: Number(row.overtime_id),
          userId: uId,
          employeeId: `EMP-${uId}`,
          name: fullName || `Employee #${uId}`,
          firstName: String(emp?.user_fname || ""),
          lastName: String(emp?.user_lname || ""),
          companyId,
          companyName,
          companyCode,
          department: deptName,
          departmentId: row.department_id ? Number(row.department_id) : null,
          position: String(emp?.user_position || "Staff"),
          gender: String(emp?.gender || "N/A"),
          avatar: emp?.user_image ? String(emp.user_image) : null,
          requestDate: rDate,
          schedTimeout: row.sched_timeout ? String(row.sched_timeout).slice(0, 5) : null,
          otFrom: row.ot_from ? String(row.ot_from).slice(0, 5) : null,
          otTo: row.ot_to ? String(row.ot_to).slice(0, 5) : null,
          durationMinutes,
          durationHours,
          purpose: String(row.purpose || "Overtime Work"),
          remarks: String(row.remarks || ""),
          status: normalizedStatus,
          currentApprovalLevel: Number(row.current_approval_level) || 1,
          approverId: row.approver_id ? Number(row.approver_id) : null,
          approvedAt: row.approved_at ? String(row.approved_at) : null,
          filedAt: row.filed_at ? String(row.filed_at) : null,
        });

        compTotalOtReqs++;
        compTotalOtMins += durationMinutes;
        if (normalizedStatus === "approved") {
          compApprovedOtReqs++;
          compApprovedOtMins += durationMinutes;
        } else if (normalizedStatus === "pending") {
          compPendingOtReqs++;
        } else {
          compRejectedOtReqs++;
        }

        // Update employee summary
        const empKey = `${companyId}-${uId}`;
        let empSummary: EmployeeOvertimeSummary | undefined = employeeMap.get(empKey);
        if (!empSummary) {
          empSummary = {
            userId: uId,
            employeeId: `EMP-${uId}`,
            name: fullName,
            companyId,
            companyName,
            companyCode,
            department: deptName,
            position: String(emp?.user_position || "Staff"),
            avatar: emp?.user_image ? String(emp.user_image) : null,
            totalOtRequests: 0,
            approvedOtRequests: 0,
            pendingOtRequests: 0,
            rejectedOtRequests: 0,
            totalOtMinutes: 0,
            totalOtHours: 0,
            approvedOtMinutes: 0,
            approvedOtHours: 0,
            approvalRate: 0,
          };
          employeeMap.set(empKey, empSummary);
        }

        empSummary.totalOtRequests++;
        empSummary.totalOtMinutes += durationMinutes;
        if (normalizedStatus === "approved") {
          empSummary.approvedOtRequests++;
          empSummary.approvedOtMinutes += durationMinutes;
        } else if (normalizedStatus === "pending") {
          empSummary.pendingOtRequests++;
        } else {
          empSummary.rejectedOtRequests++;
        }
      }

      const compOtApprovalRate =
        compTotalOtReqs > 0
          ? Math.round((compApprovedOtReqs / compTotalOtReqs) * 100)
          : 0;

      companySummaries.push({
        companyId,
        companyName,
        companyCode,
        status: "ACTIVE",
        totalEmployees: activeUsers.length,
        totalOtRequests: compTotalOtReqs,
        approvedOtRequests: compApprovedOtReqs,
        pendingOtRequests: compPendingOtReqs,
        rejectedOtRequests: compRejectedOtReqs,
        totalOtMinutes: compTotalOtMins,
        totalOtHours: Math.round((compTotalOtMins / 60) * 10) / 10,
        approvedOtMinutes: compApprovedOtMins,
        approvedOtHours: Math.round((compApprovedOtMins / 60) * 10) / 10,
        otApprovalRate: compOtApprovalRate,
      });
    }

    // 4. Finalize employee summaries
    const employeeSummaries = Array.from(employeeMap.values()).map((emp) => {
      emp.totalOtHours = Math.round((emp.totalOtMinutes / 60) * 10) / 10;
      emp.approvedOtHours = Math.round((emp.approvedOtMinutes / 60) * 10) / 10;
      emp.approvalRate =
        emp.totalOtRequests > 0
          ? Math.round((emp.approvedOtRequests / emp.totalOtRequests) * 100)
          : 0;
      return emp;
    });

    employeeSummaries.sort((a, b) => {
      if (b.approvedOtHours !== a.approvedOtHours) {
        return b.approvedOtHours - a.approvedOtHours;
      }
      return b.totalOtHours - a.totalOtHours;
    });

    // 5. Executive KPIs
    let totalOtMinutes = 0;
    let totalApprovedOtMinutes = 0;
    let totalOtRequests = 0;
    let totalApprovedOtRequests = 0;
    let totalPendingOtRequests = 0;
    let totalRejectedOtRequests = 0;

    for (const ot of allOvertimeRecords) {
      totalOtRequests++;
      totalOtMinutes += ot.durationMinutes;
      if (ot.status === "approved") {
        totalApprovedOtRequests++;
        totalApprovedOtMinutes += ot.durationMinutes;
      } else if (ot.status === "pending") {
        totalPendingOtRequests++;
      } else {
        totalRejectedOtRequests++;
      }
    }

    const otApprovalRate =
      totalOtRequests > 0
        ? Math.round((totalApprovedOtRequests / totalOtRequests) * 100)
        : 0;

    let topOtEmployee = "N/A";
    if (employeeSummaries.length > 0 && employeeSummaries[0].approvedOtHours > 0) {
      topOtEmployee = `${employeeSummaries[0].name} (${employeeSummaries[0].approvedOtHours}h)`;
    }

    let topOtCompany = "N/A";
    const sortedCos = [...companySummaries].sort(
      (a, b) => b.approvedOtHours - a.approvedOtHours
    );
    if (sortedCos.length > 0 && sortedCos[0].approvedOtHours > 0) {
      topOtCompany = `${sortedCos[0].companyCode} (${sortedCos[0].approvedOtHours}h)`;
    }

    const kpis: IntercompanyOvertimeKpis = {
      totalEmployees: employeeSummaries.length,
      totalOtMinutes,
      totalOtHours: Math.round((totalOtMinutes / 60) * 10) / 10,
      totalOtRequests,
      totalApprovedOtRequests,
      totalApprovedOtMinutes,
      totalApprovedOtHours: Math.round((totalApprovedOtMinutes / 60) * 10) / 10,
      totalPendingOtRequests,
      totalRejectedOtRequests,
      otApprovalRate,
      activeCompaniesCount: companySummaries.filter((c) => c.status === "ACTIVE").length,
      totalCompaniesCount: companySummaries.length,
      topOtEmployee,
      topOtCompany,
    };

    // 6. Daily Trends
    const dailyMap = new Map<string, { totalMins: number; approvedMins: number; count: number; approvedCount: number }>();
    for (const d of targetDates) {
      dailyMap.set(d, { totalMins: 0, approvedMins: 0, count: 0, approvedCount: 0 });
    }

    for (const ot of allOvertimeRecords) {
      const cur = dailyMap.get(ot.requestDate);
      if (cur) {
        cur.totalMins += ot.durationMinutes;
        cur.count++;
        if (ot.status === "approved") {
          cur.approvedMins += ot.durationMinutes;
          cur.approvedCount++;
        }
      }
    }

    const dailyTrends: DailyOtTrendPoint[] = Array.from(dailyMap.entries()).map(
      ([date, v]) => ({
        date,
        displayDate: date.slice(5),
        totalOtMinutes: v.totalMins,
        totalOtHours: Math.round((v.totalMins / 60) * 10) / 10,
        approvedOtMinutes: v.approvedMins,
        approvedOtHours: Math.round((v.approvedMins / 60) * 10) / 10,
        otRequestsCount: v.count,
        approvedRequestsCount: v.approvedCount,
      })
    );

    // 7. Status distribution
    const statusDistribution: StatusDistributionSegment[] = [
      {
        name: "Approved",
        count: totalApprovedOtRequests,
        percentage: totalOtRequests > 0 ? Math.round((totalApprovedOtRequests / totalOtRequests) * 100) : 0,
        color: "#10b981",
      },
      {
        name: "Pending",
        count: totalPendingOtRequests,
        percentage: totalOtRequests > 0 ? Math.round((totalPendingOtRequests / totalOtRequests) * 100) : 0,
        color: "#f59e0b",
      },
      {
        name: "Rejected",
        count: totalRejectedOtRequests,
        percentage: totalOtRequests > 0 ? Math.round((totalRejectedOtRequests / totalOtRequests) * 100) : 0,
        color: "#f43f5e",
      },
    ];

    const companiesList: CompanyFilterOption[] = companySummaries.map((c) => ({
      companyId: c.companyId,
      companyName: c.companyName,
      companyCode: c.companyCode,
    }));

    const departmentsList = Array.from(departmentsSet).sort();
    const statusesList = ["ALL", "approved", "pending", "rejected"];

    const responsePayload: IntercompanyOvertimeData = {
      startDate,
      endDate,
      dates: targetDates,
      kpis,
      companySummaries,
      employeeSummaries,
      dailyTrends,
      statusDistribution,
      overtimeRecords: allOvertimeRecords,
      companiesList,
      departmentsList,
      statusesList,
    };

    memoryCache.set(cacheKey, {
      data: responsePayload,
      timestamp: Date.now(),
    });

    return NextResponse.json(responsePayload);
  } catch (error: unknown) {
    console.error("[Intercompany Overtime API Error]", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
