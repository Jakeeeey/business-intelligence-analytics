export type TargetStatus = 'DRAFT' | 'APPROVED' | 'REJECTED';

export interface TargetSettingExecutive {
  id: number;
  created_by?: number;
  target_amount: number;
  fiscal_period: string;
  status: TargetStatus;
  created_at?: string;
  updated_at?: string;
}

export interface TargetApprovalRecord {
  id: number;
  target_period: string;
  status: TargetStatus;
  target_record_id: number;
  target_setting_approver_id: number;
  approved_at?: string;
}

export interface TargetApprover {
  id: number;
  approver_id: number; // Links to user.user_id
  is_deleted: number;
}

export interface ApprovalModuleState {
  executiveTarget: TargetSettingExecutive | null;
  approvalRecord: TargetApprovalRecord | null;
  isApprover: boolean;
  approverId: number | null; // This is the ID from target_setting_approver table
}

export interface SubmitApprovalDTO {
  target_record_id: number;
  target_period: string;
  approver_id: number;
  status: 'APPROVED' | 'REJECTED';
}
