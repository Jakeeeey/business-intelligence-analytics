import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  IntercompanyVacanciesData,
  IntercompanyVacanciesKpis,
  IntercompanyVacancyRecord,
  CompanyVacanciesSummary,
  DepartmentVacanciesSummary,
  UrgencyDistributionSegment,
  PurposeDistributionSegment,
  VacancyCandidateSummary,
  VacancyCompanyOption,
  VacancyUrgency,
} from "@/modules/business-intelligence-analytics/hr/intercompany/vacancies-report/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "vos_access_token";

type AnyRec = Record<string, unknown>;

interface CachedReport {
  data: IntercompanyVacanciesData;
  timestamp: number;
}

const memoryCache = new Map<string, CachedReport>();
const CACHE_TTL_MS = 30000; // 30s cache

async function fetchDirectusWithTimeout<T>(
  url: string,
  headers: Record<string, string>,
  timeoutMs = 3000
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

const URGENCY_COLORS: Record<VacancyUrgency, string> = {
  Critical: "#ef4444", // Rose/Red
  Moderate: "#f59e0b", // Amber
  Normal: "#10b981", // Emerald
};

const PURPOSE_COLORS: Record<string, string> = {
  "New Position": "#3b82f6", // Blue
  Additional: "#10b981", // Emerald
  Replacement: "#f59e0b", // Amber
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
    const companyParam = searchParams.get("company") || "ALL";
    const dateRangeParam = searchParams.get("dateRange") || "all";
    const customStartDate = searchParams.get("startDate");
    const customEndDate = searchParams.get("endDate");

    // Compute date range
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    let startDate: string | null = customStartDate || null;
    let endDate: string | null = customEndDate || null;

    if (!startDate && dateRangeParam !== "all" && dateRangeParam !== "custom") {
      endDate = customEndDate || todayStr;
      if (dateRangeParam === "today") {
        startDate = todayStr;
      } else if (dateRangeParam === "week") {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        startDate = d.toISOString().slice(0, 10);
      } else if (dateRangeParam === "month") {
        startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      } else if (dateRangeParam === "quarter") {
        const qMonth = Math.floor(now.getMonth() / 3) * 3 + 1;
        startDate = `${now.getFullYear()}-${String(qMonth).padStart(2, "0")}-01`;
      } else if (dateRangeParam === "year") {
        startDate = `${now.getFullYear()}-01-01`;
      }
    } else if (dateRangeParam === "custom") {
      if (startDate && !endDate) {
        endDate = todayStr;
      }
    }

    const cacheKey = `vacancies_v1_${companyParam}_${dateRangeParam}_${startDate || "none"}_${endDate || "none"}`;
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
      4000
    );

    const allValidCompanies = companiesRes.data.filter((c) => {
      if (!c.directus || typeof c.directus !== "string" || !c.directus.trim()) return false;
      if (String(c.status || "ACTIVE").toUpperCase() === "INACTIVE") return false;
      return true;
    });

    const targetCompanies =
      companyParam !== "ALL"
        ? allValidCompanies.filter(
            (c) =>
              String(c.company_code || "").toUpperCase() === companyParam.toUpperCase() ||
              String(c.company_id) === companyParam
          )
        : allValidCompanies;

    const companiesToProcess = targetCompanies.length > 0 ? targetCompanies : allValidCompanies;

    const userFields =
      "user_id,user_fname,user_lname,user_mname,suffix_name,user_department,user_position";

    const endOfDay = endDate ? (endDate.includes("T") ? endDate : `${endDate}T23:59:59`) : null;

    // 2. Query each company's manpower and recruitment collections
    const companyFetchResults = await Promise.allSettled(
      companiesToProcess.map(async (company) => {
        const companyId = Number(company.company_id);
        const companyName = String(company.company_name || `Company #${companyId}`).trim();
        const companyCode = String(company.company_code || `CMP-${companyId}`).trim();
        const companyUrl = String(company.directus).replace(/\/+$/, "");
        const companyToken = (company.directus_token as string) || staticToken || token;

        const compHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (companyToken) compHeaders["Authorization"] = `Bearer ${companyToken}`;

        // Fast probe check on user endpoint
        const probeRes = await fetchDirectusWithTimeout<AnyRec>(
          `${companyUrl}/items/user?limit=1&fields=user_id`,
          compHeaders,
          2500
        );

        if (!probeRes.ok) {
          return {
            companyId,
            companyName,
            companyCode,
            companyDirectusUrl: companyUrl,
            isOnline: false,
            requests: [],
            recommendations: [],
            applicants: [],
            departments: [],
            divisions: [],
            users: [],
          };
        }

        let mrUrl = `${companyUrl}/items/manpower_request?limit=-1&fields=id,request_no,requesting_department_id,position,division_id,no_manpower_needed,purpose,replacement_name,employment_type,employment_others,reason_justification,qualification,qualification_description,applicant_name,rate,requested_by,approved_by,status,approved_at,created_at,updated_at`;
        if (startDate) mrUrl += `&filter[created_at][_gte]=${startDate}`;
        if (endOfDay) mrUrl += `&filter[created_at][_lte]=${endOfDay}`;

        const [reqsRes, recsRes, appsRes, deptsRes, divsRes, usersRes] = await Promise.all([
          fetchDirectusWithTimeout<AnyRec>(mrUrl, compHeaders, 3000),
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/manpower_recommendation?limit=-1&fields=id,manpower_request_id,applicant_id,status,recommendation_notes,recommended_by,recommended_at`,
            compHeaders,
            3000
          ),
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/applicant?limit=-1&fields=id,full_name,position_applied_for,status`,
            compHeaders,
            3000
          ),
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/department?limit=-1&fields=id,department_id,department_name`,
            compHeaders,
            3000
          ),
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/division?limit=-1&fields=id,division_id,division_name,division_code`,
            compHeaders,
            3000
          ),
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/user?limit=-1&fields=${userFields}`,
            compHeaders,
            3000
          ),
        ]);

        return {
          companyId,
          companyName,
          companyCode,
          companyDirectusUrl: companyUrl,
          isOnline: true,
          requests: reqsRes.data,
          recommendations: recsRes.data,
          applicants: appsRes.data,
          departments: deptsRes.data,
          divisions: divsRes.data,
          users: usersRes.data,
        };
      })
    );

    // 3. Synthesize Vacancy Records
    const allVacancies: IntercompanyVacancyRecord[] = [];
    const companySummaries: CompanyVacanciesSummary[] = [];
    const deptCountMap = new Map<string, { open: number; positions: Set<string> }>();
    const urgencyMap: Record<VacancyUrgency, number> = {
      Critical: 0,
      Moderate: 0,
      Normal: 0,
    };
    const purposeCountMap = new Map<string, number>();

    const distinctDepts = new Set<string>();
    const distinctDivs = new Set<string>();
    const distinctPurposes = new Set<string>();
    const distinctEmpTypes = new Set<string>();
    const distinctStatuses = new Set<string>();

    let grandOpenVacancies = 0;
    let grandRequisitions = 0;
    let grandReplacementRoles = 0;
    let grandNewPositionRoles = 0;
    let grandTotalAgingDays = 0;
    let grandTotalAllocatedBudget = 0;

    for (const res of companyFetchResults) {
      if (res.status !== "fulfilled") continue;
      const {
        companyId,
        companyName,
        companyCode,
        companyDirectusUrl,
        isOnline,
        requests,
        recommendations,
        applicants,
        departments,
        divisions,
        users,
      } = res.value;

      if (!isOnline) {
        companySummaries.push({
          companyId,
          companyName,
          companyCode,
          status: "OFFLINE",
          openVacancies: 0,
          totalNeeded: 0,
          hiredCount: 0,
          activeRequisitions: 0,
          sharePercentage: 0,
        });
        continue;
      }

      // Lookups
      const userMap = new Map<number, string>();
      users.forEach((u) => {
        const uid = Number(u.user_id);
        if (!isNaN(uid)) {
          const fname = String(u.user_fname || "").trim();
          const lname = String(u.user_lname || "").trim();
          const suffix = u.suffix_name ? ` ${u.suffix_name}` : "";
          userMap.set(uid, `${fname} ${lname}${suffix}`.trim() || `User #${uid}`);
        }
      });

      const deptMap = new Map<number, string>();
      departments.forEach((d) => {
        const did = Number(d.id ?? d.department_id);
        const name = String(d.department_name || "").trim();
        if (!isNaN(did) && name) deptMap.set(did, name);
      });

      const divMap = new Map<number, string>();
      divisions.forEach((dv) => {
        const dvid = Number(dv.id ?? dv.division_id);
        const name = String(dv.division_name || "").trim();
        if (!isNaN(dvid) && name) divMap.set(dvid, name);
      });

      const appMap = new Map<number, AnyRec>();
      applicants.forEach((ap) => {
        const apid = Number(ap.id);
        if (!isNaN(apid)) appMap.set(apid, ap);
      });

      // Group candidate recommendations
      const recsGroup = new Map<number, VacancyCandidateSummary[]>();
      recommendations.forEach((rc) => {
        const reqId = Number(rc.manpower_request_id);
        if (isNaN(reqId)) return;
        const apId = Number(rc.applicant_id);
        const applicant = appMap.get(apId);
        const recUser = rc.recommended_by ? userMap.get(Number(rc.recommended_by)) : null;

        const candidate: VacancyCandidateSummary = {
          id: Number(rc.id),
          applicantId: apId,
          applicantName: String(applicant?.full_name || `Applicant #${apId}`).trim(),
          positionAppliedFor: (applicant?.position_applied_for as string) || null,
          applicantStatus: (applicant?.status as string) || null,
          status: String(rc.status || "Recommended").trim(),
          recommendationNotes: (rc.recommendation_notes as string) || null,
          recommendedByName: recUser || null,
          recommendedAtFormatted: formatDate(rc.recommended_at as string),
        };

        if (!recsGroup.has(reqId)) recsGroup.set(reqId, []);
        recsGroup.get(reqId)!.push(candidate);
      });

      let compOpenVacancies = 0;
      let compTotalNeeded = 0;
      let compHired = 0;
      let compActiveReqs = 0;

      requests.forEach((req) => {
        const reqId = Number(req.id);
        if (isNaN(reqId)) return;

        const statusStr = String(req.status || "Draft").trim();
        // Skip explicitly rejected requisitions
        if (statusStr.toLowerCase() === "rejected") return;

        const positionTitle = String(req.position || "").trim() || "Staff Position";
        const needed = Math.max(1, Number(req.no_manpower_needed || 1));
        const candidateList = recsGroup.get(reqId) || [];
        const hired = candidateList.filter((c) => c.status.toLowerCase() === "hired").length;
        const open = Math.max(0, needed - hired);

        const deptId = req.requesting_department_id ? Number(req.requesting_department_id) : null;
        const departmentName = (deptId ? deptMap.get(deptId) : null) || "General Operations";

        const divId = req.division_id ? Number(req.division_id) : null;
        const divisionName = (divId ? divMap.get(divId) : null) || "Main Division";

        const purpose = String(req.purpose || "New Position").trim();
        const empType = String(req.employment_type || "Regular").trim();
        const rateVal = req.rate ? Number(req.rate) : 0;
        const totalBudget = rateVal * needed;

        // Aging calculation
        const dateRef = req.approved_at || req.created_at;
        let agingDays = 0;
        if (dateRef) {
          const d = new Date(String(dateRef));
          if (!isNaN(d.getTime())) {
            agingDays = Math.max(0, Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
          }
        }

        // Urgency classification
        let urgency: VacancyUrgency = "Normal";
        if (purpose.toLowerCase() === "replacement" || agingDays >= 60) {
          urgency = "Critical";
        } else if (agingDays >= 30) {
          urgency = "Moderate";
        }

        distinctDepts.add(departmentName);
        distinctDivs.add(divisionName);
        distinctPurposes.add(purpose);
        distinctEmpTypes.add(empType);
        distinctStatuses.add(statusStr);

        compTotalNeeded += needed;
        compHired += hired;
        compOpenVacancies += open;
        compActiveReqs++;

        grandOpenVacancies += open;
        grandRequisitions++;
        grandTotalAgingDays += agingDays;
        grandTotalAllocatedBudget += totalBudget;

        if (purpose.toLowerCase() === "replacement") grandReplacementRoles += open;
        if (purpose.toLowerCase() === "new position") grandNewPositionRoles += open;

        urgencyMap[urgency] += open > 0 ? open : 1;
        purposeCountMap.set(purpose, (purposeCountMap.get(purpose) || 0) + open);

        // Department breakdown
        if (!deptCountMap.has(departmentName)) {
          deptCountMap.set(departmentName, { open: 0, positions: new Set() });
        }
        const deptEntry = deptCountMap.get(departmentName)!;
        deptEntry.open += open;
        deptEntry.positions.add(positionTitle);

        allVacancies.push({
          id: `${companyId}-${reqId}`,
          requestId: reqId,
          requestNo: String(req.request_no || `REQ-${reqId}`).trim(),
          companyId,
          companyName,
          companyCode,
          companyDirectusUrl,
          position: positionTitle,
          departmentId: deptId,
          department: departmentName,
          divisionId: divId,
          division: divisionName,
          totalNeeded: needed,
          hiredCount: hired,
          openVacancies: open,
          fulfillmentRate: needed > 0 ? Math.round((hired / needed) * 100) : 0,
          purpose,
          replacementName: req.replacement_name ? String(req.replacement_name).trim() : null,
          employmentType: empType,
          employmentOthers: req.employment_others ? String(req.employment_others).trim() : null,
          reasonJustification: req.reason_justification ? String(req.reason_justification).trim() : null,
          qualification: req.qualification ? String(req.qualification).trim() : null,
          qualificationDescription: req.qualification_description ? String(req.qualification_description).trim() : null,
          applicantName: req.applicant_name ? String(req.applicant_name).trim() : null,
          rate: rateVal,
          rateFormatted:
            rateVal > 0
              ? `₱${rateVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "Unspecified",
          totalAllocatedBudget: totalBudget,
          status: statusStr,
          urgency,
          agingDays,
          requestedByName: req.requested_by ? userMap.get(Number(req.requested_by)) || null : null,
          approvedByName: req.approved_by ? userMap.get(Number(req.approved_by)) || null : null,
          approvedAt: req.approved_at ? String(req.approved_at) : null,
          approvedAtFormatted: formatDate(req.approved_at as string),
          createdAt: String(req.created_at || ""),
          createdAtFormatted: formatDate(req.created_at as string),
          candidates: candidateList,
        });
      });

      companySummaries.push({
        companyId,
        companyName,
        companyCode,
        status: "ACTIVE",
        openVacancies: compOpenVacancies,
        totalNeeded: compTotalNeeded,
        hiredCount: compHired,
        activeRequisitions: compActiveReqs,
        sharePercentage: 0,
      });
    }

    // Compute share percentages for companies
    companySummaries.forEach((c) => {
      c.sharePercentage =
        grandOpenVacancies > 0
          ? Math.round((c.openVacancies / grandOpenVacancies) * 100)
          : 0;
    });

    // Department summaries
    const departmentSummaries: DepartmentVacanciesSummary[] = Array.from(deptCountMap.entries())
      .map(([department, data]) => ({
        department,
        openVacancies: data.open,
        positionsCount: data.positions.size,
        percentage:
          grandOpenVacancies > 0 ? Math.round((data.open / grandOpenVacancies) * 100) : 0,
      }))
      .sort((a, b) => b.openVacancies - a.openVacancies);

    // Urgency distribution
    const totalUrgencyUnits =
      urgencyMap.Critical + urgencyMap.Moderate + urgencyMap.Normal || 1;
    const urgencyDistribution: UrgencyDistributionSegment[] = [
      {
        urgency: "Critical",
        count: urgencyMap.Critical,
        percentage: Math.round((urgencyMap.Critical / totalUrgencyUnits) * 100),
        color: URGENCY_COLORS.Critical,
      },
      {
        urgency: "Moderate",
        count: urgencyMap.Moderate,
        percentage: Math.round((urgencyMap.Moderate / totalUrgencyUnits) * 100),
        color: URGENCY_COLORS.Moderate,
      },
      {
        urgency: "Normal",
        count: urgencyMap.Normal,
        percentage: Math.round((urgencyMap.Normal / totalUrgencyUnits) * 100),
        color: URGENCY_COLORS.Normal,
      },
    ];

    // Purpose distribution
    const purposeDistribution: PurposeDistributionSegment[] = Array.from(
      purposeCountMap.entries()
    ).map(([purpose, count]) => ({
      purpose,
      count,
      percentage:
        grandOpenVacancies > 0 ? Math.round((count / grandOpenVacancies) * 100) : 0,
      color: PURPOSE_COLORS[purpose] || "#64748b",
    }));

    const kpis: IntercompanyVacanciesKpis = {
      totalOpenVacancies: grandOpenVacancies,
      totalRequisitions: grandRequisitions,
      replacementRoles: grandReplacementRoles,
      newPositionRoles: grandNewPositionRoles,
      avgAgingDays:
        grandRequisitions > 0 ? Math.round(grandTotalAgingDays / grandRequisitions) : 0,
      totalAllocatedBudget: grandTotalAllocatedBudget,
      criticalRolesCount: urgencyMap.Critical,
    };

    const companiesList: VacancyCompanyOption[] = allValidCompanies.map((c) => ({
      companyId: Number(c.company_id),
      companyName: String(c.company_name || `Company #${c.company_id}`).trim(),
      companyCode: String(c.company_code || "").trim(),
    }));

    const responsePayload: IntercompanyVacanciesData = {
      kpis,
      vacancies: allVacancies.sort((a, b) => b.openVacancies - a.openVacancies || b.agingDays - a.agingDays),
      companySummaries,
      departmentSummaries,
      urgencyDistribution,
      purposeDistribution,
      companies: companiesList,
      departments: Array.from(distinctDepts).sort(),
      divisions: Array.from(distinctDivs).sort(),
      purposes: Array.from(distinctPurposes).sort(),
      employmentTypes: Array.from(distinctEmpTypes).sort(),
      statuses: Array.from(distinctStatuses).sort(),
      lastUpdated: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };

    memoryCache.set(cacheKey, { data: responsePayload, timestamp: Date.now() });

    return NextResponse.json(responsePayload);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

