export interface VSalesPerformanceDataDto {
    divisionId: number;
    salesmanId: number;
    supplierId: number;
    divisionName: string;
    salesmanName: string;
    supplierName: string;
    transactionDate: string;
    netAmount: number;
    storeName?: string;
    storeType?: string;
    storeTypeLabel?: string;
    customerCode?: string;
}

export interface ProductSalesDetail {
    customerCode: string;
    salesmanId: number;
    supplierId: number;
    supplierName: string;
    invoiceNo: string;
    transactionDate: string;
    productId: number;
    productName: string;
    categoryName: string;
    brandName: string;
    unitName: string;
    totalQuantity: number;
    quantityInBox: number;
    quantityInPiece: number;
    unitPrice: number;
    discountAmount: number;
    netAmount: number;
}

export interface TargetSettingSalesman {
    id: number;
    ts_supervisor_id: number;
    salesman_id: number;
    supplier_id: number;
    target_amount: number;
    fiscal_period: string;
}

export interface TargetSettingResponse {
    divisionTargets?: Record<string, unknown>[];
    supplierTargets?: Record<string, unknown>[];
    supervisorTargets?: Record<string, unknown>[];
    salesmanTargets?: TargetSettingSalesman[];
}

export interface SupervisorMapping {
    id: number;
    division_id: number;
    supervisor_id: {
        id: number;
        first_name: string;
        last_name: string;
    };
}

export interface SalesmanMapping {
    id: number;
    supervisor_per_division_id: number;
    salesman_id: number;
}

export interface SalesmanMaster {
    id: number;
    salesman_name: string;
    salesman_code: string;
}

export interface SupervisorKPIResponse {
    supervisors: SupervisorMapping[];
    salesmanMappings: SalesmanMapping[];
    salesmanMaster: SalesmanMaster[];
}
