// Shared types for the Lead Time Report module

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

export type LeadTimeFilters = {
  dateRangePreset: DateRangePreset;
  dateFrom: string;
  dateTo: string;
  /** Selected product ids (from filter endpoint). Empty = all products. */
  productIds: string[];
  /** Optional cached product names corresponding to `productIds`. */
  productNames?: string[] | null;
};

export type LeadTimeProductOption = {
  id: string;
  name: string;
  code?: string;
  description?: string | null;
};

export type LeadTimeStatus = "pending" | "on-time" | "warning" | "delayed";

export type LeadTimeRecord = {
  poNo: string;
  soNo?: string | null;
  poDate: string; // ISO date string
  createdAt?: string | null;
  createdDate?: string | null;
  creationDate?: string | null;
  approvedAt?: string | null;
  approvalDate?: string | null;
  approved_date?: string | null;
  dispatchAt?: string | null;
  dispatchDate?: string | null;
  dispatch_date?: string | null;
  deliveredAt?: string | null;
  deliveredDate?: string | null;
  deliveryDate?: string | null;
  approval?: number | null;
  dispatch?: number | null;
  delivered?: number | null;
  status?: LeadTimeStatus | null;
  // Per-cell status fields (optional) — normalized to LeadTimeStatus when available.
  approvalStatus?: LeadTimeStatus | null;
  fulfillmentStatus?: LeadTimeStatus | null;
  deliveryStatus?: LeadTimeStatus | null;
  // Product fields commonly returned by APIs — accepted from different sources
  product_name?: string;
  productName?: string;
  name?: string;
};

export type LeadTimeRow = LeadTimeRecord & {
  status: LeadTimeStatus;
  /** Optional computed total days to deliver, if available. */
  daysToDeliver?: number | null;
};

export type LeadTimeApiResponse =
  | LeadTimeRecord
  | LeadTimeRecord[]
  | {
      success?: boolean;
      data?: unknown;
      message?: string;
      error?: string;
    };
