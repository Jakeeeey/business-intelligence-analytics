import { http } from "@/lib/http/client";
import type {
  TargetSettingExecutive,
  TargetSettingDivision,
  TargetSettingSupervisor,
  TargetSettingSupplier,
  TargetSettingSalesman,
  Division,
  CreateCompanyTargetDTO,
  CreateDivisionAllocationDTO
} from "../types";

// --- Executive / Company Target ---

export async function getLatestCompanyTarget(fiscalPeriod?: string): Promise<TargetSettingExecutive | null> {
  const params = fiscalPeriod ? { filter: { fiscal_period: { _eq: fiscalPeriod } }, limit: 1, sort: "-created_at" } : { limit: 1, sort: "-created_at" };
  const res = await http.get("/api/bia/target-setting/executive", { params, skipBaseUrl: true });
  const data = res.data?.data;
  return data && data.length > 0 ? (data[0] as TargetSettingExecutive) : null;
}

export async function upsertCompanyTarget(data: CreateCompanyTargetDTO): Promise<TargetSettingExecutive> {
  const res = await http.post("/api/bia/target-setting/executive", data, { skipBaseUrl: true });
  return res.data?.data as TargetSettingExecutive;
}

export async function updateCompanyTarget(id: number, data: Partial<CreateCompanyTargetDTO>): Promise<TargetSettingExecutive> {
  const res = await http.patch(`/api/bia/target-setting/executive/${id}`, data, { skipBaseUrl: true });
  return res.data?.data as TargetSettingExecutive;
}

export async function updateCompanyTargetStatus(id: number, status: string): Promise<TargetSettingExecutive> {
  const res = await http.patch(`/api/bia/target-setting/executive/${id}`, { status }, { skipBaseUrl: true });
  return res.data?.data as TargetSettingExecutive;
}

// --- Division Allocation ---

export async function getDivisionAllocations(tseId: number): Promise<TargetSettingDivision[]> {
  const res = await http.get("/api/bia/target-setting/executive", {
    params: {
      filter: { tse_id: { _eq: tseId } },
      scope: "division"
      // Removed fields: "*.*" as it might cause issues if relations aren't perfect.
      // We will join manually in hook if needed or rely on ID.
    },
    skipBaseUrl: true
  });
  return (res.data?.data ?? []) as TargetSettingDivision[];
}

export async function createDivisionAllocation(data: CreateDivisionAllocationDTO): Promise<TargetSettingDivision> {
  const res = await http.post("/api/bia/target-setting/executive", data, {
    params: { scope: "division" },
    skipBaseUrl: true
  });
  return res.data?.data as TargetSettingDivision;
}

export async function updateDivisionAllocation(id: number, data: Partial<CreateDivisionAllocationDTO>): Promise<TargetSettingDivision> {
  const res = await http.patch(`/api/bia/target-setting/executive/${id}`, data, {
    params: { scope: "division" },
    skipBaseUrl: true
  });
  return res.data?.data as TargetSettingDivision;
}

// --- Supplier Allocation ---

export async function getSupplierAllocations(tsdId?: number, fiscalPeriod?: string): Promise<TargetSettingSupplier[]> {
  const filter: any = {};
  if (tsdId) filter.tsd_id = { _eq: tsdId };
  if (fiscalPeriod) filter.fiscal_period = { _eq: fiscalPeriod };

  const res = await http.get("/api/bia/target-setting/executive", {
    params: { filter, scope: "supplier" },
    skipBaseUrl: true
  });
  return (res.data?.data ?? []) as TargetSettingSupplier[];
}

// --- Supervisor Allocation ---

export async function getSupervisorAllocations(tssId?: number, fiscalPeriod?: string): Promise<TargetSettingSupervisor[]> {
  const filter: any = {};
  if (tssId) filter.tss_id = { _eq: tssId };
  if (fiscalPeriod) filter.fiscal_period = { _eq: fiscalPeriod };

  const res = await http.get("/api/bia/target-setting/executive", {
    params: { filter, scope: "supervisor" },
    skipBaseUrl: true
  });
  return (res.data?.data ?? []) as TargetSettingSupervisor[];
}

// --- Salesman Allocation ---

export async function getSalesmanAllocations(tsSupervisorId?: number, fiscalPeriod?: string): Promise<TargetSettingSalesman[]> {
  const filter: any = {};
  if (tsSupervisorId) filter.ts_supervisor_id = { _eq: tsSupervisorId };
  if (fiscalPeriod) filter.fiscal_period = { _eq: fiscalPeriod };

  const res = await http.get("/api/bia/target-setting/executive", {
    params: { filter, scope: "salesman" },
    skipBaseUrl: true
  });
  return (res.data?.data ?? []) as TargetSettingSalesman[];
}

// --- Metadata ---

export async function getTestUser(): Promise<number> {
  const res = await http.get("/api/bia/metadata/users", { params: { limit: 1, fields: "user_id" }, skipBaseUrl: true });
  const data = res.data?.data;
  if (data && data.length > 0) {
    return data[0].user_id;
  }
  return 1; // Fallback
}


export async function getDivisions(): Promise<Division[]> {
  const res = await http.get("/api/bia/metadata/divisions", { skipBaseUrl: true });
  return (res.data?.data ?? []) as Division[];
}

export async function getSuppliers(): Promise<any[]> {
  const res = await http.get("/api/bia/metadata/suppliers", { skipBaseUrl: true });
  return res.data?.data ?? [];
}

export async function getSalesmen(): Promise<any[]> {
  const res = await http.get("/api/bia/metadata/salesmen", { skipBaseUrl: true });
  return res.data?.data ?? [];
}

export async function getAllUsers(): Promise<any[]> {
  const res = await http.get("/api/bia/metadata/users", { skipBaseUrl: true });
  return res.data?.data ?? [];
}
