// src/modules/business-intelligence-analytics/sales-report/product-returns-performance/types.ts

export type ProductReturnRecord = {
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
  productBrand: string;
  productCategory: string;
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

export type DateRangePreset =
  | "yesterday"
  | "today"
  | "this-week"
  | "this-month"
  | "this-year"
  | "custom";

export type ProductReturnsFilters = {
  dateRangePreset: DateRangePreset;
  dateFrom: string;
  dateTo: string;
  branches: string[];
  statuses: string[];
  suppliers: string[];
  products: string[];
  brands: string[];
  cities: string[];
  provinces: string[];
  divisions: string[];
  operations: string[];
  salesmen: string[];
};

export type ProductReturnsKpis = {
  totalReturns: number;
  totalReturnValue: number;
  avgReturnValue: number;
  topReturnedProduct: string;
  topSupplier: string;
};

export type ReturnByPeriod = {
  period: string;
  returnValue: number;
  returnCount: number;
};
export type ReturnTrend = {
  productName: string;
  data: { date: string; returnValue: number }[];
};
export type TopReturnItem = {
  name: string;
  returnValue: number;
  returnCount: number;
};

export type LocationReturn = {
  location: string;
  returnValue: number;
  returnCount: number;
};

export type ProductReturnTrend = {
  productName: string;
  data: { date: string; returnValue: number }[];
};


export type SupplierReturnPerformance = {
  supplier: string;
  returnValue: number;
  returnCount: number;
  products: TopReturnItem[];
};



export type ModalItem = { name: string; returnValue: number; returnCount: number };


export type ModalConfig = {
  type: "product" | "supplier" | "customer" | "location" | "salesman" | "division" | "operation";
  item: ModalItem;
  rank: number;
  color: string;
};