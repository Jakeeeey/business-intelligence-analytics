export type DirectusListResponse<T> = { data: T[] };
export type DirectusItemResponse<T> = { data: T };

export type StatusCode = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";

export type TargetSettingSupplierRow = {
  id: number;
  tsd_id: number | null;
  supplier_id: number;
  fiscal_period: string; // "YYYY-MM-01"
  target_amount: number;
  status: StatusCode;
  created_by: number | null;
  created_at: string | null;
};

export type TargetSettingSalesmanRow = {
  id: number;
  ts_supervisor_id: number | null;
  salesman_id: number;
  supplier_id: number;
  fiscal_period: string; // "YYYY-MM-01"
  target_amount: number; // Salesman Target Share
  status: StatusCode;
  created_by: number | null;
  created_at: string | null;
};

export type SalesmanRow = {
  id: number;
  salesman_name: string | null;
  salesman_code: string | null;
  isActive?: number | boolean | null;
  division_id?: number | null;
};

export type SupplierRow = {
  id: number;
  supplier_name?: string | null;
  supplier_shortcut?: string | null;
  supplier_type?: string | null;
  isActive?: number | boolean | null;
};

export type UpsertSalesmanAllocationPayload = {
  ts_supervisor_id: number | null; // (we keep it, but for now we save null)
  salesman_id: number;
  supplier_id: number;
  fiscal_period: string;
  target_amount: number;
  status: StatusCode;
};
