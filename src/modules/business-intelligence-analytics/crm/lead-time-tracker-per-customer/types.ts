// Shared types for the Lead Time Tracker Per Customer module

export type DateRangePreset =
  | "yesterday"
  | "today"
  | "day-before-yesterday"
  | "this-week"
  | "last-week"
  | "last-7-days"
  | "last-2-weeks"
  | "this-month"
  | "last-month"
  | "last-30-days"
  | "last-2-months"
  | "this-quarter"
  | "last-quarter"
  | "last-3-months"
  | "last-2-quarters"
  | "this-year"
  | "last-year"
  | "custom";

export type CustomerLeadTimeFilters = {
  dateRangePreset: DateRangePreset;
  dateFrom: string;
  dateTo: string;
  /** Selected customer codes. Empty = all customers. */
  customerCodes: string[];
  /** Optional PO number filter. */
  poNo: string;
};

export type CustomerOption = {
  code: string;
  name: string;
};

/** Raw API response record shape from view-so-customer-lead-time */
export type CustomerLeadTimeRecord = {
  customerCode: string;
  customerName: string;
  soNo: string;
  poNo: string;
  purchasedDate: string | null;
  createdDate: string | null;
  approvedDate: string | null;
  pickedConsoDate: string | null;
  dispatchedDate: string | null;
  deliveredDate: string | null;
  totalDays: number | null;
};

/** Normalized row with computed per-stage day diffs */
export type CustomerLeadTimeRow = CustomerLeadTimeRecord & {
  /** Days from createdDate → approvedDate */
  approvalDays: number | null;
  /** Days from approvedDate → pickedConsoDate */
  pickingDays: number | null;
  /** Days from pickedConsoDate → dispatchedDate */
  dispatchDays: number | null;
  /** Days from dispatchedDate → deliveredDate */
  deliveryDays: number | null;
};

export type CustomerLeadTimeApiResponse =
  | CustomerLeadTimeRecord
  | CustomerLeadTimeRecord[]
  | {
      success?: boolean;
      data?: unknown;
      message?: string;
      error?: string;
    };
