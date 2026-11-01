import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  IntercompanyConcernsData,
  IntercompanyConcernsKpis,
  CompanyConcernsSummary,
  DepartmentConcernsSummary,
  ConcernDistributionSegment,
  ConcernTrendPoint,
  IntercompanyConcernRecord,
  CompanyFilterOption,
} from "@/modules/business-intelligence-analytics/hr/intercompany/employee-concerns-report/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "vos_access_token";

type AnyRec = Record<string, unknown>;

interface CachedReport {
  data: IntercompanyConcernsData;
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

function detectCategory(subject: string, body: string): string {
  const combined = `${subject} ${body}`.toLowerCase();
  if (
    combined.includes("late") ||
    combined.includes("tardy") ||
    combined.includes("shift") ||
    combined.includes("schedule") ||
    combined.includes("attendance") ||
    combined.includes("time in") ||
    combined.includes("time out") ||
    combined.includes("overtime")
  ) {
    return "Attendance & Schedule";
  }
  if (
    combined.includes("salary") ||
    combined.includes("pay") ||
    combined.includes("payroll") ||
    combined.includes("deduction") ||
    combined.includes("wage") ||
    combined.includes("bonus") ||
    combined.includes("reimburse") ||
    combined.includes("allowance")
  ) {
    return "Compensation & Payroll";
  }
  if (
    combined.includes("equipment") ||
    combined.includes("facility") ||
    combined.includes("office") ||
    combined.includes("uniform") ||
    combined.includes("safety") ||
    combined.includes("computer") ||
    combined.includes("system") ||
    combined.includes("tool")
  ) {
    return "Workplace & Facilities";
  }
  if (
    combined.includes("supervisor") ||
    combined.includes("manager") ||
    combined.includes("team") ||
    combined.includes("coworker") ||
    combined.includes("colleague") ||
    combined.includes("harass") ||
    combined.includes("conflict")
  ) {
    return "Employee Relations";
  }
  return "General Inquiry";
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
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
    const force = searchParams.get("force") === "true";

    const cacheKey = "intercompany_concerns_report";
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
    const companiesRes = await fetchDirectusWithTimeout<AnyRec>(
      `${primaryBaseUrl}/items/company_list?limit=-1&fields=company_id,company_name,company_code,directus,directus_token,status,is_default,is_mother_company`,
      primaryHeaders,
      6000
    );

    const validCompanies = companiesRes.data.filter((c) => {
      if (!c.directus || typeof c.directus !== "string" || !c.directus.trim()) return false;
      if (String(c.status || "ACTIVE").toUpperCase() === "INACTIVE") return false;
      if (String(c.directus).includes(":8056")) return false;
      return true;
    });

    const userFields =
      "user_id,user_fname,user_lname,user_mname,suffix_name,user_department,user_position,user_email,user_contact,user_image";

    // 2. Concurrently query each company's employee_concerns, users, and departments
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

        const [concernsRes, usersRes, departmentsRes] = await Promise.all([
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/employee_concerns?limit=-1&sort=-created_at&fields=id,user_id,subject_of_concern,concern,is_anonymous,status,created_at,created_by`,
            compHeaders,
            6000
          ),
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
        ]);

        return {
          companyId,
          companyName,
          companyCode,
          concerns: concernsRes.data,
          users: usersRes.data,
          departments: departmentsRes.data,
          isOnline: concernsRes.ok,
        };
      })
    );

    const allRecords: IntercompanyConcernRecord[] = [];
    const companySummaries: CompanyConcernsSummary[] = [];
    const companiesList: CompanyFilterOption[] = [];
    const allDepartmentsSet = new Set<string>();
    const allStatusesSet = new Set<string>();
    const allCategoriesSet = new Set<string>();

    const deptAggregator = new Map<
      string,
      { total: number; pending: number; resolved: number; cos: Set<number> }
    >();

    const statusCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();
    const trendMap = new Map<string, { total: number; pending: number; resolved: number }>();

    let grandTotalConcerns = 0;
    let grandPending = 0;
    let grandInReview = 0;
    let grandResolved = 0;
    let grandClosed = 0;
    let grandAnonymous = 0;
    let activeCompaniesCount = 0;
    let companiesWithConcernsCount = 0;

    for (const res of companyFetchResults) {
      if (res.status !== "fulfilled") continue;

      const { companyId, companyName, companyCode, concerns, users, departments, isOnline } =
        res.value;

      companiesList.push({ companyId, companyName, companyCode });

      if (!isOnline && concerns.length === 0) {
        companySummaries.push({
          companyId,
          companyName,
          companyCode,
          status: "OFFLINE",
          totalConcerns: 0,
          pendingCount: 0,
          inReviewCount: 0,
          resolvedCount: 0,
          closedCount: 0,
          anonymousCount: 0,
          resolutionRate: 0,
          sharePercentage: 0,
        });
        continue;
      }

      activeCompaniesCount++;

      // Department map
      const deptMap = new Map<number, string>();
      departments.forEach((d) => {
        const id = Number(d.department_id || d.id);
        const name = String(d.department_name || d.name || "").trim();
        if (id && name) deptMap.set(id, name);
      });

      // User map
      const userMap = new Map<number, AnyRec>();
      users.forEach((u) => {
        const uid = Number(u.user_id);
        if (uid) userMap.set(uid, u);
      });

      let compPending = 0;
      let compInReview = 0;
      let compResolved = 0;
      let compClosed = 0;
      let compAnonymous = 0;

      if (concerns.length > 0) {
        companiesWithConcernsCount++;
      }

      concerns.forEach((c) => {
        const concernId = Number(c.id);
        const uid = c.user_id ? Number(c.user_id) : null;
        const createdById = c.created_by ? Number(c.created_by) : null;
        const isAnon = parseBit(c.is_anonymous);
        const rawStatus = String(c.status || "PENDING").trim().toUpperCase();
        const subject = String(c.subject_of_concern || "").trim();
        const concernText = String(c.concern || "").trim();
        const createdAtIso = String(c.created_at || new Date().toISOString());
        const dateStr = createdAtIso.slice(0, 10);

        grandTotalConcerns++;
        if (isAnon) {
          grandAnonymous++;
          compAnonymous++;
        }

        if (rawStatus === "PENDING") {
          grandPending++;
          compPending++;
        } else if (
          rawStatus === "IN_REVIEW" ||
          rawStatus === "UNDER_REVIEW" ||
          rawStatus === "IN PROGRESS" ||
          rawStatus === "INVESTIGATING"
        ) {
          grandInReview++;
          compInReview++;
        } else if (rawStatus === "RESOLVED" || rawStatus === "COMPLETED") {
          grandResolved++;
          compResolved++;
        } else if (rawStatus === "CLOSED" || rawStatus === "DISMISSED") {
          grandClosed++;
          compClosed++;
        }

        statusCounts.set(rawStatus, (statusCounts.get(rawStatus) || 0) + 1);
        allStatusesSet.add(rawStatus);

        const category = detectCategory(subject, concernText);
        categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
        allCategoriesSet.add(category);

        // Trend aggregation
        const t = trendMap.get(dateStr) || { total: 0, pending: 0, resolved: 0 };
        t.total++;
        if (rawStatus === "PENDING") t.pending++;
        if (rawStatus === "RESOLVED") t.resolved++;
        trendMap.set(dateStr, t);

        // Submitter info
        const userObj = uid ? userMap.get(uid) : null;
        const creatorObj = createdById ? userMap.get(createdById) : null;

        const fn = userObj ? String(userObj.user_fname || "").trim() : "";
        const ln = userObj ? String(userObj.user_lname || "").trim() : "";
        const mn = userObj && userObj.user_mname ? String(userObj.user_mname).trim() : undefined;
        const employeeName =
          [fn, mn, ln].filter(Boolean).join(" ") || (uid ? `Staff #${uid}` : "Anonymous Personnel");

        const deptId = userObj?.user_department ? Number(userObj.user_department) : null;
        const department = (deptId ? deptMap.get(deptId) : null) || "General Operations";
        allDepartmentsSet.add(department);

        const position = userObj ? String(userObj.user_position || "Staff").trim() : "Team Member";
        const email = userObj ? String(userObj.user_email || "").trim() : "";
        const contact = userObj ? String(userObj.user_contact || "").trim() : "";
        const avatar = userObj?.user_image ? String(userObj.user_image) : null;

        const creatorFn = creatorObj ? String(creatorObj.user_fname || "").trim() : "";
        const creatorLn = creatorObj ? String(creatorObj.user_lname || "").trim() : "";
        const createdByName =
          [creatorFn, creatorLn].filter(Boolean).join(" ") ||
          (createdById ? `Staff #${createdById}` : null);

        // Department aggregation
        const dStat = deptAggregator.get(department) || {
          total: 0,
          pending: 0,
          resolved: 0,
          cos: new Set<number>(),
        };
        dStat.total++;
        if (rawStatus === "PENDING") dStat.pending++;
        if (rawStatus === "RESOLVED") dStat.resolved++;
        dStat.cos.add(companyId);
        deptAggregator.set(department, dStat);

        allRecords.push({
          id: `${companyId}-${concernId}`,
          concernId,
          userId: uid,
          employeeId: uid ? `${companyCode}-${String(uid).padStart(4, "0")}` : "ANONYMOUS",
          name: isAnon ? "Anonymous Employee" : employeeName,
          firstName: isAnon ? "Anonymous" : fn || employeeName,
          lastName: isAnon ? "" : ln,
          middleName: isAnon ? undefined : mn,
          email: isAnon ? "" : email,
          contact: isAnon ? "" : contact,
          avatar: isAnon ? null : avatar,
          position: isAnon ? "Undisclosed Position" : position,
          department,
          departmentId: deptId,
          companyId,
          companyName,
          companyCode,
          subjectOfConcern: subject || "Unspecified Subject",
          concern: concernText || "No detailed explanation provided.",
          isAnonymous: isAnon,
          status: rawStatus,
          createdAt: createdAtIso,
          createdAtFormatted: formatDate(createdAtIso),
          createdBy: createdById,
          createdByName: isAnon ? null : createdByName,
          category,
        });
      });

      const compTotal = concerns.length;
      const compResolutionRate =
        compTotal > 0 ? Math.round(((compResolved + compClosed) / compTotal) * 100) : 0;

      companySummaries.push({
        companyId,
        companyName,
        companyCode,
        status: "ACTIVE",
        totalConcerns: compTotal,
        pendingCount: compPending,
        inReviewCount: compInReview,
        resolvedCount: compResolved,
        closedCount: compClosed,
        anonymousCount: compAnonymous,
        resolutionRate: compResolutionRate,
        sharePercentage: 0, // calculated below
      });
    }

