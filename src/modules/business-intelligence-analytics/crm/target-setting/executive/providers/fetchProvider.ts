import type {
  TargetSettingExecutive,
  TargetSettingDivision,
  TargetSettingSupervisor,
  TargetSettingSupplier,
  TargetSettingSalesman,
  Division,
  CreateCompanyTargetDTO,
  CreateDivisionAllocationDTO,
} from "../types";

const API_BASE = "/api/bia/crm/target-setting/executive";

/**
 * Local request helper — uses native fetch against our own Next.js API routes.
 * Authentication is handled server-side via cookies; no client token needed.
 */
async function request<T>(method: string, endpoint: string, body?: Record<string, unknown>): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const res = await fetch(endpoint, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
  }

  if (res.status === 204) return {} as T;
  const json = await res.json();
  return (json.data !== undefined ? json.data : json) as T;
}

/**
 * Serialize nested filter objects into Directus-compatible query parameters.
 * e.g. { filter: { fiscal_period: { _eq: "2024" } } } → filter[fiscal_period][_eq]=2024
 */
function buildParams(params: Record<string, unknown>): URLSearchParams {
  const searchParams = new URLSearchParams();

  function serialize(obj: unknown, prefix: string) {
    if (obj === null || obj === undefined) return;
    if (typeof obj === "object" && !Array.isArray(obj)) {
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        serialize(value, prefix ? `${prefix}[${key}]` : key);
      }
    } else {
      searchParams.append(prefix, String(obj));
    }
  }

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "object" && !Array.isArray(value)) {
      serialize(value, key);
    } else {
      searchParams.append(key, String(value));
    }
  }

  return searchParams;
}

// --- Executive / Company Target ---

export async function getLatestCompanyTarget(fiscalPeriod?: string): Promise<TargetSettingExecutive | null> {
  const params: Record<string, unknown> = fiscalPeriod
    ? { filter: { fiscal_period: { _eq: fiscalPeriod } }, limit: 1, sort: "-created_at" }
    : { limit: 1, sort: "-created_at" };

  const qs = buildParams(params).toString();
  const res = await fetch(`${API_BASE}?${qs}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  const data = json?.data;
  return data && data.length > 0 ? (data[0] as TargetSettingExecutive) : null;
}

export async function upsertCompanyTarget(data: CreateCompanyTargetDTO): Promise<TargetSettingExecutive> {
  return request<TargetSettingExecutive>("POST", API_BASE, data as unknown as Record<string, unknown>);
}

export async function updateCompanyTarget(id: number, data: Partial<CreateCompanyTargetDTO>): Promise<TargetSettingExecutive> {
  return request<TargetSettingExecutive>("PATCH", `${API_BASE}/${id}`, data as unknown as Record<string, unknown>);
}

export async function updateCompanyTargetStatus(id: number, status: string): Promise<TargetSettingExecutive> {
  return request<TargetSettingExecutive>("PATCH", `${API_BASE}/${id}`, { status });
}

// --- Division Allocation ---

export async function getDivisionAllocations(tseId: number): Promise<TargetSettingDivision[]> {
  const params = buildParams({ filter: { tse_id: { _eq: tseId } }, scope: "division" });
  const res = await fetch(`${API_BASE}?${params.toString()}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  return (json?.data ?? []) as TargetSettingDivision[];
}

export async function createDivisionAllocation(data: CreateDivisionAllocationDTO): Promise<TargetSettingDivision> {
  const params = new URLSearchParams({ scope: "division" });
  return request<TargetSettingDivision>("POST", `${API_BASE}?${params.toString()}`, data as unknown as Record<string, unknown>);
}

export async function updateDivisionAllocation(id: number, data: Partial<CreateDivisionAllocationDTO>): Promise<TargetSettingDivision> {
  const params = new URLSearchParams({ scope: "division" });
  return request<TargetSettingDivision>("PATCH", `${API_BASE}/${id}?${params.toString()}`, data as unknown as Record<string, unknown>);
}

// --- Supplier Allocation ---

export async function getSupplierAllocations(tsdId?: number, fiscalPeriod?: string): Promise<TargetSettingSupplier[]> {
  const filter: Record<string, unknown> = {};
  if (tsdId) filter.tsd_id = { _eq: tsdId };
  if (fiscalPeriod) filter.fiscal_period = { _eq: fiscalPeriod };

  const params = buildParams({ filter, scope: "supplier" });
  const res = await fetch(`${API_BASE}?${params.toString()}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  return (json?.data ?? []) as TargetSettingSupplier[];
}

// --- Supervisor Allocation ---

export async function getSupervisorAllocations(tssId?: number, fiscalPeriod?: string): Promise<TargetSettingSupervisor[]> {
  const filter: Record<string, unknown> = {};
  if (tssId) filter.tss_id = { _eq: tssId };
  if (fiscalPeriod) filter.fiscal_period = { _eq: fiscalPeriod };

  const params = buildParams({ filter, scope: "supervisor" });
  const res = await fetch(`${API_BASE}?${params.toString()}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  return (json?.data ?? []) as TargetSettingSupervisor[];
}

// --- Salesman Allocation ---

export async function getSalesmanAllocations(tsSupervisorId?: number, fiscalPeriod?: string): Promise<TargetSettingSalesman[]> {
  const filter: Record<string, unknown> = {};
  if (tsSupervisorId) filter.ts_supervisor_id = { _eq: tsSupervisorId };
  if (fiscalPeriod) filter.fiscal_period = { _eq: fiscalPeriod };

  const params = buildParams({ filter, scope: "salesman" });
  const res = await fetch(`${API_BASE}?${params.toString()}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  return (json?.data ?? []) as TargetSettingSalesman[];
}

// --- Metadata ---

export async function getTestUser(): Promise<number> {
  const params = new URLSearchParams({ limit: "1", fields: "user_id" });
  const res = await fetch(`/api/bia/crm/target-setting/metadata/users?${params.toString()}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  const data = json?.data;
  if (data && data.length > 0) {
    return data[0].user_id;
  }
  return 1; // Fallback
}

export async function getDivisions(): Promise<Division[]> {
  const res = await fetch("/api/bia/crm/target-setting/metadata/divisions", {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  return (json?.data ?? []) as Division[];
}

export async function getSuppliers(): Promise<Record<string, unknown>[]> {
  const res = await fetch("/api/bia/crm/target-setting/metadata/suppliers", {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  return json?.data ?? [];
}

export async function getSalesmen(): Promise<Record<string, unknown>[]> {
  const res = await fetch("/api/bia/crm/target-setting/metadata/salesmen", {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  return json?.data ?? [];
}

export async function getAllUsers(): Promise<Record<string, unknown>[]> {
  const params = new URLSearchParams({ limit: "-1" });
  const res = await fetch(`/api/bia/crm/target-setting/metadata/users?${params.toString()}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  return json?.data ?? [];
}
