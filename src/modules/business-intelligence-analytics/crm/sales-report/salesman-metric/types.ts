export interface SalesmanOption {
  salesmanId: number;
  salesmanCode: string;
  salesmanName: string;
}

export type DatePreset = "today" | "this-week" | "this-month" | "this-year" | "custom";

export interface SalesmanMetricFilters {
  salesmanId: number | "";
  salesmanCode: string;
  fiscalPeriod: string;
  startDate: string;
  endDate: string;
}

export interface MetricRow {
  salesmanId: number;
  salesmanCode: string;
  salesmanName: string;
  // Metric 1: Sales Performance
  salesPerformance: number;
  // Metric 2: Reach
  reach: number;
  // Metric 3: Frequency
  frequencyCount: number;
  frequencyAmount: number;
  // Metric 4: New Accounts
  newAccounts: number;
  // Metric 5: Productive Outlets Target
  productiveOutletsTarget: number;
  productiveOutletsActual: number;
  productiveOutletsAchievement: number;
  productiveOutletsStatus: string;
  // Metric 6: Line Sales Target
  lineSalesTargetProductsPerReceipt: number;
  lineSalesTargetReceiptCount: number;
  lineSalesActualReceipts: number;
  lineSalesAchievement: number;
  lineSalesStatus: string;
  // Metric 7: Basket Count Target
  basketCountTargetAmount: number;
  basketCountTargetReceiptCount: number;
  basketCountActualReceipts: number;
  basketCountAchievement: number;
  basketCountStatus: string;
  // Metric 8: Tactical SKU Target
  tacticalSkuTargetQty: number;
  tacticalSkuActualQty: number;
  tacticalSkuAchievement: number;
  tacticalSkuStatus: string;
}
