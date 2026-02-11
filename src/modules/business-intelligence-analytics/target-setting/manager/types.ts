export type DirectusBool = { type: "Buffer"; data: number[] } | boolean | number | null;

export type TargetSettingExecutive = {
  id: number;
  created_by: number | null;
  target_amount: number;
  period_from: string; // YYYY-MM-DD
  period_to: string; // YYYY-MM-DD
  isApproved?: DirectusBool;
  created_at?: string | null;
  updated_at?: string | null;
};

export type DivisionRow = {
  division_id: number;
  division_name: string;
  division_code?: string | null;
  division_head_id?: number | null;
};

export type SupplierRow = {
  id: number;
  supplier_name: string;
  supplier_shortcut?: string | null;
  supplier_type?: "TRADE" | "NON_TRADE" | "NON-TRADE" | string | null;
  isActive?: number | null;
};

export type TargetSettingDivision = {
  id: number;
  tse_id: number;
  division_id: number;
  target_amount: number;
  created_by?: number | null;
  created_at?: string | null;
};

export type TargetSettingSupplier = {
  id: number;
  tsd_id: number;
  supplier_id: number;
  target_amount: number;
  created_by?: number | null;
  created_at?: string | null;
};

export type ManagerBootstrapResponse = {
  target_setting_executive: TargetSettingExecutive[];
  target_setting_division: TargetSettingDivision[];
  target_setting_supplier: TargetSettingSupplier[];
  division: DivisionRow[];
  suppliers: SupplierRow[];
};

export type CreateSupplierAllocationDto = {
  tsd_id: number;
  supplier_id: number;
  target_amount: number;
};

export type UpdateSupplierAllocationDto = {
  id: number;
  target_amount: number;
};

export type AllocationLogRole = "Executive" | "Div Manager";

export type AllocationLogRow = {
  id: string;
  creatorRole: AllocationLogRole;
  contextAssignedTo: string;
  detail: string;
  targetAmount: number;
  status: "Set" | "Approved" | "Pending";
};
