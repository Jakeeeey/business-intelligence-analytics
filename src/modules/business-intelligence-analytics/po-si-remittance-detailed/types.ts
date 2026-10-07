export interface POSIRemittanceDetailedAPIResponse {
  supplierId: number;
  date: string;
  customerPoAmount: number;  // PO
  poAmount: number;          // SO
  allocatedAmount: number;   // PDP
  cldtoAmount: number;       // CLDTO
  siAmount: number;          // DP
  remittanceAmount: number;  // REMITTED
  unfulfilledAmount: number; // UNF
  returnAmount: number;      // RETURN
  shortage: number;          // API Shortage
}

export interface DetailedMetricRow extends POSIRemittanceDetailedAPIResponse {
  supplierName: string;
  variance: number;          // Remitted - PO
}

export interface DetailedMetricsSummary {
  totalPoAmount: number;
  totalCustomerPoAmount: number;
  totalAllocatedAmount: number;
  totalCldtoAmount: number;
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
