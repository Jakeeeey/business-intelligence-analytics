// Expense Report Types

/** Raw row returned from SPRING_API_BASE_URL/api/view-disbursement-itemized/all */
export type DisbursementRecord = {
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
  disbursementDateCreated: string; // "YYYY-MM-DD HH:mm:ss"
  disbursementDateUpdated: string; // "YYYY-MM-DD HH:mm:ss"
  divisionId: number;
  divisionName: string;
  lineType: string; // "PAYABLE", "RECEIVABLE", etc.
  lineId: number;
  referenceNo: string;
  lineDate: string; // "YYYY-MM-DD"
  coaId: number;
  coaTitle: string; // "Meal Allowance", "Delivery Allowance", etc.
  bankId: number | null;
  bankName: string | null;
  checkNo: string | null;
  lineAmount: number;
  lineRemarks: string;
  lineDateCreated: string; // "YYYY-MM-DDTHH:mm:ssZ"
};

export type DateRangePreset =
  | "yesterday"
  | "today"
  | "this-week"
  | "this-month"
  | "this-year"
  | "custom";

export type ExpenseFilters = {
  dateRangePreset: DateRangePreset;
  dateFrom: string; // "YYYY-MM-DD"
  dateTo: string; // "YYYY-MM-DD"
  employees: string[]; // payeeNames
  divisions: string[]; // divisionNames
  encoders: string[]; // encoderNames
  coaAccounts: string[]; // coaTitles
  transactionTypes: string[]; // transactionTypeNames
  statuses: string[]; // ["Posted", "Pending", "Pending"]
};

export type ExpenseKpis = {
  totalDisbursementAmount: number;
  totalPaidAmount: number;
  outstandingBalance: number;
  totalTransactions: number;
  totalLineTransaction: number;
  postedTransactions: number;
  pendingApprovalsCount: number;
  taxWithholdingImpact: number; // placeholder
};

export type ExpenseByCategory = {
  coaTitle: string;
  totalAmount: number;
  percentShare: number;
};

export type ExpenseByEmployee = {
  payeeName: string;
  totalAmount: number;
  percentShare: number;
  transactionCount: number;
};

export type ExpenseByDivision = {
  divisionName: string;
  totalAmount: number;
  percentShare: number;
  transactionCount: number;
};

export type DisbursementSummary = {
  disbursementId: number;
  docNo: string;
  payeeName: string;
  divisionName: string;
  coaTitle: string;
  totalAmount: number;
  paidAmount: number;
  balance?: number;
  /** Header-level totals for the whole document (not COA-sliced) */
  totalAmountHeader?: number;
  paidAmountHeader?: number;
  /** Sum of line amounts for this COA slice (used for COA subtotals) */
  coaLineTotal?: number;
  transactionDate: string;
  status: string; // "Posted" | "Pending" | "Pending"
  encoderName: string;
  lineRemarks: string;
  // Optional: include the original line-level records for multi-level views
  lines?: DisbursementRecord[];
  entryType?: "GROSS" | "ADJUSTMENT" | "REVERSAL";
};

export type Granularity =
  | "daily"
  | "weekly"
  | "biweekly"
  | "bimonthly"
  | "monthly"
  | "quarterly"
  | "semiannually"
  | "yearly";

export type ExpenseByPeriod = {
  period: string;
  totalAmount: number;
  transactionCount: number;
};

export type ExportFormat = "summary" | "detailed";

export type TooltipProps = {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string | number;
};
