import { VSalesPerformanceDataDto } from "../executive-health/types";

export interface SupplierMetric {
    supplierName: string;
    divisionName: string;
    totalSales: number;
    transactionCount: number;
}

export type { VSalesPerformanceDataDto };