export interface PhysicalInventoryRecord {
  id: number;
  ph_no: string;
  date_encoded: string;
  cutOff_date: string;
  starting_date: string;
  price_type: string;
  stock_type: string;
  branch_id: number;
  branch_name?: string;
  branch_code?: string;
  remarks: string;
  status: string;
  isComitted: boolean;
  committed_at: string | null;
  isCancelled: boolean;
  cancelled_at: string | null;
  is_scm: boolean;
  is_offset: boolean;
  total_amount: number;
  category_id: number;
  category_name?: string;
  encoder_id: number;
  encoder_name?: string;
}

export interface BranchLookup {
  id: number;
  name: string;
  code: string;
}

export interface PHAuditApiResponse {
  success: boolean;
  message?: string;
  data: PhysicalInventoryRecord[];
  branches: BranchLookup[];
  year: number;
  month: number; // 1-12
}

export interface CellSpan {
  record: PhysicalInventoryRecord;
  colSpan: number;
}

