import type { CustomerLeadTimeRow } from "../types";

export type CustomerKpis = {
  totalOrders: number;
  avgTotalDays: number | null;
  fastestOrder: number | null;
  slowestOrder: number | null;
  avgApprovalDays: number | null;
  avgPickingDays: number | null;
  avgDispatchDays: number | null;
  avgDeliveryDays: number | null;
};

function mean(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => typeof v === "number");
  if (nums.length === 0) return null;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function minVal(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => typeof v === "number");
  if (nums.length === 0) return null;
  return Math.min(...nums);
}

function maxVal(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => typeof v === "number");
  if (nums.length === 0) return null;
  return Math.max(...nums);
}

export function computeKpis(rows: CustomerLeadTimeRow[]): CustomerKpis {
  return {
    totalOrders: rows.length,
    avgTotalDays: mean(rows.map((r) => r.totalDays)),
    fastestOrder: minVal(rows.map((r) => r.totalDays)),
    slowestOrder: maxVal(rows.map((r) => r.totalDays)),
    avgApprovalDays: mean(rows.map((r) => r.approvalDays)),
    avgPickingDays: mean(rows.map((r) => r.pickingDays)),
    avgDispatchDays: mean(rows.map((r) => r.dispatchDays)),
    avgDeliveryDays: mean(rows.map((r) => r.deliveryDays)),
  };
}

export default computeKpis;
