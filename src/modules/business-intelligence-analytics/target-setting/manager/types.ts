export type TargetStatus = "DRAFT" | "SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED" | "SET";

export type AllocationCreatorRole = "Executive" | "Manager" | "Supervisor";

export type AllocationLogRow = {
  id: string;
  creatorRole: AllocationCreatorRole;
  contextAssignedTo: string;
  detail: string;
  targetAmount: number;
  status: TargetStatus;
};

export type TargetSettingExecutive = {
  id: number;
  created_by: number | null;
  target_amount: number;
  fiscal_period: string; // YYYY-MM-DD
  status: TargetStatus;
  created_at: string | null;
  updated_at: string | null;
};

export type TargetSettingDivision = {
  id: number;
  tse_id: number;
  division_id: number;
  target_amount: number;
  created_by: number | null;
  created_at: string | null;

  // optional: if your Directus collection later adds these
  fiscal_period?: string | null;
  status?: TargetStatus | null;
};

export type TargetSettingSupplier = {
  id: number;
  tsd_id: number;
  supplier_id: number;
  target_amount: number;
  created_by: number | null;
  created_at: string | null;

  fiscal_period: string | null;
  status: TargetStatus;
};

export type TargetSettingSupervisor = {
  id: number;
  tss_id: number; // FK to target_setting_supplier.id
  supervisor_user_id: number | null;
  target_amount: number;
  fiscal_period: string; // YYYY-MM-DD
  status: TargetStatus;
  created_by: number | null;
  created_at: string | null;
};

export type DivisionRow = {
  division_id: number;
  division_name: string;
};

export type SupplierRow = {
  id: number;
  supplier_name: string;
  supplier_type: string | null;
  isActive?: number | null;
};

export type UserRow = {
  user_id: number;
  user_fname: string | null;
  user_mname: string | null;
  user_lname: string | null;
  role: string | null;
  is_deleted?: any;
};

/**
 * ✅ New table for supervisor mapping by division
 * /items/supervisor_per_division
 */
export type SupervisorPerDivisionRow = {
  id: number;
  division_id: number;
  supervisor_id: number; // maps to user.user_id
  is_deleted: number; // 0/1
  created_at: string | null;
  created_by: number | null;
  updated_at: string | null;
  updated_by: number | null;
};

export type ManagerBootstrapResponse = {
  target_setting_executive: TargetSettingExecutive[];
  target_setting_division: TargetSettingDivision[];
  target_setting_supplier: TargetSettingSupplier[];
  target_setting_supervisor: TargetSettingSupervisor[];

  division: DivisionRow[];
  suppliers: SupplierRow[];
  users: UserRow[];

  // ✅ added
  supervisor_per_division: SupervisorPerDivisionRow[];
};
