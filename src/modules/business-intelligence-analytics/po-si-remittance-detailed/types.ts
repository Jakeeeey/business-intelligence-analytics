export interface POSIRemittanceDetailedAPIResponse {
  supplierId: number;
  date: string;
  poAmount: number;          // SO/PO
  customerPoAmount: number;  // PDP
  allocatedAmount: number;   // CLDTO
  siAmount: number;          // DP
  remittanceAmount: number;  // REMITTED
  unfulfilledAmount: number; // UNF
  returnAmount: number;      // RETURN
  shortage: number;          // API Shortage
}

export interface DetailedMetricRow extends POSIRemittanceDetailedAPIResponse {
  supplierName: string;
  variance: number;          // SO/PO - Remitted
}

export interface DetailedMetricsSummary {
  totalPoAmount: number;
  totalCustomerPoAmount: number;
  totalAllocatedAmount: number;
  totalSiAmount: number;
  totalRemittanceAmount: number;
  totalUnfulfilledAmount: number;
  totalReturnAmount: number;
  totalShortage: number;
  totalVariance: number;
}

export interface POSIRemittanceDetailedData {
  summary: DetailedMetricsSummary;
  rows: DetailedMetricRow[];
}
