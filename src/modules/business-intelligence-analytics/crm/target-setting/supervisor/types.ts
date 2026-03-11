export type StatusCode = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | string;

export type SupplierRow = {
  id: number;
  supplier_name: string;
  supplier_type?: string;
  isActive?: number | boolean;
} & Record<string, unknown>;

export type SalesmanRow = {
  id: number;
  salesman_name: string;
  salesman_code?: string;
  isActive?: number | boolean;
  division_id?: number | null;
} & Record<string, unknown>;

export type TargetSettingSupplierRow = {
  id: number;
  fiscal_period: string; // "YYYY-MM-01"
  supplier_id: number;
  target_amount: number;
  status: StatusCode;
  tsd_id: number; // links to target_setting_division
  created_at?: string | null;
  created_by?: number | null;
} & Record<string, unknown>;

export type TargetSettingSalesmanRow = {
  id: number;
  fiscal_period: string; // "YYYY-MM-01"
  supplier_id: number;
  salesman_id: number;
  target_amount: number;
  status: StatusCode;

  // IMPORTANT: In Directus this is M2O to target_setting_supervisor.id
  ts_supervisor_id: number;

  created_at?: string | null;
  created_by?: number | null;
} & Record<string, unknown>;

export type UpsertSalesmanAllocationPayload = {
  fiscal_period: string;
  supplier_id: number;
  salesman_id: number;
  target_amount: number;
  status: StatusCode;
  // server injects ts_supervisor_id
};

/* -------- Hierarchy log (NEW) -------- */
export type TargetSettingExecutiveRow = {
  id: number;
  fiscal_period: string;
  target_amount: number;
  status: StatusCode;
} & Record<string, unknown>;

export type TargetSettingDivisionRow = {
  id: number;
  fiscal_period: string;
  target_amount: number;
  status: StatusCode;

  // optional (depends on your schema)
  division_id?: number | null;
  division_name?: string | null;
} & Record<string, unknown>;

export type HierarchyLogRow = {
  key: string;
  creatorRole: "Executive" | "Div Manager";
  context: string;
  targetAmount: number;
  status: StatusCode;
};
