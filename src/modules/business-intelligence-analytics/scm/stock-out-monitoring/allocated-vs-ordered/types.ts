// src/modules/business-intelligence-analytics/scm/stock-out-monitoring/allocated-vs-ordered/types.ts

/** Raw row returned from /api/v1/order-discrepancies/all (or /supplier/{id}) */
export type AllocatedOrderedRecord = {
  orderId: number;
  orderNo: string;
  orderDate: string; // "YYYY-MM-DD"
  orderStatus: string;
  supplierId: number;
  supplierName: string;
  productId: number;
  productName: string;
  productCode: string | null;
  unit: string;
  brandName: string;
  categoryName: string;
  unitPrice: number;
  orderedQuantity: number;
  allocatedQuantity: number;
  discrepancyGap: number; // orderedQuantity - allocatedQuantity
  netAmount: number;
};

export type DateRangePreset =
  | "yesterday"
  | "today"
  | "this-week"
  | "this-month"
  | "this-year"
  | "custom";

export type AllocationFilters = {
  dateRangePreset: DateRangePreset;
  dateFrom: string;
  dateTo: string;
  suppliers: string[];
  brands: string[];
  categories: string[];
  statuses: string[];
};

export type AllocationKpis = {
  /** SUM of orderedQuantity across all filtered rows */
  totalOrderedQuantity: number;
  /** SUM of allocatedQuantity across all filtered rows */
  totalAllocatedQuantity: number;
  /** SUM of discrepancyGap — total units unallocated */
  allocationGap: number;
  /** (totalAllocated / totalOrdered) * 100 */
  allocationRate: number;
  /** Unique orderIds where any product line has discrepancyGap > 0 */
  shortageOrders: number;
  /** Unique orderIds (canonical deduplication) */
  totalOrders: number;
  /** SUM of netAmount */
  totalNetAmount: number;
};

export type AllocationByPeriod = {
  period: string;
  totalOrdered: number;
  totalAllocated: number;
  allocationGap: number;
  /** (totalAllocated / totalOrdered) * 100 */
  allocationRate: number;
  /** Unique orders with gap > 0 in this period */
  shortageOrders: number;
};

export type ProductAllocationSummary = {
  productId: number;
  productName: string;
  brandName: string;
  categoryName: string;
  unit: string;
  totalOrdered: number;
  totalAllocated: number;
  allocationGap: number;
  allocationRate: number;
  netAmount: number;
  rank: number;
  percentShare: number;
};

export type SupplierAllocationSummary = {
  supplierId: number;
  supplierName: string;
  totalOrdered: number;
  totalAllocated: number;
  allocationGap: number;
  allocationRate: number;
  /** Unique deduplicated orders from this supplier */
  orderCount: number;
  netAmount: number;
  rank: number;
  percentShare: number;
};

/** Canonical (deduplicated) order-level view */
export type OrderAllocationSummary = {
  orderId: number;
  orderNo: string;
  orderDate: string;
  orderStatus: string;
  supplierName: string;
  supplierId: number;
  /** Number of distinct product lines */
  productCount: number;
  totalOrdered: number;
  totalAllocated: number;
  allocationGap: number;
  netAmount: number;
  isShortage: boolean;
  allocationRate: number;
};

export type Granularity =
  | "daily"
  | "weekly"
  | "biweekly"
  | "semimonth"
  | "monthly"
  | "quarterly"
  | "yearly";

// Recharts tooltip prop types
export type LineTooltipProps = {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string | number;
};

export type BarTooltipProps = {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    payload?: Record<string, unknown>;
  }>;
};
