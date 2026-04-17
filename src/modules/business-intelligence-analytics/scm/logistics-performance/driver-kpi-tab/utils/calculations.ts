import type { VisitRecord } from "../types";

export function calculateKPIs(visits: VisitRecord[]) {
  const total = visits.length;
  const fulfilled = visits.filter(
    (v) => String(v.fulfillmentStatus).toLowerCase() === "fulfilled",
  ).length;
  const unfulfilled = total - fulfilled;
  const fulfillmentRate =
    total === 0 ? 0 : Number(((fulfilled / total) * 100).toFixed(2));
  const avgDispatchVarianceHours =
    total === 0
      ? 0
      : Number(
          (
            visits.reduce(
              (s, v) => s + (Number(v.dispatchVarianceHours) || 0),
              0,
            ) / total
          ).toFixed(2),
        );
  const avgArrivalVarianceHours =
    total === 0
      ? 0
      : Number(
          (
            visits.reduce(
              (s, v) => s + (Number(v.arrivalVarianceHours) || 0),
              0,
            ) / total
          ).toFixed(2),
        );
  const totalFulfilledAmount = visits
    .filter((v) => String(v.fulfillmentStatus).toLowerCase() === "fulfilled")
    .reduce((s, v) => s + (Number(v.totalAmount) || 0), 0);
  const revenueAtRisk = visits
    .filter((v) => String(v.fulfillmentStatus).toLowerCase() !== "fulfilled")
    .reduce((s, v) => s + (Number(v.totalAmount) || 0), 0);

  return {
    total,
    fulfilled,
    unfulfilled,
    fulfillmentRate,
    avgDispatchVarianceHours,
    avgArrivalVarianceHours,
    totalFulfilledAmount,
    revenueAtRisk,
  };
}

export function groupByDispatch(visits: VisitRecord[]) {
  const map = new Map<string, VisitRecord[]>();
  visits.forEach((v) => {
    const key = v.dispatchDocumentNo || `DP-${v.dispatchPlanId}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(v);
  });

  return Array.from(map.entries()).map(([dispatchDocumentNo, list]) => {
    const fulfilledCount = list.filter(
      (l) => String(l.fulfillmentStatus).toLowerCase() === "fulfilled",
    ).length;
    const unfulfilledCount = list.length - fulfilledCount;
    const fulfilledAmount = list
      .filter((l) => String(l.fulfillmentStatus).toLowerCase() === "fulfilled")
      .reduce((s, l) => s + (Number(l.totalAmount) || 0), 0);
    const unfulfilledAmount = list
      .filter((l) => String(l.fulfillmentStatus).toLowerCase() !== "fulfilled")
      .reduce((s, l) => s + (Number(l.totalAmount) || 0), 0);
    const dispatchTime = list[0]?.timeOfDispatch ?? null;
    const arrivalTime = list[list.length - 1]?.returnTimeOfArrival ?? null;

    return {
      dispatchDocumentNo,
      dispatchPlanId: list[0]?.dispatchPlanId,
      dispatchTime,
      arrivalTime,
      totalCustomers: list.length,
      fulfilledCount,
      unfulfilledCount,
      fulfillmentPercent:
        list.length === 0
          ? 0
          : Number(((fulfilledCount / list.length) * 100).toFixed(2)),
      fulfilledAmount,
      unfulfilledAmount,
      truck: list[0]?.truckPlateNo ?? "",
      customers: list,
    };
  });
}

export function groupByTruck(visits: VisitRecord[]) {
  const map = new Map<string, VisitRecord[]>();
  visits.forEach((v) => {
    const key = v.truckPlateNo || String(v.truckId);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(v);
  });

  return Array.from(map.entries()).map(([truckKey, list]) => {
    const first = list[0];
    const last = list[list.length - 1];
    const dispatchTime = first?.timeOfDispatch ?? null;
    const arrivalTime = last?.returnTimeOfArrival ?? null;
    const durationHours = list.reduce(
      (s, l) => s + (Number(l.actualTripDurationHours) || 0),
      0,
    );

    return {
      truckKey,
      truckName: first?.truckName ?? "",
      plateNo: first?.truckPlateNo ?? "",
      truckType: first?.truckType ?? "",
      dispatchNo: first?.dispatchDocumentNo ?? "",
      dispatchTime,
      arrivalTime,
      durationHours,
      visits: list,
    };
  });
}
