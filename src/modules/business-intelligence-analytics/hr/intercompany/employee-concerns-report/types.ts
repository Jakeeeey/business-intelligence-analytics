export type ConcernStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "UNDER_REVIEW"
  | "RESOLVED"
  | "CLOSED"
  | "DISMISSED"
  | string;

export interface IntercompanyConcernRecord {
  id: string; // `${companyId}-${concernId}`
  concernId: number;
  userId: number | null;
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
  subjectOfConcern: string;
  concern: string;
  isAnonymous: boolean;
  status: ConcernStatus;
  createdAt: string;
  createdAtFormatted: string;
  createdBy: number | null;
  createdByName?: string | null;
  category: string;
}

export interface CompanyConcernsSummary {
  companyId: number;
  companyName: string;
  companyCode: string;
  status: "ACTIVE" | "OFFLINE" | "INACTIVE";
  totalConcerns: number;
  pendingCount: number;
  inReviewCount: number;
  resolvedCount: number;
  closedCount: number;
  anonymousCount: number;
  resolutionRate: number;
  sharePercentage: number;
}

export interface DepartmentConcernsSummary {
  department: string;
  totalConcerns: number;
  pendingCount: number;
  resolvedCount: number;
  companiesCount: number;
  percentage: number;
}

export interface ConcernDistributionSegment {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ConcernTrendPoint {
  date: string;
  displayDate: string;
  totalCount: number;
  pendingCount: number;
  resolvedCount: number;
}

export interface IntercompanyConcernsKpis {
  totalConcerns: number;
  pendingCount: number;
  inReviewCount: number;
  resolvedCount: number;
  closedCount: number;
  anonymousCount: number;
  anonymousPercentage: number;
  resolutionRate: number;
  activeCompaniesCount: number;
  totalCompaniesCount: number;
  companiesWithConcernsCount: number;
  topConcernCompany: string;
  topConcernDepartment: string;
}

export interface CompanyFilterOption {
  companyId: number;
  companyName: string;
  companyCode: string;
}

export interface IntercompanyConcernsData {
  generatedAt: string;
  kpis: IntercompanyConcernsKpis;
  companySummaries: CompanyConcernsSummary[];
  departmentSummaries: DepartmentConcernsSummary[];
  statusDistribution: ConcernDistributionSegment[];
  categoryDistribution: ConcernDistributionSegment[];
  trends: ConcernTrendPoint[];
  records: IntercompanyConcernRecord[];
  companiesList: CompanyFilterOption[];
  departmentsList: string[];
  statusesList: string[];
  categoriesList: string[];
}

export interface IntercompanyConcernsFilters {
  companyIds: string[];
  departments: string[];
  status: string; // "ALL" | specific status
  anonymousFilter: "ALL" | "ANONYMOUS" | "IDENTIFIED";
  category: string; // "ALL" | specific category
  startDate: string;
  endDate: string;
  search: string;
}

export type ConcernsSortField =
  | "id"
  | "createdAt"
  | "name"
  | "company"
  | "department"
  | "subject"
  | "status"
  | "isAnonymous";

export type ConcernsSortOrder = "asc" | "desc";

