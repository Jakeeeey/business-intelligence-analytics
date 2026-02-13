export interface VSalesPerformanceDataDto {
    // IDs
    divisionId: number;
    salesmanId: number;
    supplierId: number;

    // Names (These match the private String fields in your Java DTO)
    divisionName: string;
    salesmanName: string;
    supplierName: string;

    // Data
    transactionDate: string; // Java LocalDate becomes a "YYYY-MM-DD" string
    netAmount: number;       // Java Double becomes number
}

// Keep your helper interfaces
export interface DivisionHealth {
    divisionName: string;
    totalSales: number;
    monthlyTarget: number;
    achievementPercent: number;
    transactionCount: number;
}

export interface SupplierMetric {
    supplierName: string;
    divisionName: string;
    totalSales: number;
    transactionCount: number;
}