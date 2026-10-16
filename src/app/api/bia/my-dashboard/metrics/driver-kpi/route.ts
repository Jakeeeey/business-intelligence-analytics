import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "vos_access_token";

interface RawVisitRecord {
  dispatchPlanId?: number;
  dispatchDocumentNo?: string;
  dispatchPlanStatus?: string;
  estimatedTimeOfDispatch?: string | null;
  timeOfDispatch?: string | null;
  dispatchVarianceHours?: number | string | null;
  estimatedTimeOfArrival?: string | null;
  returnTimeOfArrival?: string | null;
  arrivalVarianceHours?: number | string | null;
  actualTripDurationHours?: number | string | null;
  fulfillmentStatus?: string | null;
  totalAmount?: number | string | null;
  driverNames?: string | null;
  customerName?: string | null;
}

export interface DriverKPIItem {
  driverName: string;
  totalVisits: number;
  fulfilledVisits: number;
  unfulfilledVisits: number;
  fulfillmentRate: number;
  totalFulfilledAmount: number;
  avgDispatchVarianceHours: number;
  avgArrivalVarianceHours: number;
}

export interface DriverKPICardData {
  selectedMonth: string;
  monthLabel: string;
  startDate: string;
  endDate: string;
  totalVisits: number;
  fulfilledVisits: number;
  unfulfilledVisits: number;
  fulfillmentRate: number;
  totalFulfilledAmount: number;
  revenueAtRisk: number;
  avgDispatchVarianceHours: number;
  avgArrivalVarianceHours: number;
  activeDriversCount: number;
  topDrivers: DriverKPIItem[];
  availableMonths: Array<{ value: string; label: string }>;
}

function isVisitFulfilled(status: unknown): boolean {
  const norm = String(status ?? "")
    .trim()
    .toLowerCase();
  return (
    norm === "fulfilled" ||
    norm === "fulfilled with returns" ||
    norm === "fulfilled_with_returns" ||
    norm === "fulfilled with concerns" ||
    norm === "fulfilled_with_concerns"
  );
}

