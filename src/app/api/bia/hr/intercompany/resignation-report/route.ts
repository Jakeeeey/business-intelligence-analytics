import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  IntercompanyResignationData,
  IntercompanyResignationKpis,
  CompanyResignationSummary,
  DepartmentResignationSummary,
  ReasonDistributionSegment,
  NoticeDistributionSegment,
  ResignationTrendPoint,
  IntercompanyResignationRecord,
  CompanyFilterOption,
  ResignationStatus,
} from "@/modules/business-intelligence-analytics/hr/intercompany/resignation-report/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "vos_access_token";

type AnyRec = Record<string, unknown>;

interface CachedReport {
  data: IntercompanyResignationData;
  timestamp: number;
}

const memoryCache = new Map<string, CachedReport>();
const CACHE_TTL_MS = 30000; // 30s

async function fetchDirectusWithTimeout<T>(
  url: string,
  headers: Record<string, string>,
  timeoutMs = 6000
): Promise<{ data: T[]; ok: boolean }> {
  try {
    const res = await fetch(url, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return { data: [], ok: false };
    const json = await res.json();
    return {
      data: Array.isArray(json.data) ? (json.data as T[]) : [],
      ok: true,
    };
  } catch {
    return { data: [], ok: false };
  }
}

function detectReasonCategory(reason: string): string {
  const text = (reason || "").toLowerCase();
  if (
    text.includes("career") ||
    text.includes("opportunity") ||
    text.includes("growth") ||
    text.includes("advance") ||
    text.includes("promotion") ||
    text.includes("offer")
  ) {
    return "Career Growth & Opportunity";
  }
  if (
    text.includes("salary") ||
    text.includes("pay") ||
    text.includes("wage") ||
    text.includes("compensation") ||
    text.includes("benefit")
  ) {
    return "Compensation & Benefits";
  }
  if (
    text.includes("relocat") ||
    text.includes("move") ||
    text.includes("commute") ||
    text.includes("distance") ||
    text.includes("travel") ||
    text.includes("far") ||
    text.includes("provinc")
  ) {
    return "Relocation & Commute";
  }
  if (
    text.includes("family") ||
    text.includes("personal") ||
    text.includes("child") ||
    text.includes("parent") ||
    text.includes("care") ||
    text.includes("marriage") ||
    text.includes("maternity")
  ) {
    return "Personal & Family Reasons";
  }
  if (
    text.includes("health") ||
    text.includes("medical") ||
    text.includes("sick") ||
    text.includes("ill") ||
    text.includes("doctor") ||
    text.includes("rest")
  ) {
    return "Health & Medical";
  }
  if (
    text.includes("study") ||
    text.includes("school") ||
    text.includes("college") ||
    text.includes("degree") ||
    text.includes("master") ||
    text.includes("exam") ||
    text.includes("board")
  ) {
    return "Further Studies / Education";
  }
  if (
    text.includes("stress") ||
    text.includes("burnout") ||
    text.includes("workload") ||
    text.includes("management") ||
    text.includes("conflict") ||
    text.includes("culture") ||
    text.includes("environment")
  ) {
    return "Work Environment & Workload";
  }
  if (text.includes("retire")) {
    return "Retirement";
  }
  if (text.includes("business") || text.includes("venture") || text.includes("entrepreneur")) {
    return "Business Venture";
  }
  return "General Resignation";
}

function formatDate(isoString?: string | null): string {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return String(isoString);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return String(isoString);
  }
}

function calculateTenure(hireDateStr?: string | null, resignationDateStr?: string | null): {
  months: number | null;
  formatted: string | null;
} {
  if (!hireDateStr || !resignationDateStr) return { months: null, formatted: null };
  try {
    const hireDate = new Date(hireDateStr);
    const resDate = new Date(resignationDateStr);
    if (isNaN(hireDate.getTime()) || isNaN(resDate.getTime())) {
      return { months: null, formatted: null };
    }
    const diffMs = resDate.getTime() - hireDate.getTime();
    if (diffMs <= 0) return { months: 0, formatted: "< 1 month" };

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const totalMonths = Math.floor(diffDays / 30.4375);
    const years = Math.floor(totalMonths / 12);
    const remainingMonths = totalMonths % 12;

    if (years === 0) {
      return {
        months: totalMonths,
        formatted: `${totalMonths} mo${totalMonths === 1 ? "" : "s"}`,
      };
    }
    return {
      months: totalMonths,
      formatted: `${years} yr${years === 1 ? "" : "s"}${
        remainingMonths > 0 ? ` ${remainingMonths} mo${remainingMonths === 1 ? "" : "s"}` : ""
      }`,
    };
  } catch {
    return { months: null, formatted: null };
  }
}

