import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  IntercompanyManpowerData,
  IntercompanyManpowerKpis,
  CompanyManpowerSummary,
  DepartmentManpowerSummary,
  PurposeDistributionSegment,
  EmploymentTypeSegment,
  ManpowerTrendPoint,
  IntercompanyManpowerRecord,
  ManpowerCandidateRecommendation,
  CompanyFilterOption,
} from "@/modules/business-intelligence-analytics/hr/intercompany/manpower-report/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "vos_access_token";

type AnyRec = Record<string, unknown>;

interface CachedReport {
  data: IntercompanyManpowerData;
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

const PURPOSE_COLORS: Record<string, string> = {
  "New Position": "#3b82f6", // Blue
  Additional: "#10b981", // Emerald
  Replacement: "#f59e0b", // Amber
};

const EMP_TYPE_COLORS: Record<string, string> = {
  Regular: "#8b5cf6", // Purple
  Seasonal: "#06b6d4", // Cyan
  Reliever: "#ec4899", // Pink
  Others: "#64748b", // Slate
};

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

    const cacheKey = "intercompany_manpower_report";
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

    const userFields = "user_id,user_fname,user_lname,user_mname,suffix_name,user_department,user_position,user_email";

    // 2. Concurrently query each company's manpower records
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

        const [reqsRes, recsRes, appsRes, deptsRes, divsRes, usersRes] = await Promise.all([
          // manpower_request
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/manpower_request?limit=-1&fields=id,request_no,requesting_department_id,position,division_id,no_manpower_needed,purpose,replacement_name,employment_type,employment_others,reason_justification,qualification,qualification_description,applicant_name,rate,requested_by,recommending_approval,noted_by,approved_by,rejected_by,status,approved_at,rejected_at,created_at,updated_at`,
            compHeaders,
            6000
          ),
          // manpower_recommendation
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/manpower_recommendation?limit=-1&fields=id,manpower_request_id,applicant_id,status,recommendation_notes,recommended_by,recommended_at,decision_by,decision_at,decision_notes,created_at`,
            compHeaders,
            6000
          ),
          // applicant
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/applicant?limit=-1&fields=id,full_name,position_applied_for,status`,
            compHeaders,
            6000
          ),
          // department
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/department?limit=-1&fields=id,department_id,department_name`,
            compHeaders,
            6000
          ),
          // division
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/division?limit=-1&fields=id,division_id,division_name,division_code`,
            compHeaders,
            6000
          ),
          // user
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/user?limit=-1&fields=${userFields}`,
            compHeaders,
            6000
          ),
        ]);

        const isOnline = reqsRes.ok || usersRes.ok;

        // User lookup
        const userMap = new Map<number, string>();
        usersRes.data.forEach((u) => {
          const uid = Number(u.user_id);
          if (!isNaN(uid)) {
            const fname = String(u.user_fname || "").trim();
            const lname = String(u.user_lname || "").trim();
            const suffix = u.suffix_name ? ` ${u.suffix_name}` : "";
            userMap.set(uid, `${fname} ${lname}${suffix}`.trim() || `User #${uid}`);
          }
        });

        // Department lookup
        const deptMap = new Map<number, string>();
        deptsRes.data.forEach((d) => {
          const did = Number(d.id ?? d.department_id);
          const name = String(d.department_name || "").trim();
          if (!isNaN(did) && name) deptMap.set(did, name);
        });

        // Division lookup
        const divMap = new Map<number, { name: string; code: string | null }>();
        divsRes.data.forEach((dv) => {
          const dvid = Number(dv.id ?? dv.division_id);
          const name = String(dv.division_name || "").trim();
          const code = dv.division_code ? String(dv.division_code).trim() : null;
          if (!isNaN(dvid) && name) divMap.set(dvid, { name, code });
        });

        // Applicant lookup
        const appMap = new Map<number, AnyRec>();
        appsRes.data.forEach((ap) => {
          const apid = Number(ap.id);
          if (!isNaN(apid)) appMap.set(apid, ap);
        });

        // Recommendations grouped by manpower_request_id
        const recsGroup = new Map<number, ManpowerCandidateRecommendation[]>();
        recsRes.data.forEach((rc) => {
          const reqId = Number(rc.manpower_request_id);
          if (isNaN(reqId)) return;
          const apId = Number(rc.applicant_id);
          const applicant = appMap.get(apId);

          const recUser = rc.recommended_by ? userMap.get(Number(rc.recommended_by)) : null;
          const decUser = rc.decision_by ? userMap.get(Number(rc.decision_by)) : null;

          const candidate: ManpowerCandidateRecommendation = {
            id: Number(rc.id),
            applicantId: apId,
            applicantName: String(applicant?.full_name || `Applicant #${apId}`).trim(),
            positionAppliedFor: (applicant?.position_applied_for as string) || null,
            applicantStatus: (applicant?.status as string) || null,
            status: String(rc.status || "Recommended").trim(),
            recommendationNotes: (rc.recommendation_notes as string) || null,
            recommendedBy: rc.recommended_by ? Number(rc.recommended_by) : null,
            recommendedByName: recUser || null,
            recommendedAt: (rc.recommended_at as string) || null,
            recommendedAtFormatted: formatDate(rc.recommended_at as string),
            decisionBy: rc.decision_by ? Number(rc.decision_by) : null,
            decisionByName: decUser || null,
            decisionAt: (rc.decision_at as string) || null,
            decisionAtFormatted: formatDate(rc.decision_at as string),
            decisionNotes: (rc.decision_notes as string) || null,
          };

          const list = recsGroup.get(reqId) || [];
          list.push(candidate);
          recsGroup.set(reqId, list);
        });

        // Map requests
        const companyRecords: IntercompanyManpowerRecord[] = [];

        reqsRes.data.forEach((r) => {
          const reqId = Number(r.id);
          const deptId = r.requesting_department_id ? Number(r.requesting_department_id) : null;
          const deptName = deptId && deptMap.has(deptId) ? deptMap.get(deptId)! : "General Operations";

          const divId = r.division_id ? Number(r.division_id) : null;
          const divInfo = divId && divMap.has(divId) ? divMap.get(divId)! : { name: "Corporate", code: null };

          const needed = Math.max(1, Number(r.no_manpower_needed || 1));
          const rateVal = Number(r.rate || 0);
          const totalBudget = Number((needed * rateVal).toFixed(2));

          const recommendations = recsGroup.get(reqId) || [];
          const hiredCount = recommendations.filter((c) => c.status === "Hired").length;
          const fulfillmentRate = needed > 0 ? Math.min(100, Math.round((hiredCount / needed) * 100)) : 0;
          const isFulfilled = hiredCount >= needed;

          const reqByName = r.requested_by ? userMap.get(Number(r.requested_by)) : null;
          const recApprovalName = r.recommending_approval ? userMap.get(Number(r.recommending_approval)) : null;
          const notedByName = r.noted_by ? userMap.get(Number(r.noted_by)) : null;
          const approvedByName = r.approved_by ? userMap.get(Number(r.approved_by)) : null;
          const rejectedByName = r.rejected_by ? userMap.get(Number(r.rejected_by)) : null;

          const rawStatus = String(r.status || "Draft").trim();
          let status = rawStatus;
          if (rawStatus.toLowerCase() === "approved") status = "Approved";
          else if (rawStatus.toLowerCase() === "rejected") status = "Rejected";
          else status = "Draft";

          const createdStr = (r.created_at as string) || new Date().toISOString();

          companyRecords.push({
            id: `${companyId}-mr-${reqId}`,
            requestId: reqId,
            requestNo: String(r.request_no || `MR-${reqId}`).trim(),
            companyId,
            companyName,
            companyCode,
            companyDirectusUrl: companyUrl,
            position: String(r.position || "Staff").trim(),
            departmentId: deptId,
            department: deptName,
            divisionId: divId,
            division: divInfo.name,
            divisionCode: divInfo.code,
            noManpowerNeeded: needed,
            purpose: String(r.purpose || "New Position").trim(),
            replacementName: (r.replacement_name as string) || null,
            employmentType: String(r.employment_type || "Regular").trim(),
            employmentOthers: (r.employment_others as string) || null,
            reasonJustification: (r.reason_justification as string) || null,
            qualification: (r.qualification as string) || null,
            qualificationDescription: (r.qualification_description as string) || null,
            applicantName: (r.applicant_name as string) || null,
            rate: rateVal,
            rateFormatted: `₱${rateVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            totalEstimatedBudget: totalBudget,
            status,
            requestedBy: r.requested_by ? Number(r.requested_by) : null,
            requestedByName: reqByName || null,
            recommendingApproval: r.recommending_approval ? Number(r.recommending_approval) : null,
            recommendingApprovalName: recApprovalName || null,
            notedBy: r.noted_by ? Number(r.noted_by) : null,
            notedByName: notedByName || null,
            approvedBy: r.approved_by ? Number(r.approved_by) : null,
            approvedByName: approvedByName || null,
            approvedAt: (r.approved_at as string) || null,
            approvedAtFormatted: formatDate(r.approved_at as string),
            rejectedBy: r.rejected_by ? Number(r.rejected_by) : null,
            rejectedByName: rejectedByName || null,
            rejectedAt: (r.rejected_at as string) || null,
            rejectedAtFormatted: formatDate(r.rejected_at as string),
            createdAt: createdStr,
            createdAtFormatted: formatDate(createdStr),
            recommendations,
            hiredCount,
            fulfillmentRate,
            isFulfilled,
          });
        });

        // Compute company summary
        const total = companyRecords.length;
        const approved = companyRecords.filter((r) => r.status === "Approved").length;
        const draft = companyRecords.filter((r) => r.status === "Draft").length;
        const rejected = companyRecords.filter((r) => r.status === "Rejected").length;

        const totalNeeded = companyRecords.reduce((sum, r) => sum + r.noManpowerNeeded, 0);
        const totalHired = companyRecords.reduce((sum, r) => sum + r.hiredCount, 0);
        const totalBudget = companyRecords.reduce((sum, r) => sum + r.totalEstimatedBudget, 0);
        const fulfillmentRate = totalNeeded > 0 ? Math.round((totalHired / totalNeeded) * 100) : 0;

        const summary: CompanyManpowerSummary = {
          companyId,
          companyName,
          companyCode,
          status: isOnline ? "ACTIVE" : "OFFLINE",
          totalRequests: total,
          approvedRequests: approved,
          draftRequests: draft,
          rejectedRequests: rejected,
          totalHeadcountNeeded: totalNeeded,
          totalHeadcountHired: totalHired,
          fulfillmentRate,
          totalBudgetRequired: totalBudget,
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

    // 3. Aggregate across companies
    const allRecords: IntercompanyManpowerRecord[] = [];
    const companySummaries: CompanyManpowerSummary[] = [];
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
          totalRequests: 0,
          approvedRequests: 0,
          draftRequests: 0,
          rejectedRequests: 0,
          totalHeadcountNeeded: 0,
          totalHeadcountHired: 0,
          fulfillmentRate: 0,
          totalBudgetRequired: 0,
          sharePercentage: 0,
        });
        companyOptions.push({
          companyId: cId,
          companyName: String(fallbackCompany.company_name || `Company #${cId}`).trim(),
          companyCode: String(fallbackCompany.company_code || `CMP-${cId}`).trim(),
        });
      }
    });

    const totalRequests = allRecords.length;

    // Calculate share percentages
    companySummaries.forEach((cs) => {
      cs.sharePercentage =
        totalRequests > 0 ? Number(((cs.totalRequests / totalRequests) * 100).toFixed(1)) : 0;
    });

    // 4. Overarching KPIs
    const approvedCount = allRecords.filter((r) => r.status === "Approved").length;
    const draftCount = allRecords.filter((r) => r.status === "Draft").length;
    const rejectedCount = allRecords.filter((r) => r.status === "Rejected").length;

    const totalHeadcountNeeded = allRecords.reduce((sum, r) => sum + r.noManpowerNeeded, 0);
    const totalHeadcountHired = allRecords.reduce((sum, r) => sum + r.hiredCount, 0);
    const totalBudgetCost = allRecords.reduce((sum, r) => sum + r.totalEstimatedBudget, 0);

    const overallApprovalRate = totalRequests > 0 ? Math.round((approvedCount / totalRequests) * 100) : 0;
    const overallFulfillmentRate =
      totalHeadcountNeeded > 0 ? Math.round((totalHeadcountHired / totalHeadcountNeeded) * 100) : 0;

    const companiesWithRequestsCount = companySummaries.filter((c) => c.totalRequests > 0).length;

    const sortedByRequests = [...companySummaries]
      .filter((c) => c.totalRequests > 0)
      .sort((a, b) => b.totalRequests - a.totalRequests);
    const topRequestingCompany = sortedByRequests.length > 0 ? sortedByRequests[0].companyName : "None";

    // 5. Department Breakdown
    const deptMap = new Map<string, { total: number; needed: number; hired: number }>();
    allRecords.forEach((r) => {
      const d = r.department || "General Operations";
      const curr = deptMap.get(d) || { total: 0, needed: 0, hired: 0 };
      curr.total++;
      curr.needed += r.noManpowerNeeded;
      curr.hired += r.hiredCount;
      deptMap.set(d, curr);
    });

    const departmentSummaries: DepartmentManpowerSummary[] = Array.from(deptMap.entries())
      .map(([department, stat]) => ({
        department,
        totalRequests: stat.total,
        headcountNeeded: stat.needed,
        headcountHired: stat.hired,
        fulfillmentRate: stat.needed > 0 ? Math.round((stat.hired / stat.needed) * 100) : 0,
      }))
      .sort((a, b) => b.headcountNeeded - a.headcountNeeded);

    const topRequestingDepartment =
      departmentSummaries.length > 0 ? departmentSummaries[0].department : "None";

    // 6. Purpose Distribution
    const purposeStats = new Map<string, { count: number; headcount: number }>();
    ["New Position", "Additional", "Replacement"].forEach((p) => purposeStats.set(p, { count: 0, headcount: 0 }));
    allRecords.forEach((r) => {
      const p = r.purpose;
      const curr = purposeStats.get(p) || { count: 0, headcount: 0 };
      curr.count++;
      curr.headcount += r.noManpowerNeeded;
      purposeStats.set(p, curr);
    });

    const purposeDistribution: PurposeDistributionSegment[] = Array.from(purposeStats.entries()).map(
      ([purpose, stat]) => ({
        purpose,
        count: stat.count,
        headcount: stat.headcount,
        percentage: totalRequests > 0 ? Math.round((stat.count / totalRequests) * 100) : 0,
        color: PURPOSE_COLORS[purpose] || "#64748b",
      })
    );

    let predominantPurpose = "New Position";
    let maxPurposeCount = -1;
    purposeDistribution.forEach((seg) => {
      if (seg.count > maxPurposeCount) {
        maxPurposeCount = seg.count;
        predominantPurpose = seg.purpose;
      }
    });

    // 7. Employment Type Distribution
    const empTypeStats = new Map<string, { count: number; headcount: number }>();
    allRecords.forEach((r) => {
      const et = r.employmentType;
      const curr = empTypeStats.get(et) || { count: 0, headcount: 0 };
      curr.count++;
      curr.headcount += r.noManpowerNeeded;
      empTypeStats.set(et, curr);
    });

    const employmentTypeDistribution: EmploymentTypeSegment[] = Array.from(empTypeStats.entries()).map(
      ([type, stat]) => ({
        type,
        count: stat.count,
        headcount: stat.headcount,
        percentage: totalRequests > 0 ? Math.round((stat.count / totalRequests) * 100) : 0,
        color: EMP_TYPE_COLORS[type] || "#3b82f6",
      })
    );

    // 8. Monthly Trends
    const now = new Date();
    const trendMap = new Map<string, { requestCount: number; needed: number; approved: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      trendMap.set(key, { requestCount: 0, needed: 0, approved: 0 });
    }

    allRecords.forEach((r) => {
      try {
        const d = new Date(r.createdAt);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          if (trendMap.has(key)) {
            const curr = trendMap.get(key)!;
            curr.requestCount++;
            curr.needed += r.noManpowerNeeded;
            if (r.status === "Approved") curr.approved++;
          }
        }
      } catch {
        // ignore
      }
    });

    const trends: ManpowerTrendPoint[] = Array.from(trendMap.entries()).map(([key, stat]) => {
      const [yearStr, monthStr] = key.split("-");
      const d = new Date(Number(yearStr), Number(monthStr) - 1, 1);
      const displayDate = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      return {
        date: key,
        displayDate,
        requestCount: stat.requestCount,
        headcountNeeded: stat.needed,
        approvedCount: stat.approved,
      };
    });

    // Unique filter options
    const uniqueDepartments = Array.from(new Set(allRecords.map((r) => r.department).filter(Boolean))).sort();
    const uniqueDivisions = Array.from(new Set(allRecords.map((r) => r.division).filter(Boolean))).sort();
    const uniquePurposes = ["New Position", "Additional", "Replacement"];
    const uniqueEmpTypes = Array.from(new Set(allRecords.map((r) => r.employmentType).filter(Boolean))).sort();
    const uniqueStatuses = ["Approved", "Draft", "Rejected"];

    // Sort records descending by createdAt
    allRecords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const kpis: IntercompanyManpowerKpis = {
      totalRequests,
      totalHeadcountNeeded,
      totalHeadcountHired,
      approvedCount,
      draftCount,
      rejectedCount,
      overallApprovalRate,
      overallFulfillmentRate,
      totalBudgetCost,
      activeCompaniesCount,
      totalCompaniesCount,
      companiesWithRequestsCount,
      topRequestingDepartment,
      topRequestingCompany,
      predominantPurpose,
    };

    const responseData: IntercompanyManpowerData = {
      records: allRecords,
      kpis,
      companySummaries,
      departmentSummaries,
      purposeDistribution,
      employmentTypeDistribution,
      trends,
      companies: companyOptions,
      departments: uniqueDepartments,
      divisions: uniqueDivisions,
      purposes: uniquePurposes,
      employmentTypes: uniqueEmpTypes,
      statuses: uniqueStatuses,
      lastUpdated: new Date().toISOString(),
    };

    memoryCache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    return NextResponse.json(responseData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

