export type PunctualityStatus =
  | "On Time"
  | "Grace Period"
  | "Moderate Late"
  | "Severe Late"
  | "Undertime"
  | "Absent"
  | "On Leave";

export interface IntercompanyPunctualityRecord {
  id: string; // `${companyId}-${userId}-${logDate}`
  userId: number;
  employeeId: string;
  name: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  contact: string;
  companyId: number;
  companyName: string;
  companyCode: string;
  department: string;
  departmentId: number | null;
  position: string;
  gender: string;
  avatar: string | null;
  punctualityStatus: PunctualityStatus;
  scheduledTimeIn: string; // e.g. "08:00 AM"
  timeIn: string | null;
  timeOut: string | null;
  rawTimeIn?: string | null;
  rawTimeOut?: string | null;
  delayMinutes: number; // 0 if on time or early, > 0 if late
  undertimeMinutes: number; // > 0 if left early
  logDate: string;
  approveStatus: string | null;
  imageTimeIn: string | null;
  imageTimeOut: string | null;
  hasFiledLeave: boolean;
  leaveStatus: "approved" | "pending" | null;
  leaveType?: string | null;
  leaveReason?: string | null;
  leaveDates?: string | null;
}

export interface CompanyPunctualitySummary {
  companyId: number;
  companyName: string;
  companyCode: string;
  status: "ACTIVE" | "OFFLINE" | "INACTIVE";
  totalEmployees: number;
  totalLogs: number;
  onTimeCount: number;
  gracePeriodCount: number;
  moderateLateCount: number;
  severeLateCount: number;
  totalLateCount: number;
  undertimeCount: number;
  punctualityRate: number; // percentage (0-100)
  avgDelayMinutes: number;
}

export interface DepartmentPunctualitySummary {
  department: string;
  totalLogs: number;
  onTimeCount: number;
  lateCount: number;
  punctualityRate: number;
  avgDelayMinutes: number;
}

export interface PunctualityLeaderboardItem {
  userId: number;
  employeeId: string;
  name: string;
  companyCode: string;
  companyName: string;
  department: string;
  position: string;
  avatar: string | null;
  totalDays: number;
  onTimeDays: number;
  lateDays: number;
  punctualityRate: number;
  avgDelayMinutes: number;
  earliestArrival?: string | null;
}

export interface IntercompanyPunctualityKpis {
  totalStaff: number;
  totalPresentLogs: number;
  onTimeCount: number;
  totalLateCount: number;
  gracePeriodCount: number;
  moderateLateCount: number;
  severeLateCount: number;
  undertimeCount: number;
  overallPunctualityRate: number;
  averageDelayMinutes: number;
  totalDelayMinutes: number;
  activeCompaniesCount: number;
  totalCompaniesCount: number;
  totalDays?: number;
  mostPunctualCompany?: string;
  mostPunctualDepartment?: string;
}

export interface CompanyFilterOption {
  companyId: number;
  companyName: string;
  companyCode: string;
}

export interface DailyPunctualityTrendPoint {
  date: string;
  displayDate: string;
  totalLogs: number;
  onTimeCount: number;
  lateCount: number;
  punctualityRate: number;
  avgDelayMinutes: number;
}

export interface PunctualityDistributionSegment {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface IntercompanyPunctualityData {
  date: string;
  startDate: string;
  endDate: string;
  dates: string[];
  kpis: IntercompanyPunctualityKpis;
  companySummaries: CompanyPunctualitySummary[];
  departmentSummaries: DepartmentPunctualitySummary[];
  dailyTrends: DailyPunctualityTrendPoint[];
  distribution: PunctualityDistributionSegment[];
  topPunctual: PunctualityLeaderboardItem[];
  frequentLate: PunctualityLeaderboardItem[];
  records: IntercompanyPunctualityRecord[];
  companiesList: CompanyFilterOption[];
  departmentsList: string[];
  statusesList: string[];
}

export interface IntercompanyPunctualityFilters {
  date: string;
  startDate: string;
  endDate: string;
  dates?: string[];
  companyIds: string[];
  departments: string[];
  punctualityStatus: string; // "ALL" | PunctualityStatus
  search: string;
}

export type PunctualitySortField =
  | "name"
  | "employeeId"
  | "company"
  | "department"
  | "logDate"
  | "timeIn"
  | "punctualityStatus"
  | "delayMinutes";

export type PunctualitySortOrder = "asc" | "desc";
