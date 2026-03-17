"use client";

import type {
  SalesmanRow,
  SupplierRow,
  TargetSettingSupplierRow,
  TargetSettingSalesmanRow,
  UpsertSalesmanAllocationPayload,
  TargetSettingExecutiveRow,
  TargetSettingDivisionRow,
} from "../types";

/** ✅ NEW: division master row */
export type DivisionRow = {
  division_id: number;
  division_name: string;
  division_description?: string | null;
  division_code?: string | null;
  division_head?: string | null;
  division_head_id?: number | null;
  date_added?: string | null;
};

async function j<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data?.message ||
      data?.error ||
      data?.upstream_body?.errors?.[0]?.message ||
      "Request failed";
    throw new Error(msg);
  }
  return data as T;
}

const BASE = "/api/bia/crm/target-setting/supervisor";

export async function listSalesmen(): Promise<SalesmanRow[]> {
  const r = await j<{ data: SalesmanRow[] }>(`${BASE}?resource=salesmen`);
  return r.data ?? [];
}

export async function listSuppliers(): Promise<SupplierRow[]> {
  const r = await j<{ data: SupplierRow[] }>(`${BASE}?resource=suppliers&limit=-1`);
  return r.data ?? [];
}

export async function listTargetSettingSuppliers(): Promise<TargetSettingSupplierRow[]> {
  const r = await j<{ data: TargetSettingSupplierRow[] }>(`${BASE}?resource=ts_supplier&limit=-1`);
  return r.data ?? [];
}

/** ✅ NEW: division master list (division table) */
export async function listDivisions(): Promise<DivisionRow[]> {
  const r = await j<{ data: DivisionRow[] }>(`${BASE}?resource=divisions&limit=-1`);
  return r.data ?? [];
}

export async function listSalesmanAllocations(params: {
  fiscal_period: string;
  supplier_id: number;
}): Promise<TargetSettingSalesmanRow[]> {
  const qp = new URLSearchParams();
  qp.set("resource", "allocations");
  qp.set("limit", "-1");
  qp.set("filter[fiscal_period][_eq]", params.fiscal_period);
  qp.set("filter[supplier_id][_eq]", String(params.supplier_id));
  const r = await j<{ data: TargetSettingSalesmanRow[] }>(`${BASE}?${qp.toString()}`);
  return r.data ?? [];
}

export async function createSalesmanAllocation(payload: UpsertSalesmanAllocationPayload) {
  return j(`${BASE}?resource=allocations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateSalesmanAllocation(id: number, payload: UpsertSalesmanAllocationPayload) {
  const qp = new URLSearchParams();
  qp.set("resource", "allocations");
  qp.set("id", String(id));
  return j(`${BASE}?${qp.toString()}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteSalesmanAllocation(id: number) {
  const qp = new URLSearchParams();
  qp.set("resource", "allocations");
  qp.set("id", String(id));
  return j(`${BASE}?${qp.toString()}`, { method: "DELETE" });
}

/* ---------------- HIERARCHY (NEW) ---------------- */
export async function listExecutiveTargets(params: { fiscal_period: string }) {
  const qp = new URLSearchParams();
  qp.set("resource", "ts_executive");
  qp.set("limit", "-1");
  qp.set("filter[fiscal_period][_eq]", params.fiscal_period);
  const r = await j<{ data: TargetSettingExecutiveRow[] }>(`${BASE}?${qp.toString()}`);
  return r.data ?? [];
}

export async function readDivisionTarget(id: number) {
  const qp = new URLSearchParams();
  qp.set("resource", "ts_division");
  qp.set("id", String(id));
  const r = await j<{ data: TargetSettingDivisionRow }>(`${BASE}?${qp.toString()}`);
  return r.data;
}

export async function listSupplierTargetsByTsd(params: { fiscal_period: string; tsd_id: number }) {
  const qp = new URLSearchParams();
  qp.set("resource", "ts_supplier_by_tsd");
  qp.set("limit", "-1");
  qp.set("filter[fiscal_period][_eq]", params.fiscal_period);
  qp.set("filter[tsd_id][_eq]", String(params.tsd_id));
  const r = await j<{ data: TargetSettingSupplierRow[] }>(`${BASE}?${qp.toString()}`);
  return r.data ?? [];
}