    // Compute share percentages & sort
    companySummaries.forEach((c) => {
      c.sharePercentage =
        grandTotalConcerns > 0 ? Math.round((c.totalConcerns / grandTotalConcerns) * 100) : 0;
    });
    companySummaries.sort((a, b) => b.totalConcerns - a.totalConcerns);

    // Department summaries
    const departmentSummaries: DepartmentConcernsSummary[] = [];
    deptAggregator.forEach((val, dept) => {
      departmentSummaries.push({
        department: dept,
        totalConcerns: val.total,
        pendingCount: val.pending,
        resolvedCount: val.resolved,
        companiesCount: val.cos.size,
        percentage:
          grandTotalConcerns > 0 ? Math.round((val.total / grandTotalConcerns) * 100) : 0,
      });
    });
    departmentSummaries.sort((a, b) => b.totalConcerns - a.totalConcerns);

    // Status distribution
    const statusColorMap: Record<string, string> = {
      PENDING: "#f59e0b", // amber
      IN_REVIEW: "#3b82f6", // blue
      UNDER_REVIEW: "#3b82f6",
      RESOLVED: "#10b981", // emerald
      CLOSED: "#6b7280", // gray
      DISMISSED: "#ef4444", // rose
    };
    const statusDistribution: ConcernDistributionSegment[] = Array.from(statusCounts.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: grandTotalConcerns > 0 ? Math.round((count / grandTotalConcerns) * 100) : 0,
        color: statusColorMap[name] || "#8b5cf6",
      }))
      .sort((a, b) => b.count - a.count);

    // Category distribution
    const categoryPalette = ["#06b6d4", "#f59e0b", "#8b5cf6", "#10b981", "#ec4899", "#3b82f6"];
    const categoryDistribution: ConcernDistributionSegment[] = Array.from(
      categoryCounts.entries()
    )
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], idx) => ({
        name,
        count,
        percentage: grandTotalConcerns > 0 ? Math.round((count / grandTotalConcerns) * 100) : 0,
        color: categoryPalette[idx % categoryPalette.length],
      }));

    // Trends sorted by date
    const trends: ConcernTrendPoint[] = Array.from(trendMap.entries())
      .map(([dStr, v]) => ({
        date: dStr,
        displayDate: dStr.slice(5),
        totalCount: v.total,
        pendingCount: v.pending,
        resolvedCount: v.resolved,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Sort records descending by createdAt
    allRecords.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const overallResolutionRate =
      grandTotalConcerns > 0
        ? Math.round(((grandResolved + grandClosed) / grandTotalConcerns) * 100)
        : 0;

    const topCompany = companySummaries[0];
    const topDept = departmentSummaries[0];

    const kpis: IntercompanyConcernsKpis = {
      totalConcerns: grandTotalConcerns,
      pendingCount: grandPending,
      inReviewCount: grandInReview,
      resolvedCount: grandResolved,
      closedCount: grandClosed,
      anonymousCount: grandAnonymous,
      anonymousPercentage:
        grandTotalConcerns > 0 ? Math.round((grandAnonymous / grandTotalConcerns) * 100) : 0,
      resolutionRate: overallResolutionRate,
      activeCompaniesCount,
      totalCompaniesCount: validCompanies.length,
      companiesWithConcernsCount,
      topConcernCompany: topCompany?.totalConcerns ? topCompany.companyName : "None",
      topConcernDepartment: topDept?.totalConcerns ? topDept.department : "None",
    };

    const finalData: IntercompanyConcernsData = {
      generatedAt: new Date().toISOString(),
      kpis,
      companySummaries,
      departmentSummaries,
      statusDistribution,
      categoryDistribution,
      trends,
      records: allRecords,
      companiesList: companiesList.sort((a, b) => a.companyName.localeCompare(b.companyName)),
      departmentsList: Array.from(allDepartmentsSet).sort(),
      statusesList: Array.from(allStatusesSet).sort(),
      categoriesList: Array.from(allCategoriesSet).sort(),
    };

    memoryCache.set(cacheKey, { data: finalData, timestamp: Date.now() });

    return NextResponse.json(finalData);
  } catch (err) {
    console.error("[intercompany-employee-concerns API Error]", err);
    return NextResponse.json(
      { error: "Failed to generate employee concerns report" },
      { status: 500 }
    );
  }
}

