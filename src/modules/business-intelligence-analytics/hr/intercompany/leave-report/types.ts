export type RequestStatus = "approved" | "pending" | "rejected";
export type RecordType = "overtime" | "leave";

export interface IntercompanyOvertimeRecord {
  id: string; // `${companyId}-ot-${overtimeId}`
  overtimeId: number;
  userId: number;
  employeeId: string;
  name: string;
  firstName: string;
  lastName: string;
  companyId: number;
  companyName: string;
  companyCode: string;
  department: string;
  departmentId: number | null;
  position: string;
  gender: string;
  avatar: string | null;
  requestDate: string;
  otFrom: string | null;
  otTo: string | null;
  durationMinutes: number;
  durationHours: number;
  purpose: string;
  remarks: string;
  status: RequestStatus;
  currentApprovalLevel: number;
  approverId: number | null;
  approvedAt: string | null;
  filedAt: string | null;
}

export interface IntercompanyLeaveRecord {
  id: string; // `${companyId}-leave-${leaveId}`
  leaveId: number;
  userId: number;
  employeeId: string;
  name: string;
  firstName: string;
  lastName: string;
  companyId: number;
  companyName: string;
  companyCode: string;
  department: string;
  departmentId: number | null;
  position: string;
  gender: string;
  avatar: string | null;
  leaveType: string;
  leaveStart: string;
  leaveEnd: string;
  totalDays: number;
  reason: string;
  remarks: string | null;
  status: RequestStatus;
  currentApprovalLevel: number;
  approverId: number | null;
  approvedAt: string | null;
  filedAt: string | null;
  isPaid: boolean;
}

export interface EmployeeLeaveAndOtSummary {
  userId: number;
  employeeId: string;
  name: string;
  companyId: number;
  companyName: string;
  companyCode: string;
  department: string;
  position: string;
  avatar: string | null;
  // Overtime metrics
  totalOtRequests: number;
  approvedOtRequests: number;
  pendingOtRequests: number;
  rejectedOtRequests: number;
  totalOtMinutes: number;
  totalOtHours: number;
  approvedOtMinutes: number;
  approvedOtHours: number;
  // Leave metrics
  totalLeaveRequests: number;
  approvedLeaveRequests: number;
  pendingLeaveRequests: number;
  rejectedLeaveRequests: number;
  totalLeaveDays: number;
  approvedLeaveDays: number;
}

export interface CompanyLeaveOtSummary {
  companyId: number;
  companyName: string;
  companyCode: string;
  status: "ACTIVE" | "OFFLINE" | "INACTIVE";
  totalEmployees: number;
  // Overtime
  totalOtRequests: number;
  approvedOtRequests: number;
  pendingOtRequests: number;
  totalOtMinutes: number;
  totalOtHours: number;
  approvedOtMinutes: number;
  approvedOtHours: number;
  otApprovalRate: number; // %
  // Leaves
  totalLeaveRequests: number;
  approvedLeaveRequests: number;
  totalLeaveDays: number;
  approvedLeaveDays: number;
}

export interface IntercompanyLeaveKpis {
  totalEmployees: number;
  // Overtime metrics (User explicitly requested)
  totalOtMinutes: number;
  totalOtHours: number;
  totalOtRequests: number;
  totalApprovedOtRequests: number;
  totalApprovedOtMinutes: number;
  totalApprovedOtHours: number;
  totalPendingOtRequests: number;
  totalRejectedOtRequests: number;
  otApprovalRate: number; // percentage
  // Leave metrics
  totalLeaveRequests: number;
  totalApprovedLeaveRequests: number;
  totalApprovedLeaveDays: number;
  totalPendingLeaveRequests: number;
  // Summary tags
  activeCompaniesCount: number;
  totalCompaniesCount: number;
  topOtEmployee?: string;
  topOtCompany?: string;
}

export interface CompanyFilterOption {
  companyId: number;
  companyName: string;
  companyCode: string;
}

export interface DailyOtTrendPoint {
  date: string;
  displayDate: string;
  totalOtMinutes: number;
  totalOtHours: number;
  approvedOtMinutes: number;
  approvedOtHours: number;
  otRequestsCount: number;
  leaveRequestsCount: number;
}

export interface StatusDistributionSegment {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface IntercompanyLeaveData {
  startDate: string;
  endDate: string;
  dates: string[];
  kpis: IntercompanyLeaveKpis;
  companySummaries: CompanyLeaveOtSummary[];
  employeeSummaries: EmployeeLeaveAndOtSummary[];
  dailyTrends: DailyOtTrendPoint[];
  statusDistribution: StatusDistributionSegment[];
  overtimeRecords: IntercompanyOvertimeRecord[];
  leaveRecords: IntercompanyLeaveRecord[];
  companiesList: CompanyFilterOption[];
  departmentsList: string[];
  statusesList: string[];
}

export interface IntercompanyLeaveFilters {
  startDate: string;
  endDate: string;
  dates?: string[];
  companyIds: string[];
  departments: string[];
  status: string; // "ALL" | RequestStatus
  typeFilter: "ALL" | "overtime" | "leave";
  search: string;
}

export type LeaveSortField =
  | "name"
  | "employeeId"
  | "company"
  | "department"
  | "totalOtHours"
  | "approvedOtHours"
  | "totalOtRequests"
  | "approvedOtRequests"
  | "approvedLeaveDays";

export type LeaveSortOrder = "asc" | "desc";
