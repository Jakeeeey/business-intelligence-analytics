import type { VisitRecord } from "../types";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type FulfillmentStatus =
  | "fulfilled"
  | "fulfilled_with_returns"
  | "unfulfilled";

export type KPIResult = {
  total: number;
  fulfilled: number;
  unfulfilled: number;
  fulfillmentRate: number;
  avgDispatchVarianceHours: number;
  avgArrivalVarianceHours: number;
  totalFulfilledAmount: number;
  revenueAtRisk: number;
};

export type DispatchGroup = {
  dispatchDocumentNo: string;
  dispatchPlanId?: number | null;
  dispatchTime: string | null;
  arrivalTime: string | null;
  totalCustomers: number;
  fulfilledCount: number;
  unfulfilledCount: number;
  fulfillmentPercent: number;
  fulfilledAmount: number;
  unfulfilledAmount: number;
  truck: string;
  customers: VisitRecord[];
};

export type TruckGroup = {
  truckKey: string;
  truckName: string;
  plateNo: string;
  truckType: string;
  dispatchNo: string;
  dispatchTime: string | null;
  arrivalTime: string | null;
  durationHours: number;
  visits: VisitRecord[];
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

export function normalizeFulfillmentStatus(
  raw: unknown,
): FulfillmentStatus {
  const value = String(raw ?? "").trim().toLowerCase();

  if (value === "fulfilled") return "fulfilled";

  if (
    value === "fulfilled with returns" ||
    value === "fulfilled_with_returns"
  ) {
    return "fulfilled_with_returns";
  }

  return "unfulfilled";
}

export function isFulfilled(raw: unknown): boolean {
  const status = normalizeFulfillmentStatus(raw);

  return (
    status === "fulfilled" ||
    status === "fulfilled_with_returns"
  );
}

/* -------------------------------------------------------------------------- */
/* KPI Summary                                                                */
/* -------------------------------------------------------------------------- */

export function calculateKPIs(
  visits: VisitRecord[],
): KPIResult {
  let fulfilled = 0;
  let dispatchVarianceTotal = 0;
  let arrivalVarianceTotal = 0;
  let totalFulfilledAmount = 0;
  let revenueAtRisk = 0;

  const total = visits.length;

  for (const visit of visits) {
    const amount = toNumber(visit.totalAmount);
    const fulfilledFlag = isFulfilled(
      visit.fulfillmentStatus,
    );

    if (fulfilledFlag) {
      fulfilled++;
      totalFulfilledAmount += amount;
    } else {
      revenueAtRisk += amount;
    }

    dispatchVarianceTotal += toNumber(
      visit.dispatchVarianceHours,
    );

    arrivalVarianceTotal += toNumber(
      visit.arrivalVarianceHours,
    );
  }

  const unfulfilled = total - fulfilled;

  return {
    total,
    fulfilled,
    unfulfilled,
    fulfillmentRate:
      total === 0 ? 0 : round2((fulfilled / total) * 100),
    avgDispatchVarianceHours:
      total === 0
        ? 0
        : round2(dispatchVarianceTotal / total),
    avgArrivalVarianceHours:
      total === 0
        ? 0
        : round2(arrivalVarianceTotal / total),
    totalFulfilledAmount: round2(totalFulfilledAmount),
    revenueAtRisk: round2(revenueAtRisk),
  };
}

/* -------------------------------------------------------------------------- */
/* Group By Dispatch                                                          */
/* -------------------------------------------------------------------------- */

export function groupByDispatch(
  visits: VisitRecord[],
): DispatchGroup[] {
  const map = new Map<string, VisitRecord[]>();

  for (const visit of visits) {
    const key =
      visit.dispatchDocumentNo ||
      `DP-${visit.dispatchPlanId}`;

    if (!map.has(key)) {
      map.set(key, []);
    }

    map.get(key)!.push(visit);
  }

  const result: DispatchGroup[] = [];

  for (const [dispatchDocumentNo, list] of map) {
    let fulfilledCount = 0;
    let fulfilledAmount = 0;
    let unfulfilledAmount = 0;

    for (const row of list) {
      const amount = toNumber(row.totalAmount);

      if (isFulfilled(row.fulfillmentStatus)) {
        fulfilledCount++;
        fulfilledAmount += amount;
      } else {
        unfulfilledAmount += amount;
      }
    }

    const totalCustomers = list.length;
    const unfulfilledCount =
      totalCustomers - fulfilledCount;

    const first = list[0];
    const last = list[list.length - 1];

    result.push({
      dispatchDocumentNo,
      dispatchPlanId:
        first?.dispatchPlanId ?? null,
      dispatchTime:
        first?.timeOfDispatch ?? null,
      arrivalTime:
        last?.returnTimeOfArrival ?? null,
      totalCustomers,
      fulfilledCount,
      unfulfilledCount,
      fulfillmentPercent:
        totalCustomers === 0
          ? 0
          : round2(
              (fulfilledCount / totalCustomers) *
                100,
            ),
      fulfilledAmount: round2(
        fulfilledAmount,
      ),
      unfulfilledAmount: round2(
        unfulfilledAmount,
      ),
      truck: first?.truckPlateNo ?? "",
      customers: list,
    });
  }

  return result;
}

/* -------------------------------------------------------------------------- */
/* Group By Truck                                                             */
/* -------------------------------------------------------------------------- */

export function groupByTruck(
  visits: VisitRecord[],
): TruckGroup[] {
  const map = new Map<string, VisitRecord[]>();

  for (const visit of visits) {
    const key =
      visit.truckPlateNo ||
      String(visit.truckId ?? "");

    if (!map.has(key)) {
      map.set(key, []);
    }

    map.get(key)!.push(visit);
  }

  const result: TruckGroup[] = [];

  for (const [truckKey, list] of map) {
    let durationHours = 0;

    for (const row of list) {
      durationHours += toNumber(
        row.actualTripDurationHours,
      );
    }

    const first = list[0];
    const last = list[list.length - 1];

    result.push({
      truckKey,
      truckName: first?.truckName ?? "",
      plateNo: first?.truckPlateNo ?? "",
      truckType: first?.truckType ?? "",
      dispatchNo:
        first?.dispatchDocumentNo ?? "",
      dispatchTime:
        first?.timeOfDispatch ?? null,
      arrivalTime:
        last?.returnTimeOfArrival ?? null,
      durationHours: round2(durationHours),
      visits: list,
    });
  }

  return result;
}