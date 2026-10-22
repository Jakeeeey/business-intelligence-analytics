// src/modules/business-intelligence-analytics/crm/sales-report/delivered-items/types.ts

export type DeliveredItemRecord = {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  customerName: string;
  customerCode?: string;
  productId?: number;
  productName: string;
  productDescription?: string;
  quantity: number;
  unitPrice?: number;
  amount: number;
  supplier?: string;
  supplierId?: number;
  city?: string;
  province?: string;
  salesmanName?: string;
  orderNo?: string;
  invoiceNo?: string;
};

export type DateRangePreset =
  | "today"
  | "yesterday"
  | "this-week"
  | "this-month"
  | "this-year"
  | "custom";

export type DeliveredItemsFilters = {
  dateRangePreset: DateRangePreset;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  selectedCustomers: string[]; // customer names
  searchTerm: string;
};

export type DeliveredItemsKpis = {
  totalDeliveredItems: number;
  totalDeliveredAmount: number;
  activeCustomersCount: number;
  uniqueProductsCount: number;
};

export type CustomerDeliveredSummary = {
  customerName: string;
  city: string;
  province: string;
  totalItemsDelivered: number;
  totalDeliveredAmount: number;
  uniqueProductsCount: number;
  topProduct: string;
  lastDeliveryDate: string;
};

export type ProductDeliveredSummary = {
  productId?: number;
  productName: string;
  supplier: string;
  totalQuantity: number;
  totalAmount: number;
  customersCount: number;
};

export type CustomerLookupItem = {
  customer_code: string;
  customer_name: string;
  city?: string;
  province?: string;
};
