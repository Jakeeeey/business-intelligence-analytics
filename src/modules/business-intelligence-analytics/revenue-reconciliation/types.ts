export interface VarianceSummary {
  totalPurchaseOrder: number | null;
  totalSalesInvoice: number | null;
  totalRemittance: number | null;
  variancePoVsSi: number | null;
  varianceSiVsRemittance: number | null;
  totalVariance: number | null;
}

export interface SupplierVariance {
  supplierId: number;
  supplierName: string;
  totalPurchaseOrder: number | null;
  totalSalesInvoice: number | null;
  totalRemittance: number | null;
  variancePoVsSi: number | null;
  varianceSiVsRemittance: number | null;
}

export interface ReconciliationData {
  startDate: string;
  endDate: string;
  summary: VarianceSummary;
  bySupplier: SupplierVariance[];
  notes?: string[];
}
