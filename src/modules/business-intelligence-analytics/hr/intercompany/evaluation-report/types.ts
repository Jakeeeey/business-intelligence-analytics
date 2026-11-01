export type EvaluationResult =
  | "PASSED"
  | "FAILED"
  | "REGULARIZED"
  | "EXTENDED"
  | "PENDING"
  | "VOIDED"
  | string;

export type RatingBand =
  | "Outstanding"
  | "Exceeds Expectations"
  | "Meets Expectations"
  | "Needs Improvement"
  | "Unsatisfactory"
  | string;

export interface EvaluationItemSnapshot {
  id: number;
  criterionId: number | null;
  kpiCategory: string;
  kpiDescription: string;
  target?: string | null;
  measurementMethod?: string | null;
  weightPercentage: number;
  rating: number;
  weightedScore: number;
  sortOrder: number;
}

export interface EvaluationTrackingInfo {
  dateHiredSnapshot?: string | null;
  recommendationIssuedAt?: string | null;
  recommendationIssuedAtFormatted?: string | null;
  recommendationIssuedBy?: number | null;
  recommendationLetterFile?: string | null;
  regularizedAt?: string | null;
  regularizedAtFormatted?: string | null;
  regularizedBy?: number | null;
  terminatedAt?: string | null;
  terminatedAtFormatted?: string | null;
  separationType?: string | null;
  terminationReason?: string | null;
  careerStatus: "REGULARIZED" | "IN_PROBATION" | "SEPARATED" | "ACTIVE";
}

export interface IntercompanyEvaluationRecord {
  id: string; // `${companyId}-${evalId}`
  evaluationId: number;
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
  evalType: string;
  evaluationDate: string; // YYYY-MM-DD
  evaluationDateFormatted: string;
  totalScore: number;
  ratingBand: RatingBand;
  result: EvaluationResult;
  evaluatorComments?: string | null;
  evaluatedBy?: number | null;
  evaluatorName?: string | null;
  voidedAt?: string | null;
  voidedAtFormatted?: string | null;
  voidedBy?: number | null;
  voidReason?: string | null;
  isActive: boolean;
  dateOfHire?: string | null;
  tenureFormatted?: string | null;
  items: EvaluationItemSnapshot[];
  tracking?: EvaluationTrackingInfo | null;
  createdAt: string;
}

export interface CompanyEvaluationSummary {
  companyId: number;
  companyName: string;
  companyCode: string;
  status: "ACTIVE" | "OFFLINE" | "INACTIVE";
  totalEvaluations: number;
  passedCount: number;
  failedCount: number;
  regularizedCount: number;
  avgScore: number;
  passRate: number; // percentage
  sharePercentage: number;
}

export interface DepartmentEvaluationSummary {
  department: string;
  totalEvaluations: number;
  avgScore: number;
  passRate: number;
  passedCount: number;
}

export interface RatingBandDistributionSegment {
  band: string;
  count: number;
  percentage: number;
  color: string;
}

export interface EvalTypeDistributionSegment {
  type: string;
  count: number;
  percentage: number;
  color: string;
}

export interface EvaluationTrendPoint {
  date: string;
  displayDate: string;
  totalCount: number;
  avgScore: number;
  passCount: number;
}

export interface KpiCategoryPerformance {
  category: string;
  avgRating: number;
  avgWeight: number;
  evalCount: number;
}

export interface IntercompanyEvaluationKpis {
  totalEvaluations: number;
  passedCount: number;
  failedCount: number;
  regularizedCount: number;
  avgTotalScore: number;
  overallPassRate: number;
  regularizationRate: number;
  activeCompaniesCount: number;
  totalCompaniesCount: number;
  companiesWithEvaluationsCount: number;
  topPerformingCompany: string;
  topPerformingDepartment: string;
  predominantRatingBand: string;
}

export interface CompanyFilterOption {
  companyId: number;
  companyName: string;
  companyCode: string;
}

export interface IntercompanyEvaluationData {
  records: IntercompanyEvaluationRecord[];
  kpis: IntercompanyEvaluationKpis;
  companySummaries: CompanyEvaluationSummary[];
  departmentSummaries: DepartmentEvaluationSummary[];
  ratingDistribution: RatingBandDistributionSegment[];
  typeDistribution: EvalTypeDistributionSegment[];
  categoryPerformance: KpiCategoryPerformance[];
  trends: EvaluationTrendPoint[];
  companies: CompanyFilterOption[];
  departments: string[];
  evalTypes: string[];
  ratingBands: string[];
  results: string[];
  lastUpdated: string;
}

export interface EvaluationFilters {
  company: string; // "ALL" or companyCode
  department: string; // "ALL" or department name
  evalType: string; // "ALL" or eval_type
  ratingBand: string; // "ALL" or rating_band
  result: string; // "ALL" | "PASSED" | "FAILED" | "REGULARIZED" | "EXTENDED"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  search: string;
}

