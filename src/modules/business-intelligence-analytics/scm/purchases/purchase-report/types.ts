export type PurchaseOrderStatus = "FULLY_RECEIVED" | "PARTIALLY_RECEIVED" | "PENDING";

export interface ReceivingLineItem {
    id: number;
    productId: number;
    productName: string;
    productCode: string;
    batchNo: string;
    expiryDate: string;
    receivedQuantity: number;
    unitPrice: number;
    totalAmount: number;
    receiptNo: string;
    receiptDate: string;
}

export interface PurchaseOrderItem {
    purchaseOrderId: number;
    purchaseOrderNo: string;
    reference: string;
    remark: string;
    supplierId: number;
    supplierName: string;
    branchId: number;
    branchName: string;
    poDate: string;
    grossAmount: number;
    discountAmount: number;
    vatAmount: number;
    totalAmount: number;
    receivedAmount: number;
    pendingAmount: number;
    fulfillmentRate: number;
    status: PurchaseOrderStatus;
    isPosted: boolean;
    priceType: string;
    receivingItems: ReceivingLineItem[];
    itemsCount: number;
}

export interface SupplierBreakdownItem {
    supplierId: number;
    supplierName: string;
    poCount: number;
    orderedAmount: number;
    receivedAmount: number;
    pendingAmount: number;
    fulfillmentRate: number;
}

export interface ProductBreakdownItem {
    productId: number;
    productName: string;
    productCode: string;
    totalQuantity: number;
    totalAmount: number;
    averageUnitPrice: number;
    deliveriesCount: number;
    latestReceiptDate: string;
}

export interface BranchDistributionItem {
    branchId: number;
    branchName: string;
    poCount: number;
    amount: number;
    share: number;
}

export interface PurchaseTimelineItem {
    date: string;
    label: string;
    ordered: number;
    received: number;
}

export interface PurchaseReportKpis {
    totalPoValue: number;
    totalReceivedValue: number;
    totalPendingValue: number;
    overallFulfillmentRate: number;
    totalPoCount: number;
    fullyReceivedCount: number;
    partiallyReceivedCount: number;
    pendingCount: number;
    topSupplier: string;
    topSupplierAmount: number;
    topProduct: string;
    topProductAmount: number;
}

export interface PurchaseReportLookups {
    suppliers: Array<{ id: number; name: string }>;
    branches: Array<{ id: number; name: string; code: string }>;
    products: Array<{ id: number; name: string; code: string }>;
}

export interface PurchaseReportResponse {
    kpis: PurchaseReportKpis;
    supplierBreakdown: SupplierBreakdownItem[];
    branchDistribution: BranchDistributionItem[];
    productBreakdown: ProductBreakdownItem[];
    timeline: PurchaseTimelineItem[];
    purchaseOrders: PurchaseOrderItem[];
    totalCount: number;
}

export interface PurchaseReportFiltersState {
    startDate: string;
    endDate: string;
    supplierId: string;
    branchId: string;
    productId: string;
    status: string;
    searchQuery: string;
}

export type DatePreset = "this-month" | "last-month" | "last-30-days" | "ytd" | "all";
