// src/modules/business-intelligence-analytics/sales-report/product-sales-performance/types.ts

export type ProductSaleRecord = {
  id: string;
  customerName: string;
  brgy: string;
  city: string;
  province: string;
  supplierId: number;
  supplier: string;
  productId: number;
  productName: string;
  productDescription?: string;
  amount: number;
  date: string; // ISO date string
  salesmanCode: string;
  salesmanName: string;
  divisionId: number;
  divisionName: string;
  operationId: number;
  operationCode: string;
  operationName: string;
};

export type DateRangePreset = "yesterday" | "today" | "tomorrow" | "this-week" | "this-month" | "this-year" | "custom";

export type ProductPerformanceFilters = {
  dateRangePreset: DateRangePreset;
  dateFrom: string; // Used when preset is "custom"
  dateTo: string;   // Used when preset is "custom"
  suppliers: string[];
  products: string[];
  cities: string[];
  provinces: string[];
  divisions: string[];
  operations: string[];
  salesmen: string[];
};

export type ProductPerformanceKpis = {
  totalRevenue: number;
  totalTransactions: number;
  avgTransactionValue: number;
  topProduct: string;
  topSupplier: string;
};

export type RevenueByPeriod = {
  period: string; // "2024-01" or "2024-Q1"
  revenue: number;
};

export type TopItem = {
  name: string;
  revenue: number;
  count: number;
};

export type LocationRevenue = {
  location: string;
  revenue: number;
  transactions: number;
};

export type ProductTrend = {
  productName: string;
  data: { date: string; revenue: number }[];
};

export type SupplierPerformance = {
  supplier: string;
  revenue: number;
  products: TopItem[];
};


export type ModalItem = { name: string; revenue: number; count: number };


export type ModalConfig = {
  type: "product" | "supplier" | "customer" | "location" | "salesman" | "division" | "operation";
  item: ModalItem;
  rank: number;
  color: string;
};