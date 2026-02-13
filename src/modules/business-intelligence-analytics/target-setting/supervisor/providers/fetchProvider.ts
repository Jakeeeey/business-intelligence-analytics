import type {
  DirectusItemResponse,
  DirectusListResponse,
  SalesmanRow,
  SupplierRow,
  TargetSettingSalesmanRow,
  TargetSettingSupplierRow,
  UpsertSalesmanAllocationPayload,
} from "../types";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(path, {
    ...init,
    headers: { ...(init?.headers || {}), "Content-Type": "application/json" },
    cache: "no-store",
  });

  const text = await r.text().catch(() => "");
  const data = text
    ? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return {};
        }
      })()
    : {};

  if (!r.ok) {
    const msg =
      data?.errors?.[0]?.message ||
      data?.error ||
      `Request failed (${r.status})`;
    throw new Error(String(msg));
  }

  return data as T;
}

/**
 * ✅ NOW FILTERED by vos_access_token.sub (server does it)
 */
export async function listSalesmen(): Promise<SalesmanRow[]> {
  const res = await api<DirectusListResponse<SalesmanRow>>(
    `/api/bia/target-setting/supervisor?resource=salesmen&limit=-1`
  );
  return res.data ?? [];
}

export async function listSuppliers(): Promise<SupplierRow[]> {
  const res = await api<DirectusListResponse<SupplierRow>>(
    `/api/bia/target-setting/supervisor?resource=suppliers&limit=-1&filter[isActive][_eq]=1`
  );
  return res.data ?? [];
}

export async function listTargetSettingSuppliers(): Promise<TargetSettingSupplierRow[]> {
  const sp = new URLSearchParams();
  sp.set("resource", "ts_supplier");
  sp.set("limit", "-1");
  const res = await api<DirectusListResponse<TargetSettingSupplierRow>>(
    `/api/bia/target-setting/supervisor?${sp.toString()}`
  );
  return res.data ?? [];
}

export async function listSalesmanAllocations(params: {
  fiscal_period: string;
  supplier_id: number;
}): Promise<TargetSettingSalesmanRow[]> {
  const sp = new URLSearchParams();
  sp.set("resource", "allocations");
  sp.set("limit", "-1");
  sp.set("filter[fiscal_period][_eq]", params.fiscal_period);
  sp.set("filter[supplier_id][_eq]", String(params.supplier_id));

  const res = await api<DirectusListResponse<TargetSettingSalesmanRow>>(
    `/api/bia/target-setting/supervisor?${sp.toString()}`
  );
  return res.data ?? [];
}

export async function createSalesmanAllocation(payload: UpsertSalesmanAllocationPayload) {
  const res = await api<DirectusItemResponse<TargetSettingSalesmanRow>>(
    `/api/bia/target-setting/supervisor?resource=allocations`,
    { method: "POST", body: JSON.stringify(payload) }
  );
  return res.data;
}

export async function updateSalesmanAllocation(
  id: number,
  payload: Partial<UpsertSalesmanAllocationPayload>
) {
  const res = await api<DirectusItemResponse<TargetSettingSalesmanRow>>(
    `/api/bia/target-setting/supervisor?resource=allocations&id=${id}`,
    { method: "PATCH", body: JSON.stringify(payload) }
  );
  return res.data;
}

export async function deleteSalesmanAllocation(id: number) {
  await api<any>(
    `/api/bia/target-setting/supervisor?resource=allocations&id=${id}`,
    { method: "DELETE" }
  );
}
