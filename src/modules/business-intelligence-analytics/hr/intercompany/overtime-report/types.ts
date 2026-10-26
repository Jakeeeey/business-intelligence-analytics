export type RequestStatus = "approved" | "pending" | "rejected";

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
  schedTimeout: string | null;
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

export interface EmployeeOvertimeSummary {
  userId: number;
  employeeId: string;
  name: string;
  companyId: number;
  companyName: string;
  companyCode: string;
  department: string;
  position: string;
  avatar: string | null;
  totalOtRequests: number;
  approvedOtRequests: number;
  pendingOtRequests: number;
  rejectedOtRequests: number;
  totalOtMinutes: number;
  totalOtHours: number;
  approvedOtMinutes: number;
  approvedOtHours: number;
  approvalRate: number; // percentage
}

export interface CompanyOvertimeSummary {
  companyId: number;
  companyName: string;
  companyCode: string;
  status: "ACTIVE" | "OFFLINE" | "INACTIVE";
  totalEmployees: number;
  totalOtRequests: number;
  approvedOtRequests: number;
  pendingOtRequests: number;
  rejectedOtRequests: number;
  totalOtMinutes: number;
  totalOtHours: number;
  approvedOtMinutes: number;
  approvedOtHours: number;
  otApprovalRate: number; // percentage
}

export interface IntercompanyOvertimeKpis {
  totalEmployees: number;
  totalOtMinutes: number;
  totalOtHours: number;
  totalOtRequests: number;
  totalApprovedOtRequests: number;
  totalApprovedOtMinutes: number;
  totalApprovedOtHours: number;
  totalPendingOtRequests: number;
  totalRejectedOtRequests: number;
  otApprovalRate: number; // percentage
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
  approvedRequestsCount: number;
}

export interface StatusDistributionSegment {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface IntercompanyOvertimeData {
  startDate: string;
  endDate: string;
  dates: string[];
  kpis: IntercompanyOvertimeKpis;
  companySummaries: CompanyOvertimeSummary[];
  employeeSummaries: EmployeeOvertimeSummary[];
  dailyTrends: DailyOtTrendPoint[];
  statusDistribution: StatusDistributionSegment[];
  overtimeRecords: IntercompanyOvertimeRecord[];
  companiesList: CompanyFilterOption[];
  departmentsList: string[];
  statusesList: string[];
}

export interface IntercompanyOvertimeFilters {
  startDate: string;
  endDate: string;
  dates?: string[];
  companyIds: string[];
  departments: string[];
  status: string; // "ALL" | RequestStatus
  search: string;
}

export type OvertimeSortField =
  | "name"
  | "employeeId"
  | "company"
  | "department"
  | "totalOtHours"
  | "approvedOtHours"
  | "totalOtRequests"
  | "approvedOtRequests"
  | "approvalRate";

export type OvertimeSortOrder = "asc" | "desc";
