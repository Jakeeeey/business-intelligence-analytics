import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "vos_access_token";

type AnyRec = Record<string, unknown>;

export interface CompanyPayrollStatusItem {
  companyId: number;
  companyName: string;
  companyCode: string;
  cutoffId: number | null;
  cutoffTitle: string;
  cutoffType: string | null;
  startDate: string | null;
  endDate: string | null;
  payoutDate: string | null;
  totalDepartments: number;
  completedDepartments: number;
  percentage: number;
  statusCode: "COMPLETED" | "IN_PROGRESS" | "PENDING" | "OFFLINE";
  statusLabel: string;
  totalGross: number;
  totalNet: number;
  totalHeadcount: number;
  isReachable: boolean;
  errorMessage?: string;
}

export interface HoldingsPayrollProgressData {
  groupCutoffTitle: string;
  groupStartDate: string | null;
  groupEndDate: string | null;
  groupPayoutDate: string | null;
  totalCompanies: number;
  completedCompanies: number;
  inProgressCompanies: number;
  pendingCompanies: number;
  offlineCompanies: number;
  overallPercentage: number;
  totalGroupGross: number;
  totalGroupNet: number;
  totalGroupHeadcount: number;
  companies: CompanyPayrollStatusItem[];
}

interface CachedHoldingsPayload {
  data: HoldingsPayrollProgressData;
  timestamp: number;
}

declare global {
  var __serverHoldingsCutoffProgressCache: CachedHoldingsPayload | undefined;
}

const SERVER_CACHE_TTL_MS = 180000; // 3 minutes

async function fetchDirectusWithTimeout<T>(
  url: string,
  headers: Record<string, string>,
  timeoutMs = 5000
): Promise<T[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers,
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const json = await res.json();
    return (json.data || []) as T[];
  } catch (err: unknown) {
    clearTimeout(timer);
    throw err;
  }
}

interface ResolvedCutoffWindow {
  id: number;
  cutoffType: string | null;
  cutoffTitle: string;
  startDateStr: string;
  endDateStr: string;
  payoutDateStr: string | null;
}

