export type AttendanceStatus = "On Time" | "Late" | "Absent" | "On Leave";

export interface IntercompanyEmployeeRecord {
  id: string; // `${companyId}-${userId}`
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
  attendanceStatus: AttendanceStatus;
  timeIn: string | null;
  timeOut: string | null;
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

export interface CompanyAttendanceSummary {
  companyId: number;
  companyName: string;
  companyCode: string;
  status: "ACTIVE" | "OFFLINE" | "INACTIVE";
  totalEmployees: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  leaveCount: number; // approved leave
  filedLeaveCount: number; // all filed leaves (approved + pending)
  attendanceRate: number;
  punctualityRate: number;
}

export interface IntercompanyAttendanceKpis {
  totalWorkforce: number;
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  totalOnLeave: number; // approved
  totalFiledLeave: number; // approved + pending
  totalPendingLeave: number;
  overallAttendanceRate: number;
  overallPunctualityRate: number;
  activeCompaniesCount: number;
  totalCompaniesCount: number;
}

export interface CompanyFilterOption {
  companyId: number;
  companyName: string;
  companyCode: string;
}

export interface AttendanceStatusDonutSegment {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface IntercompanyAttendanceData {
  date: string;
  kpis: IntercompanyAttendanceKpis;
  companySummaries: CompanyAttendanceSummary[];
  records: IntercompanyEmployeeRecord[];
  companiesList: CompanyFilterOption[];
  departmentsList: string[];
  statusesList: string[];
}

export interface IntercompanyAttendanceFilters {
  date: string;
  companyId: string; // 'ALL' or string id
  department: string; // 'ALL' or department name
  attendanceStatus: string; // 'ALL' | 'Present' | 'On Time' | 'Late' | 'Absent' | 'On Leave' | 'Filed Leave'
  search: string;
}

export type SortField =
  | "name"
  | "companyName"
  | "department"
  | "position"
  | "attendanceStatus"
  | "timeIn"
  | "timeOut";

export type SortOrder = "asc" | "desc";
