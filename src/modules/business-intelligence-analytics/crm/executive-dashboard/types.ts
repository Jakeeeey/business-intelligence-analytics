// src/modules/business-intelligence-analytics/crm/executive-dashboard/types.ts

export type DateRangePreset =
  | "yesterday"
  | "today"
  | "this-month"
  | "this-year"
  | "custom";

export interface ExecutiveDashboardFilters {
  dateRangePreset: DateRangePreset;
  dateFrom: string; // "YYYY-MM-DD"
  dateTo: string; // "YYYY-MM-DD"
  divisions: string[];
}

/** Raw record from /api/view-accounts-payable/all (Port 8086) */
export interface AccountsPayableRecord {
  disbursementId?: number;
  docNo?: string;
  transactionDate?: string;
  supplierId?: number;
  supplierName?: string;
  dueDate?: string;
  daysOverdue?: number;
  remarks?: string;
  division?: string;
  divisionName?: string;
  departmentId?: number | null;
  encoderId?: number;
  encoderName?: string;
  approverId?: number | null;
  approverName?: string;
  status?: string;
  isPosted?: number;
  totalPayable?: number;
  totalPaid?: number;
  totalRefunded?: number;
  outstandingBalance?: number;
}

/** Raw record from /api/view-disbursement-itemized/all (Port 8087) */
export interface DisbursementRecord {
  disbursementId: number;
  docNo: string;
  transactionType: number;
  transactionTypeName: string;
  payeeId: number;
  payeeName: string;
  disbursementRemarks: string;
  totalAmount: number;
  paidAmount: number;
  encoderId: number;
  encoderName: string;
  approverId: number | null;
  approverName: string;
  postedById: number | null;
  postedByName: string;
  isPosted: number;
  transactionDate: string; // "YYYY-MM-DD"
  disbursementDateCreated: string;
  disbursementDateUpdated: string;
  divisionId: number;
  divisionName: string;
  lineType: string;
  lineId: number;
  referenceNo: string;
  lineDate: string;
  coaId: number;
  coaTitle: string;
  bankId: number | null;
  bankName: string | null;
  checkNo: string | null;
  lineAmount: number;
  lineRemarks: string;
  lineDateCreated: string;
}

/** Raw record from /api/view-ar-per-item-per-supplier/filter (Port 8086) */
export interface ArPerSupplierRecord {
  divisionId?: number;
  divisionName?: string;
  supplierName?: string;
  productCode?: string;
  productName?: string;
  referenceInvoice?: string;
  invoiceDate?: string;
  quantity?: number;
  unitPrice?: number;
  itemGrossAmount?: number;
  itemDiscount?: number;
  itemNetReceivable?: number;
  itemPaidPortion?: number;
  itemOutstandingBalance?: number;
}

/** Raw record from /api/view-running-inventory-by-unit/all (Port 8086) */
export interface RunningInventoryRecord {
  divisionId?: number;
  divisionName?: string;
  supplierName?: string;
  id?: string;
  productId?: number;
  productCode?: string;
  productName?: string;
  productBarcode?: string | null;
  productBrand?: string;
  productCategory?: string;
  unitName?: string;
  unitCount?: number;
  branchId?: number;
  branchName?: string;
  lastCutoff?: string;
  lastCountUnit?: number;
  movementAfterUnit?: number;
  runningInventoryUnit?: number;
  supplierShortcut?: string;
  supplierId?: number;
}

/** Raw record from /api/view-sales-return-per-item-supplier/filter (Port 8086) */
export interface SalesReturnRecord {
  divisionId?: number;
  divisionName?: string;
  supplierName?: string;
  productCode?: string;
  productName?: string;
  returnNumber?: string;
  returnDate?: string;
  originalInvoiceReference?: string;
  returnedQuantity?: number;
  unitPrice?: number;
  itemReturnDiscount?: number;
  itemReturnTotal?: number;
  returnStatus?: string;
  isPosted?: number;
  remarks?: string;
}

/** Raw record from /api/view-sales-report-itemized/filtered (Port 8086) */
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
  divisionId?: number;
  divisionName?: string;
  supplierName?: string;
  branch?: string;
  invoiceDate?: string;
  dispatchDate?: string;
  dueDate?: string;
  paymentTerms?: string | null;
  transactionStatus?: string;
  paymentStatus?: string;
  totalAmount?: number;
  discountAmount?: number;
  amount?: number;
  returnAmountTotal?: number;
  returnDiscountTotal?: number;
  collection?: number;
  salesType?: string;
  invoiceType?: string;
  priceType?: string;
  createdBy?: string;
  createdDate?: string;
  modifiedBy?: string | null;
  modifiedDate?: string;
  isReceipt?: number;
  isPosted?: number;
  isDispatched?: number;
  isRemitted?: number | null;
  productName?: string;
  productCategory?: string;
  productBrand?: string;
  productSupplier?: string;
  productUnitPrice?: number;
  productQuantity?: number;
  productUnit?: string;
  productTotalAmount?: number;
  productDiscountAmount?: number;
  productNetAmount?: number;
  returnQuantity?: number;
  returnTotalAmount?: number;
  returnDiscountAmount?: number;
  returnNetAmount?: number;
  productSalesAmount?: number;
}

// -------------------------------------------------------------
// Proccessed & Aggregated UI states
// -------------------------------------------------------------

export interface SupplierTradeRecord {
  supplierName: string;
  supplierCode: string;
  purchases: number;
  sales: number;
  arClaims: number;
  arTrade: number;
  inventories: number;
  salesReturn: number;
  accountsPayable: number;
}

export interface SupplierNonTradeRecord {
  payeeName: string;
  expenses: number;
  payablesNonTrade: number;
}

export type DrillDownCategory =
  | "purchases"
  | "sales"
  | "arClaims"
  | "arTrade"
  | "inventories"
  | "salesReturn"
  | "accountsPayable"
  | "expenses"
  | "payablesNonTrade";

export interface MonthlyTrendPoint {
  month: string; // "JAN", "FEB", etc.
  amount: number;
}

export interface SupplierMonthlyBreakdown {
  supplierName: string;
  months: Record<string, number>; // e.g. { "JAN": 100, "FEB": 200, ... }
  total: number;
}
