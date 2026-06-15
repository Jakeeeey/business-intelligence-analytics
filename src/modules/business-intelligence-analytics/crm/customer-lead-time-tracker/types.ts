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
  customerCode: string;
  poNo: string;
};

export type LeadTimeProductOption = {
  id: string;
  name: string;
  code?: string;
  description?: string | null;
};

export type LeadTimeStatus = "pending" | "on-time" | "warning" | "delayed";

export type LeadTimeRecord = {
  customerCode: string;
  customerName: string;
  poNo: string;
  soNo: string;
  purchasedDate: string | null;
  createdDate: string | null;
  approvedDate: string | null;
  pickedConsoDate: string | null;
  dispatchedDate: string | null;
  deliveredDate: string | null;
  totalDays: number | null;
};

export type LeadTimeRow = LeadTimeRecord & {
  status: LeadTimeStatus;
  approvalStatus: LeadTimeStatus;
  fulfillmentStatus: LeadTimeStatus;
  deliveryStatus: LeadTimeStatus;
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
