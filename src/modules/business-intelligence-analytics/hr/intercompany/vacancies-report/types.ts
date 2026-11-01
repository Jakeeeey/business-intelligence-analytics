export type VacancyUrgency = "Critical" | "Moderate" | "Normal";

export type VacancyPurpose = "New Position" | "Additional" | "Replacement" | string;

export type VacancyEmploymentType = "Regular" | "Seasonal" | "Reliever" | "Others" | string;

export interface VacancyCandidateSummary {
  id: number;
  applicantId: number;
  applicantName: string;
  positionAppliedFor?: string | null;
  applicantStatus?: string | null;
  status: string; // Recommended, Approved, Hired, Rejected, Withdrawn
  recommendationNotes?: string | null;
  recommendedByName?: string | null;
  recommendedAtFormatted?: string | null;
}

export interface IntercompanyVacancyRecord {
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
  totalNeeded: number;
  hiredCount: number;
  openVacancies: number;
  fulfillmentRate: number; // percentage
  purpose: VacancyPurpose;
  replacementName?: string | null;
  employmentType: VacancyEmploymentType;
  employmentOthers?: string | null;
  reasonJustification?: string | null;
  qualification?: string | null;
  qualificationDescription?: string | null;
  applicantName?: string | null;
  rate: number;
  rateFormatted: string;
  totalAllocatedBudget: number;
  status: string; // Approved, Draft, etc.
  urgency: VacancyUrgency;
  agingDays: number;
  requestedByName?: string | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  approvedAtFormatted?: string | null;
  createdAt: string;
  createdAtFormatted: string;
  candidates: VacancyCandidateSummary[];
}

export interface CompanyVacanciesSummary {
  companyId: number;
  companyName: string;
  companyCode: string;
  status: "ACTIVE" | "OFFLINE" | "INACTIVE";
  openVacancies: number;
  totalNeeded: number;
  hiredCount: number;
  activeRequisitions: number;
  sharePercentage: number;
}

export interface DepartmentVacanciesSummary {
  department: string;
  openVacancies: number;
  positionsCount: number;
  percentage: number;
}

export interface UrgencyDistributionSegment {
  urgency: VacancyUrgency;
  count: number;
  percentage: number;
  color: string;
}

export interface PurposeDistributionSegment {
  purpose: string;
  count: number;
  percentage: number;
  color: string;
}

export interface IntercompanyVacanciesKpis {
  totalOpenVacancies: number;
  totalRequisitions: number;
  replacementRoles: number;
  newPositionRoles: number;
  avgAgingDays: number;
  totalAllocatedBudget: number;
  criticalRolesCount: number;
}

export interface VacancyCompanyOption {
  companyId: number;
  companyName: string;
  companyCode: string;
}

export interface IntercompanyVacanciesData {
  kpis: IntercompanyVacanciesKpis;
  vacancies: IntercompanyVacancyRecord[];
  companySummaries: CompanyVacanciesSummary[];
  departmentSummaries: DepartmentVacanciesSummary[];
  urgencyDistribution: UrgencyDistributionSegment[];
  purposeDistribution: PurposeDistributionSegment[];
  companies: VacancyCompanyOption[];
  departments: string[];
  divisions: string[];
  purposes: string[];
  employmentTypes: string[];
  statuses: string[];
  lastUpdated: string;
}

export interface VacanciesFilters {
  company: string; // "ALL" or companyCode
  department: string;
  purpose: string;
  employmentType: string;
  urgency: string; // "ALL" | "Critical" | "Moderate" | "Normal"
  dateRange: "today" | "week" | "month" | "quarter" | "year" | "custom" | "all";
  startDate: string;
  endDate: string;
  search: string;
}

