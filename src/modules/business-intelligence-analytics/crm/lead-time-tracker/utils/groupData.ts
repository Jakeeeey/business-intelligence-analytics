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

function normalizeStatus(value: unknown): LeadTimeStatus {
  const str = (value ?? "").toString().toLowerCase();
  if (["on-time", "on time", "ontime", "green"].includes(str)) return "on-time";
  if (["warning", "warn", "amber", "orange"].includes(str)) return "warning";
  if (["delayed", "delay", "late", "red"].includes(str)) return "delayed";
  return "pending";
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

/**
 * Normalize raw API record into an internal LeadTimeRow-like shape (partial)
 */
function normalizeRecord(r: unknown): LeadTimeRow {
  const obj = (r ?? {}) as Record<string, unknown>;

  const poNo = toStr(
    obj["poNo"] ?? obj["po_no"] ?? obj["poNumber"] ?? "",
  ).trim();
  const soNo = toStr(
    obj["soNo"] ?? obj["so_no"] ?? obj["soNumber"] ?? "",
  ).trim();
  const poDate = toStr(
    obj["poDate"] ?? obj["po_date"] ?? obj["date"] ?? "",
  ).trim();
  const createdAt = asOptionalString(
    obj["createdAt"] ?? obj["createdDate"] ?? obj["creationDate"] ?? null,
  );
  const approvedAt = asOptionalString(
    obj["approvedAt"] ?? obj["approvalDate"] ?? obj["approved_date"] ?? null,
  );
  const dispatchAt = asOptionalString(
    obj["dispatchAt"] ?? obj["dispatchDate"] ?? obj["dispatch_date"] ?? null,
  );
  const deliveredAt = asOptionalString(
    obj["deliveredAt"] ??
      obj["deliveredDate"] ??
      obj["deliveryDate"] ??
      null,
  );

  const approval = asNumber(
    obj["approval"] ?? obj["approvalDays"] ?? obj["approval_days"] ?? null,
  );
  const dispatch = asNumber(
    obj["dispatch"] ??
      obj["fulfillmentDays"] ??
      obj["fulfillment_days"] ??
      obj["dispatchDays"] ??
      null,
  );
  const delivered = asNumber(
    obj["delivered"] ??
      obj["deliveryDays"] ??
      obj["delivery_days"] ??
      obj["deliveredDays"] ??
      null,
  );

  const rawApprovalStatus =
    obj["approvalStatus"] ??
    obj["approval_status"] ??
    obj["approval_status_name"] ??
    obj["status"] ??
    null;
  const rawFulfillmentStatus =
    obj["fulfillmentStatus"] ??
    obj["fulfillment_status"] ??
    obj["fulfilment_status"] ??
    obj["fulfillmentStatusName"] ??
    obj["dispatchStatus"] ??
    null;
  const rawDeliveryStatus =
    obj["deliveryStatus"] ??
    obj["delivery_status"] ??
    obj["deliveryStatusName"] ??
    null;
  const productName = toStr(
    obj["productName"] ??
      obj["product_name"] ??
      obj["name"] ??
      obj["product"] ??
      "",
  ).trim();

  return {
    poNo,
    soNo,
    poDate,
    createdAt,
    approvedAt,
    dispatchAt,
    deliveredAt,
    approval,
    dispatch,
    delivered,
    status: normalizeStatus(obj["status"] ?? null),
    approvalStatus: normalizeStatus(rawApprovalStatus),
    fulfillmentStatus: normalizeStatus(rawFulfillmentStatus),
    deliveryStatus: normalizeStatus(rawDeliveryStatus),
    daysToDeliver: asNumber(
      obj["daysToDeliver"] ?? obj["days_to_deliver"] ?? null,
    ),
    productName,
  } as LeadTimeRow;
}

export function normalizeAndAggregate(records: unknown[]): LeadTimeRow[] {
  const normalized = records.map((r) => normalizeRecord(r));

  const groups = new Map<string, LeadTimeRow[]>();
  for (const n of normalized) {
    const key = `${n.poNo || ""}::${n.soNo || ""}`;
    const arr = groups.get(key) ?? [];
    arr.push(n);
    groups.set(key, arr);
  }

  const aggregated: LeadTimeRow[] = [];

  const maxNullable = (vals: Array<number | null | undefined>) => {
    let found = false;
    let max = -Infinity;
    for (const v of vals) {
      if (typeof v === "number") {
        found = true;
        if (v > max) max = v;
      }
    }
    return found ? max : null;
  };

  for (const arr of groups.values()) {
    // sort by poDate descending (latest first)
    const sorted = [...arr].sort((a, b) => {
      const at = parseDateLocal(a.poDate);
      const bt = parseDateLocal(b.poDate);
      if (Number.isNaN(at) && Number.isNaN(bt)) return 0;
      if (Number.isNaN(at)) return 1;
      if (Number.isNaN(bt)) return -1;
      return bt - at;
    });

    const latest = sorted[0];

    const approvalMax = maxNullable(sorted.map((s) => s.approval));
    const dispatchMax = maxNullable(sorted.map((s) => s.dispatch));
    const deliveredMax = maxNullable(sorted.map((s) => s.delivered));
    const daysMax = maxNullable(sorted.map((s) => s.daysToDeliver));

    const pickStatus = (
      key: "approvalStatus" | "fulfillmentStatus" | "deliveryStatus",
    ): LeadTimeStatus => {
      const latestVal = latest[key];
      if (latestVal && latestVal !== "pending") return latestVal;
      for (const r of sorted) {
        const v = r[key];
        if (v && v !== "pending") return v;
      }
      for (const r of sorted) {
        const v = r[key];
        if (v) return v;
      }
      return "pending";
    };

    const approvalStatus = pickStatus("approvalStatus");
    const fulfillmentStatus = pickStatus("fulfillmentStatus");
    const deliveryStatus = pickStatus("deliveryStatus");
    const pickDate = (
      key: "createdAt" | "approvedAt" | "dispatchAt" | "deliveredAt",
    ) => sorted.find((row) => row[key]?.trim())?.[key] ?? null;
    const productName =
      sorted.find((row) => row.productName?.trim())?.productName ??
      sorted.find((row) => row.product_name?.trim())?.product_name ??
      sorted.find((row) => row.name?.trim())?.name ??
      "";

    aggregated.push({
      poNo: latest.poNo,
      soNo: latest.soNo,
      poDate: latest.poDate,
      createdAt: pickDate("createdAt"),
      approvedAt: pickDate("approvedAt"),
      dispatchAt: pickDate("dispatchAt"),
      deliveredAt: pickDate("deliveredAt"),
      approval: approvalMax,
      dispatch: dispatchMax,
      delivered: deliveredMax,
      status: latest.status ?? "pending",
      approvalStatus,
      fulfillmentStatus,
      deliveryStatus,
      daysToDeliver: daysMax,
      productName,
    });
  }

  aggregated.sort((a, b) => {
    const at = parseDateLocal(a.poDate);
    const bt = parseDateLocal(b.poDate);
    if (Number.isNaN(at) && Number.isNaN(bt)) return 0;
    if (Number.isNaN(at)) return 1;
    if (Number.isNaN(bt)) return -1;
    return bt - at;
  });

  return aggregated;
}

export default normalizeAndAggregate;