function toNumber(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

function round2(val: number): number {
  return Number(val.toFixed(2));
}

function getAvailableMonths(): Array<{ value: string; label: string }> {
  const list: Array<{ value: string; label: string }> = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const val = `${y}-${m}`;
    const monthName = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    list.push({
      value: val,
      label: i === 0 ? `${monthName} (MTD)` : monthName,
    });
  }
  return list;
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    cookieStore.get(COOKIE_NAME)?.value ||
    process.env.DIRECTUS_STATIC_TOKEN;

  const isAuthDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";
  if (!token && !isAuthDisabled) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const curY = now.getFullYear();
  const curM = String(now.getMonth() + 1).padStart(2, "0");
  const curD = String(now.getDate()).padStart(2, "0");
  const currentMonthVal = `${curY}-${curM}`;

  const selectedMonth = searchParams.get("month") || currentMonthVal;
  const [targetYStr, targetMStr] = selectedMonth.split("-");
  const targetY = Number(targetYStr) || curY;
  const targetM = Number(targetMStr) || Number(curM);

  let startDate = `${targetY}-${String(targetM).padStart(2, "0")}-01`;
  let endDate: string;

  const isCurrentMonth = selectedMonth === currentMonthVal;
  if (isCurrentMonth) {
    endDate = `${curY}-${curM}-${curD}`;
  } else {
    const lastDayOfMonth = new Date(targetY, targetM, 0).getDate();
    endDate = `${targetY}-${String(targetM).padStart(2, "0")}-${String(lastDayOfMonth).padStart(2, "0")}`;
  }

  if (searchParams.get("startDate")) {
    startDate = searchParams.get("startDate")!;
  }
  if (searchParams.get("endDate")) {
    endDate = searchParams.get("endDate")!;
  }

  const monthObj = new Date(targetY, targetM - 1, 1);
  const monthName = monthObj.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const monthLabel = isCurrentMonth ? `${monthName} (MTD)` : monthName;

  const springBase = (process.env.SPRING_API_BASE_URL || "").replace(/\/+$/, "");

  let rawVisits: RawVisitRecord[] = [];

  if (springBase) {
    try {
      const upstreamUrl = `${springBase}/api/view-driver-customer-visit/filter?startDate=${encodeURIComponent(
        startDate
      )}&endDate=${encodeURIComponent(endDate)}`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(upstreamUrl, {
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (Array.isArray(json)) {
          rawVisits = json;
        } else if (json && typeof json === "object") {
          const obj = json as Record<string, unknown>;
          if (Array.isArray(obj.data)) {
            rawVisits = obj.data as RawVisitRecord[];
          }
        }
      } else {
        console.warn(`[Driver KPI Route] Spring upstream returned status ${res.status}`);
      }
    } catch (err: unknown) {
      console.warn("[Driver KPI Route] Spring upstream fetch failed:", err);
    }
  }

  // Calculate overall KPIs
  let fulfilled = 0;
  let totalFulfilledAmount = 0;
  let revenueAtRisk = 0;
  let dispatchVarianceTotal = 0;
  let arrivalVarianceTotal = 0;

  const driverMap = new Map<
    string,
    {
      driverName: string;
      total: number;
      fulfilled: number;
      fulfilledAmount: number;
      dispatchVarTotal: number;
      arrivalVarTotal: number;
    }
  >();

  const total = rawVisits.length;

  for (const visit of rawVisits) {
    const amount = toNumber(visit.totalAmount);
    const fulfilledFlag = isVisitFulfilled(visit.fulfillmentStatus);

    if (fulfilledFlag) {
      fulfilled++;
      totalFulfilledAmount += amount;
    } else {
      revenueAtRisk += amount;
    }

    const dispVar = toNumber(visit.dispatchVarianceHours);
    const arrVar = toNumber(visit.arrivalVarianceHours);
    dispatchVarianceTotal += dispVar;
    arrivalVarianceTotal += arrVar;

    const rawDriver = String(visit.driverNames || "").trim();
    const driverKey = rawDriver || "Unassigned";

    if (!driverMap.has(driverKey)) {
      driverMap.set(driverKey, {
        driverName: driverKey,
        total: 0,
        fulfilled: 0,
        fulfilledAmount: 0,
        dispatchVarTotal: 0,
        arrivalVarTotal: 0,
      });
    }

    const dStats = driverMap.get(driverKey)!;
    dStats.total++;
    if (fulfilledFlag) {
      dStats.fulfilled++;
      dStats.fulfilledAmount += amount;
    }
    dStats.dispatchVarTotal += dispVar;
    dStats.arrivalVarTotal += arrVar;
  }

  const unfulfilled = total - fulfilled;
  const fulfillmentRate = total === 0 ? 0 : Math.round((fulfilled / total) * 100);
  const avgDispatchVarianceHours = total === 0 ? 0 : round2(dispatchVarianceTotal / total);
  const avgArrivalVarianceHours = total === 0 ? 0 : round2(arrivalVarianceTotal / total);

  const topDrivers: DriverKPIItem[] = Array.from(driverMap.values())
    .map((d) => ({
      driverName: d.driverName,
      totalVisits: d.total,
      fulfilledVisits: d.fulfilled,
      unfulfilledVisits: d.total - d.fulfilled,
      fulfillmentRate: d.total === 0 ? 0 : Math.round((d.fulfilled / d.total) * 100),
      totalFulfilledAmount: round2(d.fulfilledAmount),
      avgDispatchVarianceHours: d.total === 0 ? 0 : round2(d.dispatchVarTotal / d.total),
      avgArrivalVarianceHours: d.total === 0 ? 0 : round2(d.arrivalVarTotal / d.total),
    }))
    .sort((a, b) => b.fulfilledVisits - a.fulfilledVisits || b.totalVisits - a.totalVisits);

  const payload: DriverKPICardData = {
    selectedMonth,
    monthLabel,
    startDate,
    endDate,
    totalVisits: total,
    fulfilledVisits: fulfilled,
    unfulfilledVisits: unfulfilled,
    fulfillmentRate,
    totalFulfilledAmount: round2(totalFulfilledAmount),
    revenueAtRisk: round2(revenueAtRisk),
    avgDispatchVarianceHours,
    avgArrivalVarianceHours,
    activeDriversCount: topDrivers.length,
    topDrivers: topDrivers.slice(0, 10),
    availableMonths: getAvailableMonths(),
  };

  return NextResponse.json(payload);
}
