export type ManpowerRequestStatus = "Approved" | "Draft" | "Rejected" | string;

export type ManpowerPurpose = "New Position" | "Additional" | "Replacement" | string;

export type EmploymentType = "Regular" | "Seasonal" | "Reliever" | "Others" | string;

export type RecommendationStatus =
  | "Recommended"
  | "Approved"
  | "Hired"
  | "Rejected"
  | "Withdrawn"
  | string;

export interface ManpowerCandidateRecommendation {
  id: number;
  applicantId: number;
  applicantName: string;
  positionAppliedFor?: string | null;
  applicantStatus?: string | null;
  status: RecommendationStatus;
  recommendationNotes?: string | null;
  recommendedBy?: number | null;
  recommendedByName?: string | null;
  recommendedAt?: string | null;
  recommendedAtFormatted?: string | null;
  decisionBy?: number | null;
  decisionByName?: string | null;
  decisionAt?: string | null;
  decisionAtFormatted?: string | null;
  decisionNotes?: string | null;
}

export interface IntercompanyManpowerRecord {
  id: string; // `${companyId}-${requestId}`
  requestId: number;
  requestNo: string;
  companyId: number;
  companyName: string;
  companyCode: string;
  companyDirectusUrl: string;
  position: string;
  departmentId: number | null;
  department: string;
  divisionId: number | null;
  division: string;
  divisionCode?: string | null;
  noManpowerNeeded: number;
  purpose: ManpowerPurpose;
  replacementName?: string | null;
  employmentType: EmploymentType;
  employmentOthers?: string | null;
  reasonJustification?: string | null;
  qualification?: string | null;
  qualificationDescription?: string | null;
  applicantName?: string | null;
  rate: number;
  rateFormatted: string;
  totalEstimatedBudget: number;
  status: ManpowerRequestStatus;
  requestedBy?: number | null;
  requestedByName?: string | null;
  recommendingApproval?: number | null;
  recommendingApprovalName?: string | null;
  notedBy?: number | null;
  notedByName?: string | null;
  approvedBy?: number | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  approvedAtFormatted?: string | null;
  rejectedBy?: number | null;
  rejectedByName?: string | null;
  rejectedAt?: string | null;
  rejectedAtFormatted?: string | null;
  createdAt: string;
  createdAtFormatted: string;
  recommendations: ManpowerCandidateRecommendation[];
  hiredCount: number;
  fulfillmentRate: number; // percentage
  isFulfilled: boolean;
}

export interface CompanyManpowerSummary {
  companyId: number;
  companyName: string;
  companyCode: string;
  status: "ACTIVE" | "OFFLINE" | "INACTIVE";
  totalRequests: number;
  approvedRequests: number;
  draftRequests: number;
  rejectedRequests: number;
  totalHeadcountNeeded: number;
  totalHeadcountHired: number;
  fulfillmentRate: number; // percentage
  totalBudgetRequired: number;
  sharePercentage: number;
}

export interface DepartmentManpowerSummary {
  department: string;
  totalRequests: number;
  headcountNeeded: number;
  headcountHired: number;
  fulfillmentRate: number;
}

export interface PurposeDistributionSegment {
  purpose: string;
  count: number;
  headcount: number;
  percentage: number;
  color: string;
}

export interface EmploymentTypeSegment {
  type: string;
  count: number;
  headcount: number;
  percentage: number;
  color: string;
}

export interface ManpowerTrendPoint {
  date: string;
  displayDate: string;
  requestCount: number;
  headcountNeeded: number;
  approvedCount: number;
}

export interface IntercompanyManpowerKpis {
  totalRequests: number;
  totalHeadcountNeeded: number;
  totalHeadcountHired: number;
  approvedCount: number;
  draftCount: number;
  rejectedCount: number;
  overallApprovalRate: number;
  overallFulfillmentRate: number;
  totalBudgetCost: number;
  activeCompaniesCount: number;
  totalCompaniesCount: number;
  companiesWithRequestsCount: number;
  topRequestingDepartment: string;
  topRequestingCompany: string;
  predominantPurpose: string;
}

export interface CompanyFilterOption {
  companyId: number;
  companyName: string;
  companyCode: string;
}

export interface IntercompanyManpowerData {
  records: IntercompanyManpowerRecord[];
  kpis: IntercompanyManpowerKpis;
  companySummaries: CompanyManpowerSummary[];
  departmentSummaries: DepartmentManpowerSummary[];
  purposeDistribution: PurposeDistributionSegment[];
  employmentTypeDistribution: EmploymentTypeSegment[];
  trends: ManpowerTrendPoint[];
  companies: CompanyFilterOption[];
  departments: string[];
  divisions: string[];
  purposes: string[];
  employmentTypes: string[];
  statuses: string[];
  lastUpdated: string;
}

export interface ManpowerFilters {
  company: string; // "ALL" or companyCode
  department: string; // "ALL" or department name
  division: string; // "ALL" or division name
  status: string; // "ALL" | "Approved" | "Draft" | "Rejected"
  purpose: string; // "ALL" | "New Position" | "Additional" | "Replacement"
  employmentType: string; // "ALL" | "Regular" | "Seasonal" | "Reliever"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  search: string;
}

