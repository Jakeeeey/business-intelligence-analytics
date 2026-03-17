export interface AuditTrailEntry {
  id: string;
  fiscal_period: string;
  snapshot_timestamp: string;
  trigger_event: 'REJECTION' | 'REOPEN_TO_DRAFT' | 'APPROVAL' | 'MANUAL';
  triggered_by_user_id: string | null;
  approval_status: 'APPROVED' | 'REJECTED' | 'PENDING' | 'DRAFT' | null;
  total_approvers: number | null;
  approved_count: number | null;
  rejected_count: number | null;
  executive_data: string; // JSON string
  division_allocations: string | null; // JSON string
  supplier_allocations: string | null; // JSON string
  supervisor_allocations: string | null; // JSON string
  salesman_allocations: string | null; // JSON string
  approval_votes: string | null; // JSON string
  notes: string | null;
  date_created: string;
  user_created: string | null;
}

export interface AuditTrailFilters {
  page: number;
  limit: number;
  sort_by: string;
  sort_order: 'asc' | 'desc';
  search: string;
  fiscal_period: string;
  trigger_event: string;
}

export interface AuditTrailResponse {
  data: AuditTrailEntry[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
