import type { VisitRecord } from "../types";
import { groupByDispatch } from "./calculations";

export type SortKey =
  | "dp"
  | "estimatedDispatch"
  | "actualDispatch"
  | "dispatch"
  | "dispatchVariance"
  | "estimatedArrival"
  | "actualArrival"
  | "arrival"
  | "arrivalVariance"
  | "customers"
  | "fulfilled"
  | "unfulfilled"
  | "performance"
  | "fulfilledAmount"
  | "unfulfilledAmount"
  | "truck";

type DispatchGroup = ReturnType<typeof groupByDispatch>[number];

function toTs(x: unknown): number | null {
  if (x == null) return null;
  if (typeof x === "number") {
    if (Number.isNaN(x)) return null;
    return x;
  }
  const v = Date.parse(String(x));
  return Number.isNaN(v) ? null : v;
}

function minutesFromHours(
  x: number | string | null | undefined,
): number | null {
  if (x == null) return null;
  const n = typeof x === "number" ? x : Number(String(x));
  if (Number.isNaN(n)) return null;
  return Math.round(n * 60);
}

export function groupSortValue(
  g: DispatchGroup | undefined | null,
  key: SortKey,
): unknown {
  if (!g) return null;
  switch (key) {
    case "dp":
      return g.dispatchDocumentNo ?? "";
    case "estimatedDispatch": {
      const times = (g.customers || [])
        .map((c: VisitRecord) => c.estimatedTimeOfDispatch)
        .filter(Boolean)
        .map((t) => toTs(t as unknown))
        .filter((n) => n !== null) as number[];
      return times.length ? Math.min(...times) : null;
    }
    case "actualDispatch":
    case "dispatch":
      return toTs(g.dispatchTime ?? null);
    case "dispatchVariance": {
      const first = (g.customers || [])[0];
      if (first) {
        const e = first.estimatedTimeOfDispatch;
        const a = first.timeOfDispatch;
        if (e && a) {
          const et = toTs(e);
          const at = toTs(a);
          if (et !== null && at !== null) return Math.round((at - et) / 60000);
        }
        if (typeof first.dispatchVarianceHours === "number")
          return minutesFromHours(first.dispatchVarianceHours);
      }
      return null;
    }
    case "estimatedArrival": {
      const times = (g.customers || [])
        .map((c: VisitRecord) => c.estimatedTimeOfArrival)
        .filter(Boolean)
        .map((t) => toTs(t as unknown))
        .filter((n) => n !== null) as number[];
      return times.length ? Math.max(...times) : null;
    }
    case "actualArrival":
    case "arrival":
      return toTs(g.arrivalTime ?? null);
    case "arrivalVariance": {
      const last = (g.customers || [])[g.customers.length - 1];
      if (last) {
        const e = last.estimatedTimeOfArrival;
        const a = last.returnTimeOfArrival;
        if (e && a) {
          const et = toTs(e);
          const at = toTs(a);
          if (et !== null && at !== null) return Math.round((at - et) / 60000);
        }
        if (typeof last.arrivalVarianceHours === "number")
          return minutesFromHours(last.arrivalVarianceHours);
      }
      return null;
    }
    case "customers":
      return typeof g.totalCustomers === "number" ? g.totalCustomers : null;
    case "fulfilled":
      return typeof g.fulfilledCount === "number" ? g.fulfilledCount : null;
    case "unfulfilled":
      return typeof g.unfulfilledCount === "number" ? g.unfulfilledCount : null;
    case "performance":
      return typeof g.fulfillmentPercent === "number"
        ? g.fulfillmentPercent
        : null;
    case "fulfilledAmount":
      return typeof g.fulfilledAmount === "number" ? g.fulfilledAmount : null;
    case "unfulfilledAmount":
      return typeof g.unfulfilledAmount === "number"
        ? g.unfulfilledAmount
        : null;
    case "truck":
      return g.truck ?? "";
    default:
      return null;
  }
}

export function rowSortValue(
  r: VisitRecord,
  key: SortKey,
  groupMap?: Map<string, DispatchGroup>,
): unknown {
  const g = groupMap?.get(r.dispatchDocumentNo ?? "");
  switch (key) {
    case "dp":
      return r.dispatchDocumentNo ?? "";
    case "estimatedDispatch": {
      if (g) return groupSortValue(g, "estimatedDispatch");
      return toTs(r.estimatedTimeOfDispatch ?? null);
    }
    case "actualDispatch":
    case "dispatch":
      if (g) return groupSortValue(g, "dispatch");
      return toTs(r.timeOfDispatch ?? r.estimatedTimeOfDispatch ?? null);
    case "dispatchVariance": {
      if (g) return groupSortValue(g, "dispatchVariance");
      // row-level variance
      if (r.estimatedTimeOfDispatch && r.timeOfDispatch) {
        const e = toTs(r.estimatedTimeOfDispatch);
        const a = toTs(r.timeOfDispatch);
        if (e !== null && a !== null) return Math.round((a - e) / 60000);
      }
      if (typeof r.dispatchVarianceHours === "number")
        return minutesFromHours(r.dispatchVarianceHours);
      return null;
    }
    case "estimatedArrival": {
      if (g) return groupSortValue(g, "estimatedArrival");
      return toTs(r.estimatedTimeOfArrival ?? null);
    }
    case "actualArrival":
    case "arrival":
      if (g) return groupSortValue(g, "arrival");
      return toTs(r.returnTimeOfArrival ?? null);
    case "arrivalVariance": {
      if (g) return groupSortValue(g, "arrivalVariance");
      if (r.estimatedTimeOfArrival && r.returnTimeOfArrival) {
        const e = toTs(r.estimatedTimeOfArrival);
        const a = toTs(r.returnTimeOfArrival);
        if (e !== null && a !== null) return Math.round((a - e) / 60000);
      }
      if (typeof r.arrivalVarianceHours === "number")
        return minutesFromHours(r.arrivalVarianceHours);
      return null;
    }
    case "customers":
      return g ? groupSortValue(g, "customers") : null;
    case "fulfilled":
      return g ? groupSortValue(g, "fulfilled") : null;
    case "unfulfilled":
      return g ? groupSortValue(g, "unfulfilled") : null;
    case "performance":
      return g ? groupSortValue(g, "performance") : null;
    case "fulfilledAmount":
      return g ? groupSortValue(g, "fulfilledAmount") : null;
    case "unfulfilledAmount":
      return g ? groupSortValue(g, "unfulfilledAmount") : null;
    case "truck":
      return g?.truck ?? r.truckName ?? r.truckPlateNo ?? "";
    default:
      return null;
  }
}

export function compareValues(a: unknown, b: unknown, dir: "asc" | "desc") {
  if (a == null && b == null) return 0;
  if (a == null) return dir === "asc" ? 1 : -1;
  if (b == null) return dir === "asc" ? -1 : 1;

  // numbers (including timestamps)
  const na = typeof a === "number" ? a : Number(String(a));
  const nb = typeof b === "number" ? b : Number(String(b));
  const bothNumbers = !Number.isNaN(na) && !Number.isNaN(nb);
  if (bothNumbers) {
    return dir === "asc" ? na - nb : nb - na;
  }

  // string fallback
  const sa = String(a).toLowerCase();
  const sb = String(b).toLowerCase();
  return dir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
}
