import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "vos_access_token";

type AnyRec = Record<string, unknown>;

async function fetchDirectusPage<T>(url: string, headers: Record<string, string>): Promise<T[]> {
  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Directus error ${res.status}`);
  }
  const json = await res.json();
  return (json.data || []) as T[];
}

export interface DepartmentProgressItem {
  id: number;
  name: string;
  isCompleted: boolean;
  status: "POSTED" | "PENDING";
}

export interface CutoffProgressData {
  cutoffId: number | null;
  cutoffTitle: string;
  cutoffType: string | null;
  startDate: string | null;
  endDate: string | null;
  payoutDate: string | null;
  paidDayPlusOne: string | null;
  isWindowActive: boolean;
  totalDepartments: number;
  completedDepartments: number;
  percentage: number;
  statusCode: "COMPLETED" | "IN_PROGRESS" | "PENDING";
  statusLabel: string;
  totalGross: number;
  totalNet: number;
  totalHeadcount: number;
  departments: DepartmentProgressItem[];
}

interface CachedCutoffPayload {
  data: CutoffProgressData;
  timestamp: number;
}

declare global {
  var __serverCutoffProgressCache: CachedCutoffPayload | undefined;
}

const SERVER_CACHE_TTL_MS = 180000; // 3 minutes

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

  if (!force && globalThis.__serverCutoffProgressCache) {
    if (Date.now() - globalThis.__serverCutoffProgressCache.timestamp < SERVER_CACHE_TTL_MS) {
      return NextResponse.json(globalThis.__serverCutoffProgressCache.data);
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

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (staticToken) {
    headers["Authorization"] = `Bearer ${staticToken}`;
  } else if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const now = new Date();
    const ny = now.getFullYear();
    const nm = String(now.getMonth() + 1).padStart(2, "0");
    const nd = String(now.getDate()).padStart(2, "0");
    const todayStr = `${ny}-${nm}-${nd}`;

    const [cutoffs, departments, payrollRuns] = await Promise.all([
      fetchDirectusPage<AnyRec>(
        `${baseUrl}/items/cutoff_settings?limit=-1&fields=id,cutoff_type,month,year,start_date,end_date,payout_date`,
        headers
      ).catch(() => [] as AnyRec[]),
      fetchDirectusPage<AnyRec>(
        `${baseUrl}/items/department?limit=-1&fields=department_id,department_name`,
        headers
      ).catch(() => [] as AnyRec[]),
      fetchDirectusPage<AnyRec>(
        `${baseUrl}/items/payroll_run?limit=-1&fields=payroll_run_id,cutoff_id,cutoff_start,cutoff_end,department_id,status,headcount,total_gross,total_net,total_deductions`,
        headers
      ).catch(() => [] as AnyRec[]),
    ]);

    // 1. Map active departments
    const activeDepartments = departments.map((d) => ({
      id: Number(d.department_id || d.id),
      name: String(d.department_name || d.name || `Department #${d.department_id || d.id}`),
    }));

    // 2. Map cutoff windows with validated payout dates & +1 day boundary
    const cutoffWindows = cutoffs
      .map((c) => {
        const id = Number(c.id);
        const startDateStr = c.start_date ? String(c.start_date).slice(0, 10) : null;
        const endDateStr = c.end_date ? String(c.end_date).slice(0, 10) : null;
        let payoutDate: Date | null = null;

        // Use c.payout_date only if it's on or after endDateStr
        if (
          c.payout_date &&
          endDateStr &&
          String(c.payout_date).slice(0, 10) >= endDateStr
        ) {
          const parts = String(c.payout_date).slice(0, 10).split("-");
          payoutDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        } else if (endDateStr) {
          const endParts = endDateStr.split("-");
          const y = Number(endParts[0]);
          const m = Number(endParts[1]) - 1;
          const type = String(c.cutoff_type || "").toUpperCase();
          if (type === "FIRST") {
            payoutDate = new Date(y, m, 15);
          } else if (type === "SECOND") {
            payoutDate = new Date(y, m + 1, 0); // Last day of month
          } else {
            payoutDate = new Date(new Date(y, m, Number(endParts[2])).getTime() + 5 * 86400000);
          }
        }

        let paidDayPlusOne: Date | null = null;
        if (payoutDate) {
          paidDayPlusOne = new Date(payoutDate.getTime() + 86400000);
          paidDayPlusOne.setHours(23, 59, 59, 999);
        }

        return { cutoff: c, id, startDateStr, endDateStr, payoutDate, paidDayPlusOne };
      })
      .filter((cw) => cw.id && cw.startDateStr && cw.endDateStr)
      .sort((a, b) => a.endDateStr!.localeCompare(b.endDateStr!));

    // 3. Select active cutoff:
    // Only advance to a cutoff once today's date has reached or passed its cutoff date (endDateStr <= todayStr).
    const endedCutoffs = cutoffWindows.filter(
      (cw) => cw.endDateStr && cw.endDateStr <= todayStr
    );

    const currentWindow =
      endedCutoffs.length > 0
        ? endedCutoffs[endedCutoffs.length - 1]
        : cutoffWindows[0] || null;

    if (!currentWindow) {
      const emptyPayload: CutoffProgressData = {
        cutoffId: null,
        cutoffTitle: "No Active Cutoff",
        cutoffType: null,
        startDate: null,
        endDate: null,
        payoutDate: null,
        paidDayPlusOne: null,
        isWindowActive: false,
        totalDepartments: activeDepartments.length,
        completedDepartments: 0,
        percentage: 0,
        statusCode: "PENDING",
        statusLabel: "Not Configured",
        totalGross: 0,
        totalNet: 0,
        totalHeadcount: 0,
        departments: [],
      };
      return NextResponse.json(emptyPayload);
    }

    // 4. Filter runs for the active window
    const matchingRuns = payrollRuns.filter((r) => {
      if (Number(r.cutoff_id) === currentWindow!.id) return true;
      if (currentWindow!.startDateStr && currentWindow!.endDateStr) {
        return (
          String(r.cutoff_start).slice(0, 10) === currentWindow!.startDateStr &&
          String(r.cutoff_end).slice(0, 10) === currentWindow!.endDateStr
        );
      }
      return false;
    });

    const postedRuns = matchingRuns.filter(
      (r) => String(r.status || "").toUpperCase() === "POSTED"
    );

    // 5. Consolidated check (runs covering all departments in one master batch)
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

    // 6. Department breakdown & counts
    const deptItems: DepartmentProgressItem[] = activeDepartments.map((d) => {
      const deptId = d.id;
      const isCompleted = isConsolidatedPosted || postedDeptIdSet.has(deptId);
      return {
        id: deptId,
        name: d.name,
        isCompleted,
        status: isCompleted ? "POSTED" : "PENDING",
      };
    });

    const totalCount = activeDepartments.length;
    const completedCount = isConsolidatedPosted
      ? totalCount
      : deptItems.filter((i) => i.isCompleted).length;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Status classification matrix
    let statusCode: "COMPLETED" | "IN_PROGRESS" | "PENDING" = "PENDING";
    let statusLabel = "Not Started";

    if (totalCount > 0 && completedCount === totalCount) {
      statusCode = "COMPLETED";
      statusLabel = "All Depts Posted";
    } else if (completedCount > 0) {
      statusCode = "IN_PROGRESS";
      statusLabel = `${completedCount}/${totalCount} Posted`;
    } else if (matchingRuns.some((r) => ["PENDING_CHECKER", "PENDING_APPROVER", "PROCESSED"].includes(String(r.status || "").toUpperCase()))) {
      statusCode = "IN_PROGRESS";
      statusLabel = "Under Review";
    } else if (matchingRuns.some((r) => String(r.status || "").toUpperCase() === "DRAFT")) {
      statusCode = "IN_PROGRESS";
      statusLabel = "Drafting";
    }

    // Totals
    const totalGross = matchingRuns.reduce((acc, r) => acc + (Number(r.total_gross) || 0), 0);
    const totalNet = matchingRuns.reduce((acc, r) => acc + (Number(r.total_net) || 0), 0);
    const totalHeadcount = matchingRuns.reduce((acc, r) => acc + (Number(r.headcount) || 0), 0);

    const formatYMD = (d: Date | null) => {
      if (!d) return null;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const typeStr = currentWindow.cutoff.cutoff_type
      ? `${String(currentWindow.cutoff.cutoff_type).toUpperCase()} Cutoff`
      : "Cutoff";

    const payload: CutoffProgressData = {
      cutoffId: currentWindow.id,
      cutoffTitle: `${typeStr} #${currentWindow.id}`,
      cutoffType: currentWindow.cutoff.cutoff_type ? String(currentWindow.cutoff.cutoff_type) : null,
      startDate: currentWindow.startDateStr,
      endDate: currentWindow.endDateStr,
      payoutDate: formatYMD(currentWindow.payoutDate),
      paidDayPlusOne: formatYMD(currentWindow.paidDayPlusOne),
      isWindowActive: currentWindow.paidDayPlusOne
        ? now.getTime() <= currentWindow.paidDayPlusOne.getTime()
        : true,
      totalDepartments: totalCount,
      completedDepartments: completedCount,
      percentage,
      statusCode,
      statusLabel,
      totalGross,
      totalNet,
      totalHeadcount,
      departments: deptItems,
    };

    globalThis.__serverCutoffProgressCache = {
      data: payload,
      timestamp: Date.now(),
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error("[CutoffProgressRoute] Aggregation error:", err);
    return NextResponse.json(
      { error: "Failed to aggregate cutoff payroll progress" },
      { status: 500 }
    );
  }
}
