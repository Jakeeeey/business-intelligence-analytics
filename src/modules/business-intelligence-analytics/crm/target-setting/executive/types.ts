export type TargetStatus = 'DRAFT' | 'APPROVED' | 'REJECTED';

export interface TargetSettingExecutive {
  id: number;
  created_by?: number;
  target_amount: number;
  fiscal_period: string; // ISO Date string (YYYY-MM-DD)
  status: TargetStatus;
  created_at?: string;
  updated_at?: string;
}

export interface TargetSettingDivision {
  id: number;
  tse_id: number; // Parent: Executive Target
  division_id: number;
  target_amount: number;
  fiscal_period: string;
  status: TargetStatus;
  created_by?: number;
  created_at?: string;

  // Joined fields
  division_name?: string;
}

export interface TargetSettingSupplier {
  id: number;
  tsd_id: number; // Parent: Division Target
  supplier_id: number;
  target_amount: number;
  fiscal_period: string;
  status: TargetStatus;
  created_by?: number;
  created_at?: string;

  // Joined
  supplier_name?: string;
}

export interface TargetSettingSupervisor {
  id: number;
  tss_id: number; // Parent: Supplier Target
  supervisor_user_id: number; // Link to user table
  target_amount: number;
  fiscal_period: string;
  status: TargetStatus;
  created_by?: number;
  created_at?: string;

  // Joined
  supervisor_name?: string;
}

export interface TargetSettingSalesman {
  id: number;
  ts_supervisor_id: number; // Parent: Supervisor Target
  salesman_id: number;
  target_amount: number;
  fiscal_period: string;
  status: TargetStatus;
  created_by?: number;
  created_at?: string;
  supplier_id?: number;

  // Joined
  salesman_name?: string;
}

export interface Division {
  division_id: number;
  division_name: string;
  division_code?: string;
}

export interface CreateCompanyTargetDTO {
  target_amount: number;
  fiscal_period: string;
  created_by: number;
  status?: TargetStatus;
}

export interface CreateDivisionAllocationDTO {
  tse_id: number;
  division_id: number;
  target_amount: number;
  fiscal_period: string;
  created_by: number;
  status?: TargetStatus;
}
