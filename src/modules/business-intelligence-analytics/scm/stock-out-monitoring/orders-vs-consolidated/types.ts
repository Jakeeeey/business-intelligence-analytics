// src/modules/business-intelligence-analytics/scm/stock-out-monitoring/orders-vs-consolidated/types.ts

/** Raw row returned from /api/v1/order-discrepancies/all (or /supplier/{id}) */
export type OrdersRecord = {
  orderId: number;
  orderNo: string;
  orderDate: string; // "YYYY-MM-DD"
  orderStatus: string; // e.g. "For Consolidation", "Consolidated", "Delivered"
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
  discrepancyGap: number;
  netAmount: number;
};

export type DateRangePreset =
  | "yesterday"
  | "today"
  | "this-week"
  | "this-month"
  | "this-year"
  | "custom";

export type OrdersFilters = {
  dateRangePreset: DateRangePreset;
  dateFrom: string;
  dateTo: string;
  suppliers: string[];
  brands: string[];
  categories: string[];
  statuses: string[];
};

export type OrdersKpis = {
  /** Unique deduplicated order count */
  totalOrders: number;
  /** Orders whose status is NOT "For Consolidation" */
  totalConsolidated: number;
  /** Orders whose status IS "For Consolidation" */
  pendingOrders: number;
  /** (totalConsolidated / totalOrders) * 100 */
  consolidationRate: number;
  /** SUM of netAmount across all rows */
  totalNetAmount: number;
  /** SUM of orderedQuantity across all rows */
  totalOrderedQuantity: number;
  /** SUM of allocatedQuantity across all rows */
  totalConsolidatedQuantity: number;
  /** totalOrderedQuantity - totalConsolidatedQuantity */
  varianceQty: number;
  /** SUM((orderedQuantity - allocatedQuantity) * (netAmount / orderedQuantity)) */
  varianceAmount: number;
};

export type OrdersByPeriod = {
  period: string;
  totalOrders: number;
  consolidated: number;
  pending: number;
  /** (consolidated / totalOrders) * 100 */
  consolidationRate: number;
};

export type ProductTrend = {
  productId: number;
  productName: string;
  period: string; // bucket key depending on granularity
  totalOrdered: number;
  totalConsolidated: number;
  /** (totalConsolidated / totalOrdered) * 100 */
  consolidationRate: number;
};

export type ProductOrdersSummary = {
  productId: number;
  productName: string;
  brandName: string;
  categoryName: string;
  unit: string;
  totalOrdered: number;
  /** Sum of allocatedQuantity across filtered rows */
  totalConsolidated: number;
  /** Percentage: (totalConsolidated / totalOrdered) * 100 */
  consolidationRate: number;
  orderCount: number;
  netAmount: number;
  rank: number;
  percentShare: number;
};

export type SupplierOrdersSummary = {
  supplierId: number;
  supplierName: string;
  totalOrders: number;
  totalConsolidated: number;
  pendingOrders: number;
  totalNetAmount: number;
  totalOrdered: number;
  rank: number;
  percentShare: number;
};

/** Canonical (deduplicated) order-level view */
export type CanonicalOrder = {
  orderId: number;
  orderNo: string;
  orderDate: string;
  orderStatus: string;
  supplierName: string;
  supplierId: number;
  productCount: number;
  totalOrdered: number;
  totalAllocated: number;
  netAmount: number;
  /** true when orderStatus !== "For Consolidation" */
  isConsolidated: boolean;
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
