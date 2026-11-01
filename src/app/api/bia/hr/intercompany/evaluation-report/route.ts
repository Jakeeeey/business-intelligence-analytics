import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  IntercompanyEvaluationData,
  IntercompanyEvaluationKpis,
  CompanyEvaluationSummary,
  DepartmentEvaluationSummary,
  RatingBandDistributionSegment,
  EvalTypeDistributionSegment,
  EvaluationTrendPoint,
  KpiCategoryPerformance,
  IntercompanyEvaluationRecord,
  EvaluationItemSnapshot,
  EvaluationTrackingInfo,
  CompanyFilterOption,
  RatingBand,
  EvaluationResult,
} from "@/modules/business-intelligence-analytics/hr/intercompany/evaluation-report/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "vos_access_token";

type AnyRec = Record<string, unknown>;

interface CachedReport {
  data: IntercompanyEvaluationData;
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

function normalizeRatingBand(band?: string | null, score = 0): RatingBand {
  if (band && band.trim()) return band.trim() as RatingBand;
  if (score >= 90) return "Outstanding";
  if (score >= 80) return "Exceeds Expectations";
  if (score >= 70) return "Meets Expectations";
  if (score >= 60) return "Needs Improvement";
  return "Unsatisfactory";
}

function normalizeResult(rawResult?: string | null, score = 0): EvaluationResult {
  const r = (rawResult || "").trim().toUpperCase();
  if (r === "PASSED" || r === "PASS") return "PASSED";
  if (r === "FAILED" || r === "FAIL") return "FAILED";
  if (r === "REGULARIZED" || r === "REGULAR") return "REGULARIZED";
  if (r === "EXTENDED") return "EXTENDED";
  if (r === "VOIDED" || r === "VOID") return "VOIDED";
  return score >= 75 ? "PASSED" : "FAILED";
}

function normalizeEvalType(rawType?: string | null): string {
  const t = (rawType || "").trim().toUpperCase();
  if (!t) return "Standard";
  if (t === "30D" || t === "30_DAYS" || t === "1ST_MONTH") return "30-Day Probationary";
  if (t === "60D" || t === "60_DAYS" || t === "2ND_MONTH") return "60-Day Probationary";
  if (t === "90D" || t === "90_DAYS" || t === "3RD_MONTH") return "90-Day Probationary";
  if (t === "150D" || t === "150_DAYS" || t === "5TH_MONTH") return "150-Day Regularization";
  if (t === "ANNUAL" || t === "YEARLY") return "Annual Review";
  if (t === "SEMI_ANNUAL") return "Semi-Annual";
  return t;
}

function calculateTenure(hireDateStr?: string | null): string | null {
  if (!hireDateStr) return null;
  try {
    const hireDate = new Date(hireDateStr);
    if (isNaN(hireDate.getTime())) return null;
    const now = new Date();
    const diffMs = now.getTime() - hireDate.getTime();
    if (diffMs <= 0) return "< 1 month";

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const totalMonths = Math.floor(diffDays / 30.4375);
    const years = Math.floor(totalMonths / 12);
    const remainingMonths = totalMonths % 12;

    if (years === 0) return `${totalMonths} mo${totalMonths === 1 ? "" : "s"}`;
    return `${years} yr${years === 1 ? "" : "s"}${
      remainingMonths > 0 ? ` ${remainingMonths} mo${remainingMonths === 1 ? "" : "s"}` : ""
    }`;
  } catch {
    return null;
  }
}

const RATING_COLORS: Record<string, string> = {
  Outstanding: "#10b981", // Emerald
  "Exceeds Expectations": "#3b82f6", // Blue
  "Meets Expectations": "#06b6d4", // Cyan
  "Needs Improvement": "#f59e0b", // Amber
  Unsatisfactory: "#ef4444", // Red
};

const TYPE_COLORS = [
  "#8b5cf6", // Purple
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#ec4899", // Pink
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

    const cacheKey = "intercompany_evaluation_report";
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

    // 2. Concurrently query each company's evaluation collections, users, and departments
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

        const [evalsRes, itemsRes, trackingRes, usersRes, deptsRes] = await Promise.all([
          // employee_evaluation
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/employee_evaluation?limit=-1&fields=id,user_id,eval_type,evaluation_date,total_score,rating_band,result,evaluator_comments,evaluated_by,voided_at,voided_by,void_reason,is_active,created_at`,
            compHeaders,
            6000
          ),
          // employee_evaluation_item
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/employee_evaluation_item?limit=-1&fields=id,evaluation_id,criterion_id,kpi_category_snapshot,kpi_description_snapshot,target_snapshot,measurement_method_snapshot,weight_percentage_snapshot,rating,sort_order`,
            compHeaders,
            6000
          ),
          // employee_evaluation_tracking
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/employee_evaluation_tracking?limit=-1&fields=id,user_id,date_hired_snapshot,recommendation_issued_at,recommendation_issued_by,recommendation_letter_file,regularized_at,regularized_by,terminated_at,terminated_by,separation_type,termination_reason,is_active`,
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

        const isOnline = evalsRes.ok || usersRes.ok;

        // User lookup
        const userMap = new Map<number, AnyRec>();
        usersRes.data.forEach((u) => {
          const uid = Number(u.user_id);
          if (!isNaN(uid)) userMap.set(uid, u);
        });

        // Department lookup
        const deptMap = new Map<number, string>();
        deptsRes.data.forEach((d) => {
          const did = Number(d.id ?? d.department_id);
          const dname = String(d.department_name || "").trim();
          if (!isNaN(did) && dname) deptMap.set(did, dname);
        });

        // Tracking lookup by user_id
        const trackingMap = new Map<number, AnyRec>();
        trackingRes.data.forEach((tr) => {
          const uid = Number(tr.user_id);
          if (!isNaN(uid)) trackingMap.set(uid, tr);
        });

        // Items lookup by evaluation_id
        const itemsMap = new Map<number, EvaluationItemSnapshot[]>();
        itemsRes.data.forEach((item) => {
          const evalId = Number(item.evaluation_id);
          if (isNaN(evalId)) return;
          const weight = Number(item.weight_percentage_snapshot || 0);
          const rating = Number(item.rating || 0);
          const weightedScore = Number(((rating * weight) / 100).toFixed(2));

          const snapshot: EvaluationItemSnapshot = {
            id: Number(item.id),
            criterionId: item.criterion_id ? Number(item.criterion_id) : null,
            kpiCategory: String(item.kpi_category_snapshot || "General Criteria").trim(),
            kpiDescription: String(item.kpi_description_snapshot || "").trim(),
            target: (item.target_snapshot as string) || null,
            measurementMethod: (item.measurement_method_snapshot as string) || null,
            weightPercentage: weight,
            rating,
            weightedScore,
            sortOrder: Number(item.sort_order || 0),
          };

          const list = itemsMap.get(evalId) || [];
          list.push(snapshot);
          itemsMap.set(evalId, list);
        });

        // Process records
        const companyRecords: IntercompanyEvaluationRecord[] = [];

        evalsRes.data.forEach((ev) => {
          const evalId = Number(ev.id);
          const userId = Number(ev.user_id);
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

          const totalScore = Number(Number(ev.total_score || 0).toFixed(2));
          const ratingBand = normalizeRatingBand(ev.rating_band as string, totalScore);
          const result = normalizeResult(ev.result as string, totalScore);
          const evalType = normalizeEvalType(ev.eval_type as string);

          const evalDateStr = (ev.evaluation_date as string) || (ev.created_at as string) || new Date().toISOString();

          // Evaluator name lookup
          let evaluatorName: string | null = null;
          const evaluatorId = Number(ev.evaluated_by);
          if (!isNaN(evaluatorId) && evaluatorId > 0) {
            const evaluator = userMap.get(evaluatorId);
            if (evaluator) {
              evaluatorName = `${evaluator.user_fname || ""} ${evaluator.user_lname || ""}`.trim();
            }
          }

          // Tracking info
          let trackingInfo: EvaluationTrackingInfo | null = null;
          const tr = trackingMap.get(userId);
          if (tr) {
            let careerStatus: EvaluationTrackingInfo["careerStatus"] = "IN_PROBATION";
            if (tr.regularized_at) careerStatus = "REGULARIZED";
            else if (tr.terminated_at) careerStatus = "SEPARATED";

            trackingInfo = {
              dateHiredSnapshot: (tr.date_hired_snapshot as string) || null,
              recommendationIssuedAt: (tr.recommendation_issued_at as string) || null,
              recommendationIssuedAtFormatted: formatDate(tr.recommendation_issued_at as string),
              recommendationIssuedBy: tr.recommendation_issued_by ? Number(tr.recommendation_issued_by) : null,
              recommendationLetterFile: (tr.recommendation_letter_file as string) || null,
              regularizedAt: (tr.regularized_at as string) || null,
              regularizedAtFormatted: formatDate(tr.regularized_at as string),
              regularizedBy: tr.regularized_by ? Number(tr.regularized_by) : null,
              terminatedAt: (tr.terminated_at as string) || null,
              terminatedAtFormatted: formatDate(tr.terminated_at as string),
              separationType: (tr.separation_type as string) || null,
              terminationReason: (tr.termination_reason as string) || null,
              careerStatus,
            };
          }

          const items = (itemsMap.get(evalId) || []).sort((a, b) => a.sortOrder - b.sortOrder);
          const isActive = ev.is_active !== undefined ? Boolean(Number(ev.is_active)) : true;

          companyRecords.push({
            id: `${companyId}-eval-${evalId}`,
            evaluationId: evalId,
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
            evalType,
            evaluationDate: evalDateStr,
            evaluationDateFormatted: formatDate(evalDateStr),
            totalScore,
            ratingBand,
            result,
            evaluatorComments: (ev.evaluator_comments as string) || null,
            evaluatedBy: isNaN(evaluatorId) ? null : evaluatorId,
            evaluatorName,
            voidedAt: (ev.voided_at as string) || null,
            voidedAtFormatted: formatDate(ev.voided_at as string),
            voidedBy: ev.voided_by ? Number(ev.voided_by) : null,
            voidReason: (ev.void_reason as string) || null,
            isActive,
            dateOfHire: hireDate,
            tenureFormatted: calculateTenure(hireDate),
            items,
            tracking: trackingInfo,
            createdAt: (ev.created_at as string) || evalDateStr,
          });
        });

        // Summary calculations
        const total = companyRecords.length;
        const passed = companyRecords.filter((r) => r.result === "PASSED").length;
        const failed = companyRecords.filter((r) => r.result === "FAILED").length;
        const regularized = companyRecords.filter((r) => r.result === "REGULARIZED").length;
        const totalScoreSum = companyRecords.reduce((acc, r) => acc + r.totalScore, 0);
        const avgScore = total > 0 ? Number((totalScoreSum / total).toFixed(1)) : 0;
        const passRate = total > 0 ? Math.round(((passed + regularized) / total) * 100) : 100;

        const summary: CompanyEvaluationSummary = {
          companyId,
          companyName,
          companyCode,
          status: isOnline ? "ACTIVE" : "OFFLINE",
          totalEvaluations: total,
          passedCount: passed,
          failedCount: failed,
          regularizedCount: regularized,
          avgScore,
          passRate,
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
    const allRecords: IntercompanyEvaluationRecord[] = [];
    const companySummaries: CompanyEvaluationSummary[] = [];
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
          totalEvaluations: 0,
          passedCount: 0,
          failedCount: 0,
          regularizedCount: 0,
          avgScore: 0,
          passRate: 100,
          sharePercentage: 0,
        });
        companyOptions.push({
          companyId: cId,
          companyName: String(fallbackCompany.company_name || `Company #${cId}`).trim(),
          companyCode: String(fallbackCompany.company_code || `CMP-${cId}`).trim(),
        });
      }
    });

    const totalEvaluations = allRecords.length;

    companySummaries.forEach((cs) => {
      cs.sharePercentage =
        totalEvaluations > 0 ? Number(((cs.totalEvaluations / totalEvaluations) * 100).toFixed(1)) : 0;
    });

    // 4. Overarching KPIs
    const passedCount = allRecords.filter((r) => r.result === "PASSED").length;
    const failedCount = allRecords.filter((r) => r.result === "FAILED").length;
    const regularizedCount = allRecords.filter((r) => r.result === "REGULARIZED").length;
    const overallPassRate =
      totalEvaluations > 0 ? Math.round(((passedCount + regularizedCount) / totalEvaluations) * 100) : 100;
    const regularizationRate =
      totalEvaluations > 0 ? Math.round((regularizedCount / totalEvaluations) * 100) : 0;

    const totalScoreSum = allRecords.reduce((sum, r) => sum + r.totalScore, 0);
    const avgTotalScore = totalEvaluations > 0 ? Number((totalScoreSum / totalEvaluations).toFixed(1)) : 85;

    const companiesWithEvaluationsCount = companySummaries.filter((c) => c.totalEvaluations > 0).length;

    const sortedByAvgScore = [...companySummaries]
      .filter((c) => c.totalEvaluations > 0)
      .sort((a, b) => b.avgScore - a.avgScore);
    const topPerformingCompany = sortedByAvgScore.length > 0 ? sortedByAvgScore[0].companyName : "None";

    // 5. Department Breakdown
    const deptMap = new Map<string, { total: number; sumScore: number; passed: number }>();
    allRecords.forEach((r) => {
      const d = r.department || "Unassigned";
      const curr = deptMap.get(d) || { total: 0, sumScore: 0, passed: 0 };
      curr.total++;
      curr.sumScore += r.totalScore;
      if (r.result === "PASSED" || r.result === "REGULARIZED") curr.passed++;
      deptMap.set(d, curr);
    });

    const departmentSummaries: DepartmentEvaluationSummary[] = Array.from(deptMap.entries())
      .map(([department, stat]) => ({
        department,
        totalEvaluations: stat.total,
        avgScore: stat.total > 0 ? Number((stat.sumScore / stat.total).toFixed(1)) : 0,
        passRate: stat.total > 0 ? Math.round((stat.passed / stat.total) * 100) : 100,
        passedCount: stat.passed,
      }))
      .sort((a, b) => b.totalEvaluations - a.totalEvaluations);

    const topPerformingDepartment =
      departmentSummaries.length > 0
        ? [...departmentSummaries].sort((a, b) => b.avgScore - a.avgScore)[0].department
        : "None";

    // 6. Rating Band Distribution
    const ratingOrder = [
      "Outstanding",
      "Exceeds Expectations",
      "Meets Expectations",
      "Needs Improvement",
      "Unsatisfactory",
    ];
    const ratingCounts = new Map<string, number>();
    ratingOrder.forEach((band) => ratingCounts.set(band, 0));
    allRecords.forEach((r) => {
      const band = r.ratingBand;
      ratingCounts.set(band, (ratingCounts.get(band) || 0) + 1);
    });

    const ratingDistribution: RatingBandDistributionSegment[] = ratingOrder.map((band) => {
      const count = ratingCounts.get(band) || 0;
      return {
        band,
        count,
        percentage: totalEvaluations > 0 ? Math.round((count / totalEvaluations) * 100) : 0,
        color: RATING_COLORS[band] || "#64748b",
      };
    });

    let predominantRatingBand = "Meets Expectations";
    let maxBandCount = -1;
    ratingDistribution.forEach((seg) => {
      if (seg.count > maxBandCount) {
        maxBandCount = seg.count;
        predominantRatingBand = seg.band;
      }
    });

    // 7. Eval Type Distribution
    const typeCounts = new Map<string, number>();
    allRecords.forEach((r) => {
      typeCounts.set(r.evalType, (typeCounts.get(r.evalType) || 0) + 1);
    });

    const typeDistribution: EvalTypeDistributionSegment[] = Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, count], index) => ({
        type,
        count,
        percentage: totalEvaluations > 0 ? Math.round((count / totalEvaluations) * 100) : 0,
        color: TYPE_COLORS[index % TYPE_COLORS.length],
      }));

    // 8. KPI Category Performance
    const categoryStats = new Map<string, { sumRating: number; sumWeight: number; count: number }>();
    allRecords.forEach((r) => {
      r.items.forEach((item) => {
        const cat = item.kpiCategory || "Core Competency";
        const curr = categoryStats.get(cat) || { sumRating: 0, sumWeight: 0, count: 0 };
        curr.sumRating += item.rating;
        curr.sumWeight += item.weightPercentage;
        curr.count++;
        categoryStats.set(cat, curr);
      });
    });

    const categoryPerformance: KpiCategoryPerformance[] = Array.from(categoryStats.entries())
      .map(([category, stat]) => ({
        category,
        avgRating: stat.count > 0 ? Number((stat.sumRating / stat.count).toFixed(1)) : 0,
        avgWeight: stat.count > 0 ? Number((stat.sumWeight / stat.count).toFixed(1)) : 0,
        evalCount: stat.count,
      }))
      .sort((a, b) => b.avgRating - a.avgRating);

    // 9. Monthly Evaluation Trends
    const now = new Date();
    const trendMap = new Map<string, { total: number; sumScore: number; pass: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      trendMap.set(key, { total: 0, sumScore: 0, pass: 0 });
    }

    allRecords.forEach((r) => {
      try {
        const d = new Date(r.evaluationDate);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          if (trendMap.has(key)) {
            const curr = trendMap.get(key)!;
            curr.total++;
            curr.sumScore += r.totalScore;
            if (r.result === "PASSED" || r.result === "REGULARIZED") curr.pass++;
          }
        }
      } catch {
        // ignore
      }
    });

    const trends: EvaluationTrendPoint[] = Array.from(trendMap.entries()).map(([key, stat]) => {
      const [yearStr, monthStr] = key.split("-");
      const d = new Date(Number(yearStr), Number(monthStr) - 1, 1);
      const displayDate = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      return {
        date: key,
        displayDate,
        totalCount: stat.total,
        avgScore: stat.total > 0 ? Number((stat.sumScore / stat.total).toFixed(1)) : 0,
        passCount: stat.pass,
      };
    });

    // Unique filter options
    const uniqueDepartments = Array.from(new Set(allRecords.map((r) => r.department).filter(Boolean))).sort();
    const uniqueEvalTypes = Array.from(new Set(allRecords.map((r) => r.evalType).filter(Boolean))).sort();
    const uniqueRatingBands = ratingOrder;
    const uniqueResults = ["PASSED", "REGULARIZED", "FAILED", "EXTENDED", "VOIDED"];

    // Sort records descending by evaluation date
    allRecords.sort((a, b) => new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime());

    const kpis: IntercompanyEvaluationKpis = {
      totalEvaluations,
      passedCount,
      failedCount,
      regularizedCount,
      avgTotalScore,
      overallPassRate,
      regularizationRate,
      activeCompaniesCount,
      totalCompaniesCount,
      companiesWithEvaluationsCount,
      topPerformingCompany,
      topPerformingDepartment,
      predominantRatingBand,
    };

    const responseData: IntercompanyEvaluationData = {
      records: allRecords,
      kpis,
      companySummaries,
      departmentSummaries,
      ratingDistribution,
      typeDistribution,
      categoryPerformance,
      trends,
      companies: companyOptions,
      departments: uniqueDepartments,
      evalTypes: uniqueEvalTypes,
      ratingBands: uniqueRatingBands,
      results: uniqueResults,
      lastUpdated: new Date().toISOString(),
    };

    memoryCache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    return NextResponse.json(responseData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

