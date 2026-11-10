export type ResignationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN"
  | "COMPLETED"
  | "RECORDED"
  | string;

export type ResignationSource = "resignation_request" | "user_resignation";

export interface IntercompanyResignationRecord {
  id: string; // `${companyId}-${source}-${recordId}`
  recordId: number;
  source: ResignationSource;
  userId: number;
  employeeId: string;
  name: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  contact: string;
  avatar: string | null;
  position: string;
  department: string;
  departmentId: number | null;
  companyId: number;
  companyName: string;
  companyCode: string;
  companyDirectusUrl: string;
  filingDate: string; // ISO / YYYY-MM-DD
  filingDateFormatted: string;
  resignationDate: string; // Effective last day
  resignationDateFormatted: string;
  noticeDays: number;
  noticeCategory: "30+ Days (Compliant)" | "15-29 Days" | "< 15 Days" | "Immediate / Past";
  reason: string;
  reasonCategory: string;
  status: ResignationStatus;
  attachmentUuid?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  attachmentPath?: string | null;
  attachmentUrl?: string | null;
  hrRemarks?: string | null;
  reviewedBy?: number | null;
  reviewerName?: string | null;
  reviewedAt?: string | null;
  reviewedAtFormatted?: string | null;
  dateOfHire?: string | null;
  tenureMonths?: number | null;
  tenureFormatted?: string | null;
  createdAt: string;
}

export interface CompanyResignationSummary {
  companyId: number;
  companyName: string;
  companyCode: string;
  status: "ACTIVE" | "OFFLINE" | "INACTIVE";
  totalResignations: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  completedCount: number;
  avgNoticeDays: number;
  complianceRate: number; // % with >= 30 days notice
  totalEmployees: number;
  turnoverRate: number; // percentage
  sharePercentage: number;
}

export interface DepartmentResignationSummary {
  department: string;
  totalResignations: number;
  pendingCount: number;
  approvedCount: number;
  percentage: number;
}

export interface ReasonDistributionSegment {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface NoticeDistributionSegment {
  range: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ResignationTrendPoint {
  date: string;
  displayDate: string;
  totalCount: number;
  pendingCount: number;
  approvedCount: number;
}

export interface IntercompanyResignationKpis {
  totalResignations: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  completedCount: number;
  avgNoticeDays: number;
  compliantNoticeRate: number; // % with notice >= 30 days
  totalEmployees: number;
  turnoverRate: number;
  activeCompaniesCount: number;
  totalCompaniesCount: number;
  companiesWithResignationsCount: number;
  topTurnoverCompany: string;
  topTurnoverDepartment: string;
  topResignationReason: string;
}

export interface CompanyFilterOption {
  companyId: number;
  companyName: string;
  companyCode: string;
}

export interface IntercompanyResignationData {
  records: IntercompanyResignationRecord[];
  kpis: IntercompanyResignationKpis;
  companySummaries: CompanyResignationSummary[];
  departmentSummaries: DepartmentResignationSummary[];
  reasonDistribution: ReasonDistributionSegment[];
  noticeDistribution: NoticeDistributionSegment[];
  trends: ResignationTrendPoint[];
  companies: CompanyFilterOption[];
  departments: string[];
  reasonCategories: string[];
  lastUpdated: string;
}

export interface ResignationFilters {
  company: string; // "ALL" or companyCode
  department: string; // "ALL" or department name
  status: string; // "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED"
  reasonCategory: string; // "ALL" or category
  noticeCategory: string; // "ALL" or category
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  search: string;
}