const REASON_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#64748b", // Slate
  "#14b8a6", // Teal
  "#a855f7", // Violet
];

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
    const force = searchParams.get("force") === "true";

    const cacheKey = "intercompany_resignation_report";
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

    // 1. Fetch operating companies from company_list
    const companiesRes = await fetchDirectusWithTimeout<AnyRec>(
      `${primaryBaseUrl}/items/company_list?limit=-1&fields=company_id,company_name,company_code,directus,directus_token,status,is_default,is_mother_company`,
      primaryHeaders,
      6000
    );

    const validCompanies = companiesRes.data.filter((c) => {
      if (!c.directus || typeof c.directus !== "string" || !c.directus.trim()) return false;
      if (String(c.status || "ACTIVE").toUpperCase() === "INACTIVE") return false;
      return true;
    });

    const userFields =
      "user_id,user_fname,user_lname,user_mname,suffix_name,user_department,user_position,user_email,user_contact,user_image,user_dateOfHire,user_status";

    // 2. Concurrently query each operating company's resignations, users, and departments
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
        if (companyToken) compHeaders["Authorization"] = `Bearer ${companyToken}`;

        const [reqRes, userResRes, usersRes, deptsRes] = await Promise.all([
          // resignation_request table
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/resignation_request?limit=-1&fields=id,user_id,resignation_date,reason,status,attachment_uuid,attachment_name,attachment_type,hr_remarks,reviewed_by,reviewed_at,filed_at,created_by,updated_at,updated_by`,
            compHeaders,
            6000
          ),
          // user_resignation table
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/user_resignation?limit=-1&fields=id,user_id,filing_date,last_day,reason,attachment_path,created_at`,
            compHeaders,
            6000
          ),
          // user table
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/user?limit=-1&fields=${userFields}`,
            compHeaders,
            6000
          ),
          // department table
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/department?limit=-1&fields=id,department_id,department_name`,
            compHeaders,
            6000
          ),
        ]);

        const isOnline = reqRes.ok || userResRes.ok || usersRes.ok;

        // Build users lookup
        const userMap = new Map<number, AnyRec>();
        usersRes.data.forEach((u) => {
          const uid = Number(u.user_id);
          if (!isNaN(uid)) userMap.set(uid, u);
        });

        // Build departments lookup
        const deptMap = new Map<number, string>();
        deptsRes.data.forEach((d) => {
          const did = Number(d.id ?? d.department_id);
          const dname = String(d.department_name || "").trim();
          if (!isNaN(did) && dname) deptMap.set(did, dname);
        });

        const activeEmployeesInCompany = usersRes.data.filter((u) => {
          const st = String(u.user_status || "ACTIVE").toUpperCase();
          return st === "ACTIVE" || st === "1";
        }).length;

        const companyRecords: IntercompanyResignationRecord[] = [];

        // Map resignation_request records
        reqRes.data.forEach((item) => {
          const recId = Number(item.id);
          const userId = Number(item.user_id);
          const user = userMap.get(userId);

          const firstName = String(user?.user_fname || "").trim();
          const lastName = String(user?.user_lname || "").trim();
          const middleName = user?.user_mname ? String(user.user_mname).trim() : undefined;
          const suffix = user?.suffix_name ? ` ${user.suffix_name}` : "";
          const fullName = firstName || lastName ? `${firstName} ${lastName}${suffix}`.trim() : `Employee #${userId}`;

          let deptName = "Unassigned";
          const userDeptId = Number(user?.user_department);
          if (!isNaN(userDeptId) && deptMap.has(userDeptId)) {
            deptName = deptMap.get(userDeptId)!;
          } else if (user?.user_department && typeof user.user_department === "string") {
            deptName = String(user.user_department);
          }

          const position = String(user?.user_position || "Staff").trim();
          const email = String(user?.user_email || "-").trim();
          const contact = String(user?.user_contact || "-").trim();
          const avatar = (user?.user_image as string) || null;
          const hireDate = (user?.user_dateOfHire as string) || null;

          const rawStatus = String(item.status || "PENDING").trim().toUpperCase();
          let status: ResignationStatus = rawStatus;
          if (rawStatus === "APPROVED" || rawStatus === "ACCEPTED") status = "APPROVED";
          else if (rawStatus === "PENDING" || rawStatus === "FILED") status = "PENDING";
          else if (rawStatus === "REJECTED" || rawStatus === "DECLINED") status = "REJECTED";
          else if (rawStatus === "COMPLETED") status = "COMPLETED";

          const filingDateStr = (item.filed_at as string) || (item.created_at as string) || new Date().toISOString();
          const resignationDateStr = (item.resignation_date as string) || filingDateStr;

          const filingDate = new Date(filingDateStr);
          const resDate = new Date(resignationDateStr);
          let noticeDays = 0;
          if (!isNaN(filingDate.getTime()) && !isNaN(resDate.getTime())) {
            noticeDays = Math.round((resDate.getTime() - filingDate.getTime()) / (1000 * 60 * 60 * 24));
          }

          let noticeCategory: IntercompanyResignationRecord["noticeCategory"] = "30+ Days (Compliant)";
          if (noticeDays >= 30) noticeCategory = "30+ Days (Compliant)";
          else if (noticeDays >= 15) noticeCategory = "15-29 Days";
          else if (noticeDays > 0) noticeCategory = "< 15 Days";
          else noticeCategory = "Immediate / Past";

          const reason = String(item.reason || "No reason specified").trim();
          const reasonCategory = detectReasonCategory(reason);

          // Reviewer lookup
          let reviewerName: string | null = null;
          const reviewerId = Number(item.reviewed_by);
          if (!isNaN(reviewerId) && reviewerId > 0) {
            const reviewer = userMap.get(reviewerId);
            if (reviewer) {
              reviewerName = `${reviewer.user_fname || ""} ${reviewer.user_lname || ""}`.trim();
            }
          }

          // Attachment URL
          let attachmentUrl: string | null = null;
          if (item.attachment_uuid) {
            attachmentUrl = `${companyUrl}/assets/${item.attachment_uuid}`;
          }

          const tenure = calculateTenure(hireDate, resignationDateStr);

          companyRecords.push({
            id: `${companyId}-req-${recId}`,
            recordId: recId,
            source: "resignation_request",
            userId,
            employeeId: `EMP-${userId}`,
            name: fullName,
            firstName,
            lastName,
            middleName,
            email,
            contact,
            avatar,
            position,
            department: deptName,
            departmentId: isNaN(userDeptId) ? null : userDeptId,
            companyId,
            companyName,
            companyCode,
            companyDirectusUrl: companyUrl,
            filingDate: filingDateStr,
            filingDateFormatted: formatDate(filingDateStr),
            resignationDate: resignationDateStr,
            resignationDateFormatted: formatDate(resignationDateStr),
            noticeDays,
            noticeCategory,
            reason,
            reasonCategory,
            status,
            attachmentUuid: (item.attachment_uuid as string) || null,
            attachmentName: (item.attachment_name as string) || null,
            attachmentType: (item.attachment_type as string) || null,
            attachmentUrl,
            hrRemarks: (item.hr_remarks as string) || null,
            reviewedBy: isNaN(reviewerId) ? null : reviewerId,
            reviewerName,
            reviewedAt: (item.reviewed_at as string) || null,
            reviewedAtFormatted: formatDate((item.reviewed_at as string) || null),
            dateOfHire: hireDate,
            tenureMonths: tenure.months,
            tenureFormatted: tenure.formatted,
            createdAt: filingDateStr,
          });
        });

        // Map user_resignation records (avoid duplicating if same user has request)
        const recordedUserIds = new Set(companyRecords.map((r) => r.userId));
        userResRes.data.forEach((item) => {
          const recId = Number(item.id);
          const userId = Number(item.user_id);
          // If already captured from resignation_request, skip duplicate
          if (recordedUserIds.has(userId)) return;

          const user = userMap.get(userId);

          const firstName = String(user?.user_fname || "").trim();
          const lastName = String(user?.user_lname || "").trim();
          const middleName = user?.user_mname ? String(user.user_mname).trim() : undefined;
          const suffix = user?.suffix_name ? ` ${user.suffix_name}` : "";
          const fullName = firstName || lastName ? `${firstName} ${lastName}${suffix}`.trim() : `Employee #${userId}`;

          let deptName = "Unassigned";
          const userDeptId = Number(user?.user_department);
          if (!isNaN(userDeptId) && deptMap.has(userDeptId)) {
            deptName = deptMap.get(userDeptId)!;
          } else if (user?.user_department && typeof user.user_department === "string") {
            deptName = String(user.user_department);
          }

          const position = String(user?.user_position || "Staff").trim();
          const email = String(user?.user_email || "-").trim();
          const contact = String(user?.user_contact || "-").trim();
          const avatar = (user?.user_image as string) || null;
          const hireDate = (user?.user_dateOfHire as string) || null;

          const filingDateStr = (item.filing_date as string) || (item.created_at as string) || new Date().toISOString();
          const resignationDateStr = (item.last_day as string) || filingDateStr;

          const filingDate = new Date(filingDateStr);
          const resDate = new Date(resignationDateStr);
          let noticeDays = 0;
          if (!isNaN(filingDate.getTime()) && !isNaN(resDate.getTime())) {
            noticeDays = Math.round((resDate.getTime() - filingDate.getTime()) / (1000 * 60 * 60 * 24));
          }

          let noticeCategory: IntercompanyResignationRecord["noticeCategory"] = "30+ Days (Compliant)";
          if (noticeDays >= 30) noticeCategory = "30+ Days (Compliant)";
          else if (noticeDays >= 15) noticeCategory = "15-29 Days";
          else if (noticeDays > 0) noticeCategory = "< 15 Days";
          else noticeCategory = "Immediate / Past";

          const reason = String(item.reason || "Resigned").trim();
          const reasonCategory = detectReasonCategory(reason);

          let attachmentUrl: string | null = null;
          const attPath = (item.attachment_path as string) || null;
          if (attPath) {
            attachmentUrl = attPath.startsWith("http") ? attPath : `${companyUrl}/assets/${attPath}`;
          }

          const tenure = calculateTenure(hireDate, resignationDateStr);

          companyRecords.push({
            id: `${companyId}-ures-${recId}`,
            recordId: recId,
            source: "user_resignation",
            userId,
            employeeId: `EMP-${userId}`,
            name: fullName,
            firstName,
            lastName,
            middleName,
            email,
            contact,
            avatar,
            position,
            department: deptName,
            departmentId: isNaN(userDeptId) ? null : userDeptId,
            companyId,
            companyName,
            companyCode,
            companyDirectusUrl: companyUrl,
            filingDate: filingDateStr,
            filingDateFormatted: formatDate(filingDateStr),
            resignationDate: resignationDateStr,
            resignationDateFormatted: formatDate(resignationDateStr),
            noticeDays,
            noticeCategory,
            reason,
            reasonCategory,
            status: "COMPLETED",
            attachmentPath: attPath,
            attachmentUrl,
            dateOfHire: hireDate,
            tenureMonths: tenure.months,
            tenureFormatted: tenure.formatted,
            createdAt: filingDateStr,
          });
        });

        // Compute company summary
        const total = companyRecords.length;
        const pending = companyRecords.filter((r) => r.status === "PENDING").length;
        const approved = companyRecords.filter((r) => r.status === "APPROVED").length;
        const rejected = companyRecords.filter((r) => r.status === "REJECTED").length;
        const completed = companyRecords.filter((r) => r.status === "COMPLETED" || r.status === "RECORDED").length;

        const compliantCount = companyRecords.filter((r) => r.noticeDays >= 30).length;
        const complianceRate = total > 0 ? Math.round((compliantCount / total) * 100) : 100;
        const totalNoticeDays = companyRecords.reduce((acc, r) => acc + (r.noticeDays > 0 ? r.noticeDays : 0), 0);
        const avgNoticeDays = total > 0 ? Math.round(totalNoticeDays / total) : 30;

        const effectiveTotalEmployees = Math.max(activeEmployeesInCompany, total);
        const turnoverRate = effectiveTotalEmployees > 0 ? Number(((total / effectiveTotalEmployees) * 100).toFixed(1)) : 0;

        const summary: CompanyResignationSummary = {
          companyId,
          companyName,
          companyCode,
          status: isOnline ? "ACTIVE" : "OFFLINE",
          totalResignations: total,
          pendingCount: pending,
          approvedCount: approved,
          rejectedCount: rejected,
          completedCount: completed,
          avgNoticeDays,
          complianceRate,
          totalEmployees: effectiveTotalEmployees,
          turnoverRate,
          sharePercentage: 0,
        };

        return {
          company,
          records: companyRecords,
          summary,
          isOnline,
        };
      })
    );

    // 3. Aggregate across all companies
    const allRecords: IntercompanyResignationRecord[] = [];
    const companySummaries: CompanyResignationSummary[] = [];
    const companyOptions: CompanyFilterOption[] = [];
    let activeCompaniesCount = 0;
    const totalCompaniesCount = validCompanies.length;

    companyFetchResults.forEach((result, idx) => {
      const fallbackCompany = validCompanies[idx];
      if (result.status === "fulfilled") {
        const { company, records, summary, isOnline } = result.value;
        if (isOnline) activeCompaniesCount++;
        allRecords.push(...records);
        companySummaries.push(summary);
        companyOptions.push({
          companyId: Number(company.company_id),
          companyName: String(company.company_name || "").trim(),
          companyCode: String(company.company_code || "").trim(),
        });
      } else {
        const cId = Number(fallbackCompany.company_id);
        companySummaries.push({
          companyId: cId,
          companyName: String(fallbackCompany.company_name || `Company #${cId}`).trim(),
          companyCode: String(fallbackCompany.company_code || `CMP-${cId}`).trim(),
          status: "OFFLINE",
          totalResignations: 0,
          pendingCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
          completedCount: 0,
          avgNoticeDays: 0,
          complianceRate: 100,
          totalEmployees: 0,
          turnoverRate: 0,
          sharePercentage: 0,
        });
        companyOptions.push({
          companyId: cId,
          companyName: String(fallbackCompany.company_name || `Company #${cId}`).trim(),
          companyCode: String(fallbackCompany.company_code || `CMP-${cId}`).trim(),
        });
      }
    });

    const totalResignations = allRecords.length;

    // Calculate share percentages
    companySummaries.forEach((cs) => {
      cs.sharePercentage =
        totalResignations > 0 ? Number(((cs.totalResignations / totalResignations) * 100).toFixed(1)) : 0;
    });

    // 4. Calculate overall KPIs
    const pendingCount = allRecords.filter((r) => r.status === "PENDING").length;
    const approvedCount = allRecords.filter((r) => r.status === "APPROVED").length;
    const rejectedCount = allRecords.filter((r) => r.status === "REJECTED").length;
    const completedCount = allRecords.filter((r) => r.status === "COMPLETED" || r.status === "RECORDED").length;

    const totalEmployeesAcrossCompanies = companySummaries.reduce((sum, c) => sum + c.totalEmployees, 0);
    const overallTurnoverRate =
      totalEmployeesAcrossCompanies > 0
        ? Number(((totalResignations / totalEmployeesAcrossCompanies) * 100).toFixed(1))
        : 0;

    const compliantCount = allRecords.filter((r) => r.noticeDays >= 30).length;
    const compliantNoticeRate =
      totalResignations > 0 ? Math.round((compliantCount / totalResignations) * 100) : 100;

    const validNoticeRecords = allRecords.filter((r) => r.noticeDays > 0);
    const avgNoticeDays =
      validNoticeRecords.length > 0
        ? Math.round(validNoticeRecords.reduce((s, r) => s + r.noticeDays, 0) / validNoticeRecords.length)
        : 30;

    const companiesWithResignationsCount = companySummaries.filter((c) => c.totalResignations > 0).length;

    const sortedByTurnover = [...companySummaries]
      .filter((c) => c.totalResignations > 0)
      .sort((a, b) => b.turnoverRate - a.turnoverRate);
    const topTurnoverCompany = sortedByTurnover.length > 0 ? sortedByTurnover[0].companyName : "None";

    // 5. Department Summaries
    const deptMap = new Map<string, { total: number; pending: number; approved: number }>();
    allRecords.forEach((r) => {
      const d = r.department || "Unassigned";
      const curr = deptMap.get(d) || { total: 0, pending: 0, approved: 0 };
      curr.total++;
      if (r.status === "PENDING") curr.pending++;
      if (r.status === "APPROVED" || r.status === "COMPLETED") curr.approved++;
      deptMap.set(d, curr);
    });

    const departmentSummaries: DepartmentResignationSummary[] = Array.from(deptMap.entries())
      .map(([department, stat]) => ({
        department,
        totalResignations: stat.total,
        pendingCount: stat.pending,
        approvedCount: stat.approved,
        percentage: totalResignations > 0 ? Math.round((stat.total / totalResignations) * 100) : 0,
      }))
      .sort((a, b) => b.totalResignations - a.totalResignations);

    const topTurnoverDepartment = departmentSummaries.length > 0 ? departmentSummaries[0].department : "None";

    // 6. Reason Category Distribution
    const reasonCounts = new Map<string, number>();
    allRecords.forEach((r) => {
      const cat = r.reasonCategory;
      reasonCounts.set(cat, (reasonCounts.get(cat) || 0) + 1);
    });

    const reasonDistribution: ReasonDistributionSegment[] = Array.from(reasonCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], index) => ({
        name,
        count,
        percentage: totalResignations > 0 ? Math.round((count / totalResignations) * 100) : 0,
        color: REASON_COLORS[index % REASON_COLORS.length],
      }));

    const topResignationReason = reasonDistribution.length > 0 ? reasonDistribution[0].name : "General Resignation";

    // 7. Notice Period Distribution
    const noticeCats = [
      { range: "30+ Days (Compliant)", count: 0, color: "#10b981" },
      { range: "15-29 Days", count: 0, color: "#f59e0b" },
      { range: "< 15 Days", count: 0, color: "#ef4444" },
      { range: "Immediate / Past", count: 0, color: "#8b5cf6" },
    ];
    allRecords.forEach((r) => {
      const found = noticeCats.find((c) => c.range === r.noticeCategory);
      if (found) found.count++;
      else noticeCats[0].count++;
    });
    const noticeDistribution: NoticeDistributionSegment[] = noticeCats.map((item) => ({
      range: item.range,
      count: item.count,
      percentage: totalResignations > 0 ? Math.round((item.count / totalResignations) * 100) : 0,
      color: item.color,
    }));

    // 8. Monthly Resignation Trends (Past 6 months)
    const now = new Date();
    const trendMap = new Map<string, { total: number; pending: number; approved: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      trendMap.set(key, { total: 0, pending: 0, approved: 0 });
    }

    allRecords.forEach((r) => {
      try {
        const d = new Date(r.filingDate);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          if (trendMap.has(key)) {
            const curr = trendMap.get(key)!;
            curr.total++;
            if (r.status === "PENDING") curr.pending++;
            if (r.status === "APPROVED" || r.status === "COMPLETED") curr.approved++;
          }
        }
      } catch {
        // ignore
      }
    });

    const trends: ResignationTrendPoint[] = Array.from(trendMap.entries()).map(([key, stat]) => {
      const [yearStr, monthStr] = key.split("-");
      const d = new Date(Number(yearStr), Number(monthStr) - 1, 1);
      const displayDate = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      return {
        date: key,
        displayDate,
        totalCount: stat.total,
        pendingCount: stat.pending,
        approvedCount: stat.approved,
      };
    });

    // Extract unique department & reason lists
    const uniqueDepartments = Array.from(new Set(allRecords.map((r) => r.department).filter(Boolean))).sort();
    const uniqueReasonCategories = Array.from(new Set(allRecords.map((r) => r.reasonCategory).filter(Boolean))).sort();

    // Sort records descending by filing date
    allRecords.sort((a, b) => new Date(b.filingDate).getTime() - new Date(a.filingDate).getTime());

    const kpis: IntercompanyResignationKpis = {
      totalResignations,
      pendingCount,
      approvedCount,
      rejectedCount,
      completedCount,
      avgNoticeDays,
      compliantNoticeRate,
      totalEmployees: totalEmployeesAcrossCompanies,
      turnoverRate: overallTurnoverRate,
      activeCompaniesCount,
      totalCompaniesCount,
      companiesWithResignationsCount,
      topTurnoverCompany,
      topTurnoverDepartment,
      topResignationReason,
    };

    const responseData: IntercompanyResignationData = {
      records: allRecords,
      kpis,
      companySummaries,
      departmentSummaries,
      reasonDistribution,
      noticeDistribution,
      trends,
      companies: companyOptions,
      departments: uniqueDepartments,
      reasonCategories: uniqueReasonCategories,
      lastUpdated: new Date().toISOString(),
    };

    memoryCache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    return NextResponse.json(responseData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

