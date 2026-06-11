import type { LeadTimeRow, LeadTimeStatus } from "../types";

function parseDateLocal(s: string | undefined | null): number {
  if (!s) return NaN;
  const datePart = String(s).slice(0, 10);
  const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match)
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
    ).getTime();
  const t = Date.parse(String(s));
  return Number.isNaN(t) ? NaN : t;
}



function toStr(v: unknown) {
  return v == null ? "" : String(v);
}

function asNumber(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function asOptionalString(v: unknown): string | null {
  const s = toStr(v).trim();
  return s ? s : null;
}

export function normalizeAndAggregate(records: unknown[]): LeadTimeRow[] {
  const normalized = records.map((r) => {
    const obj = (r ?? {}) as Record<string, unknown>;

    const poNo = toStr(obj["po_no"] ?? obj["poNo"] ?? "").trim();
    const soNo = toStr(obj["so_no"] ?? obj["soNo"] ?? "").trim();
    const customerCode = toStr(obj["customer_code"] ?? obj["customerCode"] ?? "").trim();
    const customerName = toStr(obj["customer_name"] ?? obj["customerName"] ?? "").trim();
    
    const purchasedDate = asOptionalString(obj["purchased_date"] ?? obj["purchasedDate"]);
    const createdDate = asOptionalString(obj["created_date"] ?? obj["createdDate"]);
    const approvedDate = asOptionalString(obj["approved_date"] ?? obj["approvedDate"]);
    const pickedConsoDate = asOptionalString(obj["picked_conso_date"] ?? obj["pickedConsoDate"]);
    const dispatchedDate = asOptionalString(obj["dispatched_date"] ?? obj["dispatchedDate"]);
    const deliveredDate = asOptionalString(obj["delivered_date"] ?? obj["deliveredDate"]);
    
    const totalDays = asNumber(obj["total_days"] ?? obj["totalDays"]);

    // Calculate status based on days passed since PO (purchasedDate)
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const purchasedMs = parseDateLocal(purchasedDate);

    const getStatusByDateDiff = (targetDateStr: string | null): LeadTimeStatus => {
      if (!targetDateStr) return "pending";
      const targetMs = parseDateLocal(targetDateStr);
      if (Number.isNaN(purchasedMs) || Number.isNaN(targetMs)) return "pending";
      
      const diffDays = (targetMs - purchasedMs) / MS_PER_DAY;
      if (diffDays > 3) return "delayed"; // Critical (Red)
      if (diffDays > 1) return "warning"; // Warning (Orange)
      return "on-time";
    };

    const approvalStatus: LeadTimeStatus = getStatusByDateDiff(approvedDate);
    const fulfillmentStatus: LeadTimeStatus = getStatusByDateDiff(pickedConsoDate);
    const deliveryStatus: LeadTimeStatus = getStatusByDateDiff(dispatchedDate);

    let overallStatus: LeadTimeStatus = "pending";
    if (totalDays !== null) {
      overallStatus = totalDays > 3 ? "delayed" : "on-time";
    } else if (deliveredDate) {
      overallStatus = "on-time";
    }

    return {
      customerCode,
      customerName,
      poNo,
      soNo,
      purchasedDate,
      createdDate,
      approvedDate,
      pickedConsoDate,
      dispatchedDate,
      deliveredDate,
      totalDays,
      status: overallStatus,
      approvalStatus,
      fulfillmentStatus,
      deliveryStatus,
    } as LeadTimeRow;
  });

  // Sort by purchased_date descending
  normalized.sort((a, b) => {
    const at = parseDateLocal(a.purchasedDate);
    const bt = parseDateLocal(b.purchasedDate);
    if (Number.isNaN(at) && Number.isNaN(bt)) return 0;
    if (Number.isNaN(at)) return 1;
    if (Number.isNaN(bt)) return -1;
    return bt - at;
  });

  return normalized;
}

export default normalizeAndAggregate;
