// src/modules/business-intelligence-analytics/sales-report/stt-report/types.ts

export type STTReportRecord = {
  invoiceId: number;
  orderId: string;
  customerCode: string;
  customerName: string;
  storeTypeId: number;
  storeType: string;
  customerAddress: string;
  invoiceNo: string;
  salesman: string;
  divisionId: number;
  divisionName: string;
  branch: string;
  invoiceDate: string;
  dispatchDate: string;
  dueDate: string;
  paymentTerms: string | null;
  transactionStatus: string;
  paymentStatus: string;
  totalAmount: number;
  discountAmount: number;
  amount: number;
  returnAmountTotal: number;
  returnDiscountTotal: number;
  collection: number;
  salesType: string;
  invoiceType: string;
  priceType: string;
  createdBy: string;
  createdDate: string;
  modifiedBy: string;
  modifiedDate: string;
  isReceipt: number;
  isPosted: number;
  isDispatched: number;
  isRemitted: number | null;
  productName: string;
  productCategory: string;
  productBrand: string;
  productSupplier: string;
  productUnitPrice: number;
  productQuantity: number;
  productUnit: string;
  productTotalAmount: number;
  productDiscountAmount: number;
  productNetAmount: number;
  returnQuantity: number;
  returnTotalAmount: number;
  returnDiscountAmount: number;
  returnNetAmount: number;
  productSalesAmount: number;
};

export type DateRangePreset =
  | "yesterday"
  | "today"
  | "this-week"
  | "this-month"
  | "this-year"
  | "custom";

export type STTReportFilters = {
  dateRangePreset: DateRangePreset;
  dateFrom: string;
  dateTo: string;
  branches: string[];
  salesmen: string[];
  statuses: string[];
  suppliers: string[];
};

export type STTReportKpis = {
  // 1. Total Sales
  totalSales: number;
  totalSalesInvoiceCount: number;
  // 2. Net Collections
  netCollections: number;
  outstandingPayments: number;
  // 3. Total Returns
  totalReturns: number;
  returnedProductCount: number;
  invoicesWithReturns: number;
  // 4. Total Invoices
  totalInvoices: number;
  // 5. Unique Customers
  uniqueCustomers: number;
  // 6. Collection Rate
  collectionRate: number;
  // 6.1 Return Rate (percentage of returned value over total sales)
  returnRate: number;
  // 7. Average Order Value
  avgOrderValue: number;
  // 8. Target Quantity
  targetQuantity: number;
  // 9. Total Discounts (deduplicated per invoice)
  totalDiscount: number;
  // 9. Customer Invoices Number
  avgInvoicesPerCustomer: number;
};

export type SalesByPeriod = {
  period: string;
  sales: number;
  collections: number;
  returns: number;
  invoiceCount: number;
};

export type BranchSummary = {
  name: string;
  totalSales: number;
  totalCollections: number;
  totalReturns: number;
  invoiceCount: number;
};

export type SalesmanSummary = {
  name: string;
  totalSales: number;
  totalCollections: number;
  totalReturns: number;
  invoiceCount: number;
  customerCount: number;
  productSales: number;
};

export type CustomerSummary = {
  customerCode: string;
  name: string;
  totalSales: number;
  totalCollections: number;
  totalReturns: number;
  invoiceCount: number;
  productSales: number;
};

export type ProductSummary = {
  name: string;
  supplier: string;
  category: string;
  brand: string;
  totalQuantity: number;
  totalAmount: number;
  returnQuantity: number;
  returnAmount: number;
  totalDiscount: number;
};

export type InvoiceSummary = {
  invoiceId: number;
  invoiceNo: string | null;
  invoiceDate: string | null;
  customerName: string | null;
  customerCode: string | null;
  salesman: string | null;
  branch: string | null;
  totalAmount: number;
  collection: number;
  discountAmount: number;
  transactionStatus: string | null;
  paymentStatus: string | null;
  divisionName: string | null;
};

export type ReturnRecord = {
  invoiceId: number;
  invoiceNo: string;
  invoiceDate: string;
  customerName: string;
  productName: string;
  productSupplier: string;
  salesman: string;
  branch: string;
  returnQuantity: number;
  returnTotalAmount: number;
  returnNetAmount: number;
  returnDiscountAmount: number;
};

// Tooltip / chart helper prop types used by OverviewTab
export type SalesTooltipProps = {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color?: string;
    payload?: Record<string, unknown>;
  }>;
  label?: string | number | null;
};

export type BarTooltipProps = {
  active?: boolean;
  payload?: Array<{
    value?: number | string;
    payload?:
      | { name?: string; fullName?: string }
      | Record<string, unknown>
      | undefined;
  }>;
};

export type PieTooltipProps = {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload?: { pct?: string } | Record<string, unknown>;
  }>;
};

export type ActivePieShapeProps = {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
};
