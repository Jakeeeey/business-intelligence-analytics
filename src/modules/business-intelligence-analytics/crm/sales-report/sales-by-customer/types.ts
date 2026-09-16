export interface SalesReportItemizedRecord {
    invoiceId?: number;
    orderId?: string;
    customerCode?: string;
    customerName?: string;
    storeTypeId?: number;
    storeType?: string;
    customerAddress?: string;
    invoiceNo?: string;
    salesman?: string;
    salesmanName?: string;
    divisionId?: number;
    divisionName?: string;
    supplierName?: string;
    branch?: string;
    invoiceDate?: string;
    transactionDate?: string;
    totalAmount?: number;
    discountAmount?: number;
    amount?: number;
    netAmount?: number;
    storeName?: string;
    storeTypeLabel?: string;
    province?: string;
    city?: string;
    productName?: string;
    productCategory?: string;
    productBrand?: string;
}

// Backward compatibility alias
export type VSalesPerformanceDataDto = SalesReportItemizedRecord;

export interface CustomerSummary {
    customerName: string;
    customerCode: string;
    storeType: string;
    divisionName: string;
    customerAddress: string;
    province: string;
    city: string;
    totalSales: number;
    transactionCount: number;
    averageOrderValue: number;
    percentageShare: number;
    topSupplier: string;
    topSalesman: string;
}

export interface CustomerFilters {
    startDate: string;
    endDate: string;
    search: string;
    division: string;
    supplier: string;
    salesman: string;
    storeType: string;
}

export interface CustomerKpis {
    totalSales: number;
    totalCustomers: number;
    totalTransactions: number;
    averageSalesPerCustomer: number;
}

export interface SupplierBreakdown {
    supplierName: string;
    totalSales: number;
    transactionCount: number;
    percentage: number;
}

export interface SalesmanBreakdown {
    salesmanName: string;
    totalSales: number;
    transactionCount: number;
    percentage: number;
}

export interface CustomerTransactionRecord {
    transactionDate: string;
    invoiceNo: string;
    divisionName: string;
    salesmanName: string;
    supplierName: string;
    productName?: string;
    netAmount: number;
}
