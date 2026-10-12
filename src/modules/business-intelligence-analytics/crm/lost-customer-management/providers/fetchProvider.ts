import { LostCustomerFilters, LostCustomerRecord } from "../types";

const API_BASE = "/api/bia/crm/lost-customer-management";

function toNumber(val: unknown): number {
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  if (typeof val === "string") {
    const parsed = parseFloat(val.replace(/,/g, ""));
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function toString(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

export function normalizeLostCustomerRecord(
  raw: Record<string, unknown>,
  index: number
): LostCustomerRecord {
  const customerCode =
    toString(raw.customerCode) ||
    toString(raw.customer_code) ||
    toString(raw.code) ||
    `CUST-${index + 1}`;

  const customerName =
    toString(raw.customerName) ||
    toString(raw.customer_name) ||
    toString(raw.name) ||
    "Unknown Customer";

  const tagging =
    toString(raw.tagging) ||
    toString(raw.customerTagging) ||
    toString(raw.customer_tagging) ||
    toString(raw.tag) ||
    "Unassigned";

  const minDaysNoSales =
    toNumber(raw.minDaysNoSales) ||
    toNumber(raw.daysNoSales) ||
    toNumber(raw.days_no_sales) ||
    toNumber(raw.daysInactive) ||
    toNumber(raw.days_inactive) ||
    toNumber(raw.daysSinceLastOrder) ||
    toNumber(raw.days_since_last_order) ||
    0;

  const lastSalesDate =
    toString(raw.lastSalesDate) ||
    toString(raw.last_sales_date) ||
    toString(raw.lastOrderDate) ||
    toString(raw.last_order_date) ||
    toString(raw.date) ||
    null;

  const totalHistoricalSales =
    toNumber(raw.totalHistoricalSales) ||
    toNumber(raw.total_historical_sales) ||
    toNumber(raw.historicalSales) ||
    toNumber(raw.historical_sales) ||
    toNumber(raw.totalSales) ||
    toNumber(raw.total_sales) ||
    toNumber(raw.sales) ||
    toNumber(raw.totalRevenue) ||
    toNumber(raw.total_revenue) ||
    toNumber(raw.revenue) ||
    toNumber(raw.netSales) ||
    toNumber(raw.net_sales) ||
    toNumber(raw.grossSales) ||
    toNumber(raw.gross_sales) ||
    toNumber(raw.salesAmount) ||
    toNumber(raw.sales_amount) ||
    toNumber(raw.soAmount) ||
    toNumber(raw.so_amount) ||
    toNumber(raw.totalSoAmount) ||
    toNumber(raw.total_so_amount) ||
    toNumber(raw.siAmount) ||
    toNumber(raw.si_amount) ||
    toNumber(raw.totalSiAmount) ||
    toNumber(raw.total_si_amount) ||
    toNumber(raw.invoiceAmount) ||
    toNumber(raw.invoice_amount) ||
    toNumber(raw.totalInvoiceAmount) ||
    toNumber(raw.total_invoice_amount) ||
    toNumber(raw.orderAmount) ||
    toNumber(raw.order_amount) ||
    toNumber(raw.totalOrderAmount) ||
    toNumber(raw.total_order_amount) ||
    toNumber(raw.purchasedAmount) ||
    toNumber(raw.purchased_amount) ||
    toNumber(raw.totalPurchased) ||
    toNumber(raw.total_purchased) ||
    toNumber(raw.amount) ||
    toNumber(raw.totalAmount) ||
    toNumber(raw.total_amount) ||
    toNumber(raw.value) ||
    toNumber(raw.totalValue) ||
    toNumber(raw.total_value) ||
    0;

  const salesmanName =
    toString(raw.salesmanName) ||
    toString(raw.salesman_name) ||
    toString(raw.salesman) ||
    null;

  const branchName =
    toString(raw.branchName) ||
    toString(raw.branch_name) ||
    toString(raw.branch) ||
    null;

  const contactNumber =
    toString(raw.contactNumber) ||
    toString(raw.contact_number) ||
    toString(raw.contact) ||
    toString(raw.phone) ||
    null;

  const email = toString(raw.email) || null;

  return {
    id: raw.id !== undefined ? String(raw.id) : `${customerCode}-${index}`,
    customerCode,
    customerName,
    tagging,
    minDaysNoSales,
    lastSalesDate,
    totalHistoricalSales,
    salesmanName,
    branchName,
    contactNumber,
    email,
    raw,
  };
}

export async function fetchLostCustomerList(
  filters: LostCustomerFilters,
  signal?: AbortSignal
): Promise<LostCustomerRecord[]> {
  const query = new URLSearchParams();
  if (filters.customerCode) query.append("customerCode", filters.customerCode);
  if (filters.customerName) query.append("customerName", filters.customerName);
  if (filters.tagging && filters.tagging !== "ALL")
    query.append("tagging", filters.tagging);
  if (filters.minDaysNoSales)
    query.append("minDaysNoSales", filters.minDaysNoSales);

  const qs = query.toString();
  const url = `${API_BASE}${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    signal,
    cache: "no-store",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.error ||
        errorData?.message ||
        `Failed to fetch lost customer list (${res.status})`
    );
  }

  const json = await res.json();

  let rawList: Record<string, unknown>[] = [];
  if (Array.isArray(json)) {
    rawList = json;
  } else if (json && Array.isArray(json.data)) {
    rawList = json.data;
  } else if (json && Array.isArray(json.items)) {
    rawList = json.items;
  } else if (json && typeof json === "object") {
    // Single object or wrapped
    rawList = [json];
  }

  return rawList.map((item, idx) => normalizeLostCustomerRecord(item, idx));
}