function parseCutoffs(rawCutoffs: AnyRec[]): ResolvedCutoffWindow[] {
  const result: ResolvedCutoffWindow[] = [];
  for (const c of rawCutoffs) {
    const id = Number(c.id);
    const startDateStr = c.start_date ? String(c.start_date).slice(0, 10) : null;
    const endDateStr = c.end_date ? String(c.end_date).slice(0, 10) : null;
    if (!id || !startDateStr || !endDateStr) continue;

    let payoutDateStr: string | null = null;
    if (c.payout_date && String(c.payout_date).slice(0, 10) >= endDateStr) {
      payoutDateStr = String(c.payout_date).slice(0, 10);
    } else {
      const endParts = endDateStr.split("-");
      const y = Number(endParts[0]);
      const m = Number(endParts[1]) - 1;
      const type = String(c.cutoff_type || "").toUpperCase();
      let pDate: Date;
      if (type === "FIRST") {
        pDate = new Date(y, m, 15);
      } else if (type === "SECOND") {
        pDate = new Date(y, m + 1, 0);
      } else {
        pDate = new Date(new Date(y, m, Number(endParts[2])).getTime() + 5 * 86400000);
      }
      const py = pDate.getFullYear();
      const pm = String(pDate.getMonth() + 1).padStart(2, "0");
      const pd = String(pDate.getDate()).padStart(2, "0");
      payoutDateStr = `${py}-${pm}-${pd}`;
    }

    const cutoffMonth = c.month ? String(c.month) : "";
    const cutoffYear = c.year ? String(c.year) : "";
    const cutoffType = c.cutoff_type ? String(c.cutoff_type) : "";
    const cutoffTitle =
      cutoffMonth || cutoffType
        ? `${cutoffMonth} ${cutoffYear} ${cutoffType}`.trim()
        : `Cutoff #${id}`;

    result.push({
      id,
      cutoffType: cutoffType || null,
      cutoffTitle,
      startDateStr,
      endDateStr,
      payoutDateStr,
    });
  }
  return result.sort((a, b) => a.endDateStr.localeCompare(b.endDateStr));
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    cookieStore.get(COOKIE_NAME)?.value;

  const isAuthDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";
  if (!token && !isAuthDisabled) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const force = request.nextUrl.searchParams.get("force") === "true";

  if (!force && globalThis.__serverHoldingsCutoffProgressCache) {
    if (Date.now() - globalThis.__serverHoldingsCutoffProgressCache.timestamp < SERVER_CACHE_TTL_MS) {
      return NextResponse.json(globalThis.__serverHoldingsCutoffProgressCache.data);
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  const staticToken = process.env.DIRECTUS_STATIC_TOKEN;

  if (!baseUrl) {
    return NextResponse.json(
      { error: "Directus API base URL not configured" },
      { status: 500 }
    );
  }

  const primaryHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (staticToken) {
    primaryHeaders["Authorization"] = `Bearer ${staticToken}`;
  } else if (token) {
    primaryHeaders["Authorization"] = `Bearer ${token}`;
  }

  try {
    // 1. Fetch company list from primary Directus
    const companiesRaw = await fetchDirectusWithTimeout<AnyRec>(
      `${baseUrl}/items/company_list?limit=-1&fields=company_id,company_name,company_code,directus,directus_token,status,is_mother_company,is_default`,
      primaryHeaders,
      6000
    );

    const validCompanies = companiesRaw.filter(
      (c) =>
        c.directus &&
        typeof c.directus === "string" &&
        c.directus.trim().length > 0 &&
        String(c.status || "ACTIVE").toUpperCase() !== "INACTIVE"
    );

    const now = new Date();
    const ny = now.getFullYear();
    const nm = String(now.getMonth() + 1).padStart(2, "0");
    const nd = String(now.getDate()).padStart(2, "0");
    const todayStr = `${ny}-${nm}-${nd}`;

    // 2. Resolve Master Group Cutoff
    // Look up cutoffs from default company (is_default = 1), fallback to primary baseUrl
    const defaultCompany =
      validCompanies.find((c) => Number(c.is_default) === 1) ||
      validCompanies.find((c) => Number(c.is_mother_company) === 1) ||
      validCompanies[0];

    const masterCutoffsUrl = defaultCompany?.directus
      ? `${String(defaultCompany.directus).replace(/\/+$/, "")}/items/cutoff_settings?limit=-1&fields=id,cutoff_type,month,year,start_date,end_date,payout_date`
      : `${baseUrl}/items/cutoff_settings?limit=-1&fields=id,cutoff_type,month,year,start_date,end_date,payout_date`;

    const masterHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const masterToken = (defaultCompany?.directus_token as string) || staticToken || token;
    if (masterToken) {
      masterHeaders["Authorization"] = `Bearer ${masterToken}`;
    }

    const masterCutoffsRaw = await fetchDirectusWithTimeout<AnyRec>(
      masterCutoffsUrl,
      masterHeaders,
      5000
    ).catch(() => [] as AnyRec[]);

    const parsedMasterWindows = parseCutoffs(masterCutoffsRaw);
    const endedMasterWindows = parsedMasterWindows.filter((w) => w.endDateStr <= todayStr);

    const groupMasterWindow: ResolvedCutoffWindow =
      endedMasterWindows.length > 0
        ? endedMasterWindows[endedMasterWindows.length - 1]
        : parsedMasterWindows[parsedMasterWindows.length - 1] || {
            id: 0,
            cutoffType: "FIRST",
            cutoffTitle: "Current Cycle",
            startDateStr: "2026-09-26",
            endDateStr: "2026-10-10",
            payoutDateStr: "2026-10-15",
          };

    // 3. Concurrently query each company's department & payroll_run evaluated against the Master Cutoff cycle
    const companyPromises = validCompanies.map(async (company): Promise<CompanyPayrollStatusItem> => {
      const companyId = Number(company.company_id);
      const companyName = String(company.company_name || `Company #${companyId}`);
      const companyCode = String(company.company_code || `CMP-${companyId}`);
      const companyBaseUrl = String(company.directus).replace(/\/+$/, "");
      const companyToken = (company.directus_token as string) || staticToken || token;

      const compHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (companyToken) {
        compHeaders["Authorization"] = `Bearer ${companyToken}`;
      }

      try {
        const [cutoffs, departments, payrollRuns] = await Promise.all([
          fetchDirectusWithTimeout<AnyRec>(
            `${companyBaseUrl}/items/cutoff_settings?limit=-1&fields=id,cutoff_type,month,year,start_date,end_date,payout_date`,
            compHeaders,
            5000
          ).catch(() => [] as AnyRec[]),
          fetchDirectusWithTimeout<AnyRec>(
            `${companyBaseUrl}/items/department?limit=-1&fields=department_id,department_name`,
            compHeaders,
            5000
          ).catch(() => [] as AnyRec[]),
          fetchDirectusWithTimeout<AnyRec>(
            `${companyBaseUrl}/items/payroll_run?limit=-1&fields=payroll_run_id,cutoff_id,cutoff_start,cutoff_end,department_id,status,headcount,total_gross,total_net,total_deductions`,
            compHeaders,
            5000
          ).catch(() => [] as AnyRec[]),
        ]);

        const activeDepartments = departments.map((d) => ({
          id: Number(d.department_id || d.id),
          name: String(d.department_name || d.name || `Dept #${d.department_id || d.id}`),
        }));

        // Find if this company has a local cutoff matching the group window dates
        const matchingLocalCutoff = cutoffs.find(
          (c) =>
            String(c.start_date || "").slice(0, 10) === groupMasterWindow.startDateStr &&
            String(c.end_date || "").slice(0, 10) === groupMasterWindow.endDateStr
        );
        const localCutoffId = matchingLocalCutoff ? Number(matchingLocalCutoff.id) : null;

        // Match runs against the group cutoff date range (or local cutoff id if available)
        const matchingRuns = payrollRuns.filter((r) => {
          const runStart = String(r.cutoff_start || "").slice(0, 10);
          const runEnd = String(r.cutoff_end || "").slice(0, 10);
          if (runStart === groupMasterWindow.startDateStr && runEnd === groupMasterWindow.endDateStr) {
            return true;
          }
          if (localCutoffId !== null && Number(r.cutoff_id) === localCutoffId) {
            return true;
          }
          return false;
        });

        const postedRuns = matchingRuns.filter(
          (r) => String(r.status || "").toUpperCase() === "POSTED"
        );

        const isConsolidatedPosted = postedRuns.some(
          (r) =>
            r.department_id == null ||
            r.department_id === "ALL" ||
            Number(r.department_id) === 0
        );

        const postedDeptIdSet = new Set<number>();
        postedRuns.forEach((r) => {
          if (r.department_id != null) {
            postedDeptIdSet.add(Number(r.department_id));
          }
        });

        const totalDepts = activeDepartments.length > 0 ? activeDepartments.length : 1;
        const completedCount = isConsolidatedPosted
          ? totalDepts
          : activeDepartments.filter((d) => postedDeptIdSet.has(d.id)).length;

        const percentage = Math.min(
          100,
          Math.round((completedCount / totalDepts) * 100)
        );

        let statusCode: "COMPLETED" | "IN_PROGRESS" | "PENDING" = "PENDING";
        let statusLabel = "Pending";

        if (percentage >= 100) {
          statusCode = "COMPLETED";
          statusLabel = "Completed";
        } else if (percentage > 0) {
          statusCode = "IN_PROGRESS";
          statusLabel = "In Progress";
        }

        const totalGross = postedRuns.reduce((sum, r) => sum + Number(r.total_gross || 0), 0);
        const totalNet = postedRuns.reduce((sum, r) => sum + Number(r.total_net || 0), 0);
        const totalHeadcount = postedRuns.reduce((sum, r) => sum + Number(r.headcount || 0), 0);

        return {
          companyId,
          companyName,
          companyCode,
          cutoffId: localCutoffId || groupMasterWindow.id,
          cutoffTitle: groupMasterWindow.cutoffTitle,
          cutoffType: groupMasterWindow.cutoffType,
          startDate: groupMasterWindow.startDateStr,
          endDate: groupMasterWindow.endDateStr,
          payoutDate: groupMasterWindow.payoutDateStr,
          totalDepartments: totalDepts,
          completedDepartments: completedCount,
          percentage,
          statusCode,
          statusLabel,
          totalGross,
          totalNet,
          totalHeadcount,
          isReachable: true,
        };
      } catch (err: unknown) {
        return {
          companyId,
          companyName,
          companyCode,
          cutoffId: groupMasterWindow.id,
          cutoffTitle: groupMasterWindow.cutoffTitle,
          cutoffType: groupMasterWindow.cutoffType,
          startDate: groupMasterWindow.startDateStr,
          endDate: groupMasterWindow.endDateStr,
          payoutDate: groupMasterWindow.payoutDateStr,
          totalDepartments: 0,
          completedDepartments: 0,
          percentage: 0,
          statusCode: "OFFLINE",
          statusLabel: "Offline",
          totalGross: 0,
          totalNet: 0,
          totalHeadcount: 0,
          isReachable: false,
          errorMessage: err instanceof Error ? err.message : "Connection failed",
        };
      }
    });

    const companyResults = await Promise.all(companyPromises);

    // Aggregate holdings metrics
    const totalCompanies = companyResults.length;
    const completedCompanies = companyResults.filter((c) => c.statusCode === "COMPLETED").length;
    const inProgressCompanies = companyResults.filter((c) => c.statusCode === "IN_PROGRESS").length;
    const pendingCompanies = companyResults.filter((c) => c.statusCode === "PENDING").length;
    const offlineCompanies = companyResults.filter((c) => c.statusCode === "OFFLINE").length;

    const reachableCompanies = companyResults.filter((c) => c.isReachable);
    const overallPercentage =
      reachableCompanies.length > 0
        ? Math.round(
            reachableCompanies.reduce((acc, c) => acc + c.percentage, 0) /
              reachableCompanies.length
          )
        : 0;

    const totalGroupGross = companyResults.reduce((acc, c) => acc + c.totalGross, 0);
    const totalGroupNet = companyResults.reduce((acc, c) => acc + c.totalNet, 0);
    const totalGroupHeadcount = companyResults.reduce((acc, c) => acc + c.totalHeadcount, 0);

    // Sort: In Progress first, then Completed, then Pending, then Offline
    const sortPriority: Record<string, number> = {
      IN_PROGRESS: 1,
      COMPLETED: 2,
      PENDING: 3,
      OFFLINE: 4,
    };
    companyResults.sort((a, b) => {
      const pA = sortPriority[a.statusCode] || 99;
      const pB = sortPriority[b.statusCode] || 99;
      if (pA !== pB) return pA - pB;
      return a.companyName.localeCompare(b.companyName);
    });

    const payload: HoldingsPayrollProgressData = {
      groupCutoffTitle: groupMasterWindow.cutoffTitle,
      groupStartDate: groupMasterWindow.startDateStr,
      groupEndDate: groupMasterWindow.endDateStr,
      groupPayoutDate: groupMasterWindow.payoutDateStr,
      totalCompanies,
      completedCompanies,
      inProgressCompanies,
      pendingCompanies,
      offlineCompanies,
      overallPercentage,
      totalGroupGross,
      totalGroupNet,
      totalGroupHeadcount,
      companies: companyResults,
    };

    globalThis.__serverHoldingsCutoffProgressCache = {
      data: payload,
      timestamp: Date.now(),
    };

    return NextResponse.json(payload);
  } catch (error: unknown) {
    console.error("[Holdings Cutoff Progress API Error]:", error);
    return NextResponse.json(
      {
        error: "Failed to compute holdings cutoff progress",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
