export interface WorkforceMetrics {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  activeRatio: number; // percentage
  maleCount: number;
  femaleCount: number;
  regularCount: number;
  probationaryCount: number;
  casualContractualCount: number;
}

export interface AttendanceMetrics {
  totalLogs: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number; // percentage
}

export interface PunctualityMetrics {
  totalRecords: number;
  ontimeCount: number;
  lateCount: number;
  punctualityRate: number; // percentage
  avgLateMinutes: number;
}

export interface OvertimeMetrics {
  totalRequests: number;
  approvedHours: number;
  pendingHours: number;
  totalHours: number;
  approvalRate: number; // percentage
}

export interface ManpowerMetrics {
  totalRequisitions: number;
  headcountNeeded: number;
  headcountHired: number;
  fulfillmentRate: number; // percentage
  totalBudgetRequired: number;
  openPositions: number;
}

export interface ResignationMetrics {
  totalResignations: number;
  pendingCount: number;
  approvedCount: number;
  turnoverRate: number; // percentage
  compliantNoticeRate: number; // percentage
}

export interface EvaluationMetrics {
  totalEvaluations: number;
  avgScore: number;
  passRate: number; // percentage
  regularizedCount: number;
  predominantBand: string;
}

export interface ConcernsMetrics {
  totalConcerns: number;
  pendingCount: number;
  resolvedCount: number;
  resolutionRate: number; // percentage
  anonymousRate: number; // percentage
}

export interface CompanyMatrixRow {
  companyId: number;
  companyName: string;
  companyCode: string;
  status: "ACTIVE" | "OFFLINE" | "INACTIVE";
  headcount: number;
  attendanceRate: number;
  punctualityRate: number;
  overtimeHours: number;
  turnoverRate: number;
  openRequisitions: number;
  avgAppraisalScore: number;
  unresolvedConcerns: number;
  healthIndex: "Optimal" | "Moderate" | "Attention" | "Offline";
}

export type ActionCategory =
  | "CONCERN"
  | "RESIGNATION"
  | "MANPOWER"
  | "EVALUATION"
  | "OVERTIME";

export interface ActionCenterItem {
  id: string;
  category: ActionCategory;
  title: string;
  subtitle: string;
  companyCode: string;
  companyName: string;
  priority: "High" | "Medium" | "Low";
  date: string;
  dateFormatted: string;
  linkUrl: string;
}

export interface TalentFlowTrendPoint {
  date: string;
  displayDate: string;
  hiredCount: number;
  resignedCount: number;
  netChange: number;
}

export interface AttendancePunctualityTrendPoint {
  date: string;
  displayDate: string;
  attendanceRate: number;
  punctualityRate: number;
}

export interface CompanyDistributionShare {
  companyCode: string;
  companyName: string;
  headcount: number;
  percentage: number;
  color: string;
}

export interface ConcernsCategoryShare {
  category: string;
  count: number;
  percentage: number;
  color: string;
}

export interface IntercompanyDashboardData {
  workforce: WorkforceMetrics;
  attendance: AttendanceMetrics;
  punctuality: PunctualityMetrics;
  overtime: OvertimeMetrics;
  manpower: ManpowerMetrics;
  resignation: ResignationMetrics;
  evaluation: EvaluationMetrics;
  concerns: ConcernsMetrics;
  companyMatrix: CompanyMatrixRow[];
  actionItems: ActionCenterItem[];
  talentFlowTrends: TalentFlowTrendPoint[];
  attendanceTrends: AttendancePunctualityTrendPoint[];
  companyDistribution: CompanyDistributionShare[];
  concernsDistribution: ConcernsCategoryShare[];
  companiesList: { companyId: number; companyName: string; companyCode: string }[];
  lastUpdated: string;
}

export interface DashboardFilters {
  company: string; // "ALL" or companyCode
  dateRange: "today" | "week" | "month" | "quarter" | "year" | "all";
  startDate?: string;
  endDate?: string;
  search?: string;
}

