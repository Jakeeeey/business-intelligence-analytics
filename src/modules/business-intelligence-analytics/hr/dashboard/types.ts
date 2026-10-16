export interface EmployeeRecord {
  id: string;
  employeeId: string;
  userId: number;
  name: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  contact: string;
  department: string;
  departmentId: number | null;
  position: string;
  employmentStatus: string;
  employmentStatusId: number | null;
  dateOfHire: string | null;
  tenureMonths: number;
  tenureYears: number;
  gender: string;
  civilStatus: string;
  city: string;
  province: string;
  avatar: string | null;
  isDepartmentHead: boolean;
}

export interface DepartmentHeadcount {
  department: string;
  departmentId: number | null;
  headcount: number;
  percentage: number;
}

export interface GenderDistributionItem {
  gender: string;
  count: number;
  percentage: number;
  color: string;
}

export interface TenureDistributionItem {
  range: string;
  count: number;
  percentage: number;
}

export interface EmploymentStatusItem {
  status: string;
  count: number;
  percentage: number;
}

export interface HrDashboardKpis {
  totalEmployees: number;
  regularCount: number;
  probationaryCount: number;
  newHiresThisYear: number;
  activeDepartments: number;
  avgTenureYears: number;
  femaleCount: number;
  maleCount: number;
}

export interface HrDashboardData {
  kpis: HrDashboardKpis;
  departmentStats: DepartmentHeadcount[];
  genderDistribution: GenderDistributionItem[];
  tenureDistribution: TenureDistributionItem[];
  statusDistribution: EmploymentStatusItem[];
  employees: EmployeeRecord[];
  departments: string[];
  statuses: string[];
}

export interface HrDashboardFilters {
  department: string;
  status: string;
  gender: string;
  search: string;
}

export type SortField =
  | "employeeId"
  | "name"
  | "department"
  | "position"
  | "employmentStatus"
  | "dateOfHire"
  | "tenureYears";

export type SortOrder = "asc" | "desc";
