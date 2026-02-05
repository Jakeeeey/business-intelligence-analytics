import type { SalesReportLookups, SalesReportResponse } from "../types";

async function http<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.success) {
    const msg = data?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data.data as T;
}

export async function getLookups() {
  return http<SalesReportLookups>("/api/bia/sales-report?mode=lookups");
}

export async function getSalesReport(params: {
  year: number;
  months: number[]; // multi
  salesman_ids: number[]; // accounts multi
}) {
  const sp = new URLSearchParams();
  sp.set("mode", "report");
  sp.set("year", String(params.year));
  sp.set("months", params.months.join(","));
  sp.set("salesman_ids", params.salesman_ids.join(","));
  return http<SalesReportResponse>(`/api/bia/sales-report?${sp.toString()}`);
}
