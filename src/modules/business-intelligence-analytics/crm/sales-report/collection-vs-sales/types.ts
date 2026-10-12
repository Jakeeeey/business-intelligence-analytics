export interface CollectionVsSalesKpis {
    totalSales: number;
    totalCollected: number;
    variance: number;
    collectionEfficiency: number;
    receiptsCount: number;
    topPaymentMethod: string;
    topPaymentAmount: number;
}

export interface SalesmanComparisonItem {
    salesmanId: number;
    salesmanName: string;
    sales: number;
    collections: number;
    variance: number;
    efficiency: number;
    receiptsCount: number;
}

export interface PaymentMethodItem {
    name: string;
    amount: number;
    count: number;
    share: number;
}

export interface CollectionTimelineItem {
    date: string;
    label: string;
    sales: number;
    collections: number;
}

export interface CollectionReceiptItem {
    id: number;
    docNo: string;
    receiptNo: string;
    collectionDate: string;
    salesmanId: number;
    salesmanName: string;
    collectedBy: string;
    accountTitle: string;
    paymentMethod: string;
    amount: number;
    remarks: string;
}

export interface CollectionVsSalesLookups {
    salesmen: Array<{ id: number; name: string; code: string }>;
    paymentMethods: Array<{ id: number; name: string }>;
}

export interface CollectionVsSalesResponse {
    kpis: CollectionVsSalesKpis;
    salesmenComparison: SalesmanComparisonItem[];
    paymentMethods: PaymentMethodItem[];
    timeline: CollectionTimelineItem[];
    receipts: CollectionReceiptItem[];
    totalReceiptsCount: number;
}

export interface CollectionVsSalesFiltersState {
    startDate: string;
    endDate: string;
    salesmanId: string;
    paymentMethod: string;
    searchQuery: string;
}

export type DatePreset = "this-month" | "last-month" | "last-30-days" | "ytd" | "all";
