export interface LostCustomerRecord {
  id: string | number;
  customerCode: string;
  customerName: string;
  tagging: string;
  minDaysNoSales: number;
  lastSalesDate: string | null;
  totalHistoricalSales: number;
  salesmanName?: string | null;
  branchName?: string | null;
  contactNumber?: string | null;
  email?: string | null;
  raw?: Record<string, unknown>;
}

export interface LostCustomerFilters {
  customerCode: string;
  customerName: string;
  tagging: string;
  minDaysNoSales: string;
}

export interface LostCustomerKpis {
  totalCustomers: number;
  atRiskCount: number;
  dormantCount: number;
  lostCount: number;
  avgDaysInactive: number;
  totalValueAtRisk: number;
}

export type SortField =
  | "customerCode"
  | "customerName"
  | "tagging"
  | "minDaysNoSales"
  | "lastSalesDate"
  | "totalHistoricalSales";

export type SortOrder = "asc" | "desc";

export interface TaggingDistributionItem {
  tag: string;
  count: number;
  totalSales: number;
}

export interface InactivityRangeDistribution {
  range: string;
  count: number;
  totalSales: number;
}
