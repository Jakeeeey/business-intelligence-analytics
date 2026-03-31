// src/modules/business-intelligence-analytics/scm/stock-out-monitoring/orders-vs-consolidated/hooks/useOrderedvsConsolidated.ts
"use client";

import * as React from "react";
import { toast } from "sonner";
import type {
  OrdersRecord,
  OrdersFilters,
  OrdersKpis,
  OrdersByPeriod,
  ProductOrdersSummary,
  SupplierOrdersSummary,
  CanonicalOrder,
  Granularity,
  DateRangePreset,
  ProductTrend,
} from "../types";
import { fetchOrdersConsolidatedData } from "../providers/fetchProvider";

// An order with this status is considered "pending" / not yet consolidated.
const PENDING_STATUS = "For Consolidation";

// ── Date helpers ────────────────────────────────────────────────────────────

function parseDateLocal(s: string): Date {
  if (!s) return new Date(NaN);
  const m = s.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(NaN);
}

function fmtLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getBucketKey(date: Date, granularity: Granularity): string {
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const fmt = (dt: Date) =>
    `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;

  switch (granularity) {
    case "daily":
      return fmt(base);
    case "weekly": {
      const day = base.getDay();
      const daysFromMonday = (day + 6) % 7;
      const monday = new Date(base);
      monday.setDate(base.getDate() - daysFromMonday);
      return fmt(monday);
    }
    case "biweekly": {
      const day = base.getDay();
      const daysFromMonday = (day + 6) % 7;
      const weekStart = new Date(base);
      weekStart.setDate(base.getDate() - daysFromMonday);

      const yearStart = new Date(base.getFullYear(), 0, 1);
      const ysDaysFromMonday = (yearStart.getDay() + 6) % 7;
      const yearFirstMonday = new Date(yearStart);
      yearFirstMonday.setDate(yearStart.getDate() - ysDaysFromMonday);

      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      const weekIndex = Math.floor(
        (weekStart.getTime() - yearFirstMonday.getTime()) / msPerWeek,
      );
      const biIndex = Math.floor(weekIndex / 2);
      const bucketStart = new Date(
        yearFirstMonday.getTime() + biIndex * 14 * 24 * 60 * 60 * 1000,
      );
      return fmt(bucketStart);
    }
    case "monthly":
      return fmt(new Date(base.getFullYear(), base.getMonth(), 1));
    case "bimonthly": {
      const startMonth = base.getMonth() - (base.getMonth() % 2);
      return fmt(new Date(base.getFullYear(), startMonth, 1));
    }
    case "quarterly": {
      const startMonth = Math.floor(base.getMonth() / 3) * 3;
      return fmt(new Date(base.getFullYear(), startMonth, 1));
    }
    case "semiannually": {
      const startMonth = base.getMonth() < 6 ? 0 : 6;
      return fmt(new Date(base.getFullYear(), startMonth, 1));
    }
    case "yearly":
      return fmt(new Date(base.getFullYear(), 0, 1));
    default:
      return fmt(base);
  }
}

// ── Default filters ──────────────────────────────────────────────────────────

function getDefaultFilters(): OrdersFilters {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    dateRangePreset: "this-month",
    dateFrom: fmtLocalDate(monthStart),
    dateTo: fmtLocalDate(monthEnd),
    suppliers: [],
    brands: [],
    categories: [],
    statuses: [],
  };
}

export function getDateRangeFromPreset(
  preset: DateRangePreset,
  customFrom: string,
  customTo: string,
): { from: string; to: string } {
  const now = new Date();
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  switch (preset) {
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: fmt(y), to: fmt(y) };
    }
    case "today":
      return { from: fmt(now), to: fmt(now) };
    case "this-week": {
      const ws = new Date(now);
      ws.setDate(ws.getDate() - ws.getDay());
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      return { from: fmt(ws), to: fmt(we) };
    }
    case "this-month": {
      const ms = new Date(now.getFullYear(), now.getMonth(), 1);
      const me = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: fmt(ms), to: fmt(me) };
    }
    case "this-year": {
      const ys = new Date(now.getFullYear(), 0, 1);
      const ye = new Date(now.getFullYear(), 11, 31);
      return { from: fmt(ys), to: fmt(ye) };
    }
    case "custom":
      return { from: customFrom, to: customTo };
    default:
      return { from: fmt(now), to: fmt(now) };
  }
}

// ── Deduplication ────────────────────────────────────────────────────────────

/**
 * Remove duplicate rows by (orderId, productId).
 * The API join can produce Cartesian-product duplicates; keeping only the
 * first occurrence per unique key prevents inflated KPIs/charts.
 */
function deduplicateRecords(records: OrdersRecord[]): OrdersRecord[] {
  const seen = new Set<string>();
  return records.filter((r) => {
    const key = `${r.orderId}:${r.productId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useOrderedvsConsolidated() {
  const [rawData, setRawData] = React.useState<OrdersRecord[]>([]);
  const [filteredData, setFilteredData] = React.useState<OrdersRecord[]>([]);
  const [filters, setFilters] =
    React.useState<OrdersFilters>(getDefaultFilters);
  const [loading, setLoading] = React.useState(false);
  const [loadedOnce, setLoadedOnce] = React.useState(false);
  const [granularity, setGranularity] = React.useState<Granularity>("monthly");

  const abortControllerRef = React.useRef<AbortController | null>(null);
  const activeToastRef = React.useRef<string | number | null>(null);

  // ── Sync date range when preset changes ──────────────────────────────────
  React.useEffect(() => {
    if (filters.dateRangePreset !== "custom") {
      const { from, to } = getDateRangeFromPreset(
        filters.dateRangePreset,
        filters.dateFrom,
        filters.dateTo,
      );
      if (filters.dateFrom !== from || filters.dateTo !== to) {
        setFilters((prev) => ({ ...prev, dateFrom: from, dateTo: to }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.dateRangePreset]);

  // ── Cleanup on unmount ───────────────────────────────────────────────────
  React.useEffect(() => {
    return () => {
      if (activeToastRef.current !== null)
        toast.dismiss(activeToastRef.current);
      abortControllerRef.current?.abort();
    };
  }, []);

  // ── Client-side filtering (runs on rawData + live filters, including date range) ─────────────
  React.useEffect(() => {
    let filtered = rawData;

    // Date range filter — done here, not server-side
    const fromDate = parseDateLocal(filters.dateFrom);
    const toDate = parseDateLocal(filters.dateTo);
    if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
      const toEnd = new Date(toDate);
      toEnd.setHours(23, 59, 59, 999);
      filtered = filtered.filter((r) => {
        const d = parseDateLocal(r.orderDate);
        return !isNaN(d.getTime()) && d >= fromDate && d <= toEnd;
      });
    }

    if (filters.suppliers.length > 0)
      filtered = filtered.filter((r) =>
        filters.suppliers.includes(r.supplierName),
      );
    if (filters.brands.length > 0)
      filtered = filtered.filter((r) => filters.brands.includes(r.brandName));
    if (filters.categories.length > 0)
      filtered = filtered.filter((r) =>
        filters.categories.includes(r.categoryName),
      );
    if (filters.statuses.length > 0)
      filtered = filtered.filter((r) =>
        filters.statuses.includes(r.orderStatus),
      );

    setFilteredData(filtered);
  }, [
    rawData,
    filters.dateFrom,
    filters.dateTo,
    filters.suppliers,
    filters.brands,
    filters.categories,
    filters.statuses,
  ]);

  // ── Date-only filtered data (base for faceted counts) ──────────────────
  const dateFilteredData = React.useMemo(() => {
    let d = rawData;
    const fromDate = parseDateLocal(filters.dateFrom);
    const toDate = parseDateLocal(filters.dateTo);
    if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
      const toEnd = new Date(toDate);
      toEnd.setHours(23, 59, 59, 999);
      d = d.filter((r) => {
        const dt = parseDateLocal(r.orderDate);
        return !isNaN(dt.getTime()) && dt >= fromDate && dt <= toEnd;
      });
    }
    return d;
  }, [rawData, filters.dateFrom, filters.dateTo]);

  // ── Unique filter lists (from date-filtered data) ────────────────────────
  const uniqueSuppliers = React.useMemo(
    () =>
      [...new Set(dateFilteredData.map((r) => r.supplierName))]
        .filter(Boolean)
        .sort(),
    [dateFilteredData],
  );
  const uniqueBrands = React.useMemo(
    () =>
      [...new Set(dateFilteredData.map((r) => r.brandName))]
        .filter(Boolean)
        .sort(),
    [dateFilteredData],
  );
  const uniqueCategories = React.useMemo(
    () =>
      [...new Set(dateFilteredData.map((r) => r.categoryName))]
        .filter(Boolean)
        .sort(),
    [dateFilteredData],
  );
  const uniqueStatuses = React.useMemo(
    () =>
      [...new Set(dateFilteredData.map((r) => r.orderStatus))]
        .filter(Boolean)
        .sort(),
    [dateFilteredData],
  );

  const supplierCounts = React.useMemo(() => {
    // faceted: filter by brands + categories + statuses (NOT suppliers)
    let base = dateFilteredData;
    if (filters.brands.length > 0)
      base = base.filter((r) => filters.brands.includes(r.brandName));
    if (filters.categories.length > 0)
      base = base.filter((r) => filters.categories.includes(r.categoryName));
    if (filters.statuses.length > 0)
      base = base.filter((r) => filters.statuses.includes(r.orderStatus));
    const counts: Record<string, number> = {};
    for (const r of base)
      counts[r.supplierName] = (counts[r.supplierName] || 0) + 1;
    return counts;
  }, [dateFilteredData, filters.brands, filters.categories, filters.statuses]);

  const brandCounts = React.useMemo(() => {
    // faceted: filter by suppliers + categories + statuses (NOT brands)
    let base = dateFilteredData;
    if (filters.suppliers.length > 0)
      base = base.filter((r) => filters.suppliers.includes(r.supplierName));
    if (filters.categories.length > 0)
      base = base.filter((r) => filters.categories.includes(r.categoryName));
    if (filters.statuses.length > 0)
      base = base.filter((r) => filters.statuses.includes(r.orderStatus));
    const counts: Record<string, number> = {};
    for (const r of base) counts[r.brandName] = (counts[r.brandName] || 0) + 1;
    return counts;
  }, [
    dateFilteredData,
    filters.suppliers,
    filters.categories,
    filters.statuses,
  ]);

  const categoryCounts = React.useMemo(() => {
    // faceted: filter by suppliers + brands + statuses (NOT categories)
    let base = dateFilteredData;
    if (filters.suppliers.length > 0)
      base = base.filter((r) => filters.suppliers.includes(r.supplierName));
    if (filters.brands.length > 0)
      base = base.filter((r) => filters.brands.includes(r.brandName));
    if (filters.statuses.length > 0)
      base = base.filter((r) => filters.statuses.includes(r.orderStatus));
    const counts: Record<string, number> = {};
    for (const r of base)
      counts[r.categoryName] = (counts[r.categoryName] || 0) + 1;
    return counts;
  }, [dateFilteredData, filters.suppliers, filters.brands, filters.statuses]);

  const statusCounts = React.useMemo(() => {
    // faceted: filter by suppliers + brands + categories (NOT statuses)
    let base = dateFilteredData;
    if (filters.suppliers.length > 0)
      base = base.filter((r) => filters.suppliers.includes(r.supplierName));
    if (filters.brands.length > 0)
      base = base.filter((r) => filters.brands.includes(r.brandName));
    if (filters.categories.length > 0)
      base = base.filter((r) => filters.categories.includes(r.categoryName));
    const counts: Record<string, number> = {};
    for (const r of base)
      counts[r.orderStatus] = (counts[r.orderStatus] || 0) + 1;
    return counts;
  }, [dateFilteredData, filters.suppliers, filters.brands, filters.categories]);

  // ── Canonical orders (deduplicated) ───────────────────────────────────────
  const canonicalOrders = React.useMemo<CanonicalOrder[]>(() => {
    const map = new Map<number, CanonicalOrder & { productIds: Set<number> }>();

    for (const r of filteredData) {
      const e = map.get(r.orderId);
      if (e) {
        e.totalOrdered += r.orderedQuantity;
        e.totalAllocated += r.allocatedQuantity;
        e.netAmount += r.netAmount;
        e.productIds.add(r.productId);
      } else {
        map.set(r.orderId, {
          orderId: r.orderId,
          orderNo: r.orderNo,
          orderDate: r.orderDate,
          orderStatus: r.orderStatus,
          supplierName: r.supplierName,
          supplierId: r.supplierId,
          productCount: 1,
          totalOrdered: r.orderedQuantity,
          totalAllocated: r.allocatedQuantity,
          netAmount: r.netAmount,
          isConsolidated: r.orderStatus !== PENDING_STATUS,
          productIds: new Set([r.productId]),
        });
      }
    }

    return [...map.values()]
      .map((o) => ({
        orderId: o.orderId,
        orderNo: o.orderNo,
        orderDate: o.orderDate,
        orderStatus: o.orderStatus,
        supplierName: o.supplierName,
        supplierId: o.supplierId,
        productCount: o.productIds.size,
        totalOrdered: o.totalOrdered,
        totalAllocated: o.totalAllocated,
        netAmount: o.netAmount,
        isConsolidated: o.isConsolidated,
      }))
      .sort((a, b) => b.orderDate.localeCompare(a.orderDate));
  }, [filteredData]);

  const pendingOrders = React.useMemo(
    () => canonicalOrders.filter((o) => !o.isConsolidated),
    [canonicalOrders],
  );

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = React.useMemo<OrdersKpis>(() => {
    if (!canonicalOrders.length)
      return {
        totalOrders: 0,
        totalConsolidated: 0,
        pendingOrders: 0,
        consolidationRate: 0,
        totalNetAmount: 0,
        totalOrderedQuantity: 0,
        totalConsolidatedQuantity: 0,
        varianceQty: 0,
        varianceAmount: 0,
      };

    const totalOrders = canonicalOrders.length;
    const totalConsolidated = canonicalOrders.filter(
      (o) => o.isConsolidated,
    ).length;
    const pendingCount = totalOrders - totalConsolidated;
    const totalNetAmount = filteredData.reduce(
      (s, r) => s + (r.netAmount ?? 0),
      0,
    );
    const totalOrderedQuantity = filteredData.reduce(
      (s, r) => s + (r.orderedQuantity ?? 0),
      0,
    );
    const totalConsolidatedQuantity = filteredData.reduce(
      (s, r) => s + (r.allocatedQuantity ?? 0),
      0,
    );
    const varianceQty = totalOrderedQuantity - totalConsolidatedQuantity;
    const varianceAmount = filteredData.reduce((s, r) => {
      const netPricePerUnit =
        r.orderedQuantity > 0 ? (r.netAmount ?? 0) / r.orderedQuantity : 0;
      return s + (r.orderedQuantity - r.allocatedQuantity) * netPricePerUnit;
    }, 0);

    return {
      totalOrders,
      totalConsolidated,
      pendingOrders: pendingCount,
      consolidationRate:
        totalOrders > 0 ? (totalConsolidated / totalOrders) * 100 : 0,
      totalNetAmount,
      totalOrderedQuantity,
      totalConsolidatedQuantity,
      varianceQty,
      varianceAmount,
    };
  }, [canonicalOrders, filteredData]);

  // ── Consolidation status distribution (for donut chart) ───────────────────
  const consolidationStatusDistribution = React.useMemo(
    () => [
      {
        name: "Consolidated",
        value: kpis.totalConsolidated,
      },
      {
        name: "For Consolidation",
        value: kpis.pendingOrders,
      },
    ],
    [kpis],
  );

  // ── Product summaries ──────────────────────────────────────────────────────
  const productSummaries = React.useMemo<ProductOrdersSummary[]>(() => {
    const map = new Map<
      number,
      Omit<ProductOrdersSummary, "rank" | "percentShare"> & {
        orderIds: Set<number>;
      }
    >();

    for (const r of filteredData) {
      const e = map.get(r.productId);
      if (e) {
        e.totalOrdered += r.orderedQuantity;
        e.netAmount += r.netAmount;
        e.orderIds.add(r.orderId);
        e.totalConsolidated += r.allocatedQuantity;
      } else {
        map.set(r.productId, {
          productId: r.productId,
          productName: r.productName,
          brandName: r.brandName,
          categoryName: r.categoryName,
          unit: r.unit,
          totalOrdered: r.orderedQuantity,
          totalConsolidated: r.allocatedQuantity,
          consolidationRate:
            r.orderedQuantity > 0
              ? (r.allocatedQuantity / r.orderedQuantity) * 100
              : 0,
          orderCount: 1,
          netAmount: r.netAmount,
          orderIds: new Set([r.orderId]),
        });
      }
    }

    const list = [...map.values()].map((p) => ({
      productId: p.productId,
      productName: p.productName,
      brandName: p.brandName,
      categoryName: p.categoryName,
      unit: p.unit,
      totalOrdered: p.totalOrdered,
      totalConsolidated: p.totalConsolidated,
      orderCount: p.orderIds.size,
      netAmount: p.netAmount,
      rank: 0,
      percentShare: 0,
    }));

    list.sort((a, b) => b.totalOrdered - a.totalOrdered);
    const totalOrdered = list.reduce((s, p) => s + p.totalOrdered, 0);

    return list.map((p, i) => ({
      ...p,
      rank: i + 1,
      percentShare:
        totalOrdered > 0 ? (p.totalOrdered / totalOrdered) * 100 : 0,
      consolidationRate:
        p.totalOrdered > 0 ? (p.totalConsolidated / p.totalOrdered) * 100 : 0,
    }));
  }, [filteredData]);

  // ── Supplier summaries ─────────────────────────────────────────────────────
  const supplierSummaries = React.useMemo<SupplierOrdersSummary[]>(() => {
    const map = new Map<
      number,
      Omit<SupplierOrdersSummary, "rank" | "percentShare"> & {
        allOrderIds: Set<number>;
        consolidatedOrderIds: Set<number>;
      }
    >();

    for (const r of filteredData) {
      const isConsolidated = r.orderStatus !== PENDING_STATUS;
      const e = map.get(r.supplierId);
      if (e) {
        e.totalOrdered += r.orderedQuantity;
        e.totalNetAmount += r.netAmount;
        e.allOrderIds.add(r.orderId);
        if (isConsolidated) e.consolidatedOrderIds.add(r.orderId);
      } else {
        map.set(r.supplierId, {
          supplierId: r.supplierId,
          supplierName: r.supplierName,
          totalOrders: 1,
          totalConsolidated: isConsolidated ? 1 : 0,
          pendingOrders: isConsolidated ? 0 : 1,
          totalNetAmount: r.netAmount,
          totalOrdered: r.orderedQuantity,
          allOrderIds: new Set([r.orderId]),
          consolidatedOrderIds: new Set(isConsolidated ? [r.orderId] : []),
        });
      }
    }

    const list = [...map.values()].map((s) => ({
      supplierId: s.supplierId,
      supplierName: s.supplierName,
      totalOrders: s.allOrderIds.size,
      totalConsolidated: s.consolidatedOrderIds.size,
      pendingOrders: s.allOrderIds.size - s.consolidatedOrderIds.size,
      totalNetAmount: s.totalNetAmount,
      totalOrdered: s.totalOrdered,
      rank: 0,
      percentShare: 0,
    }));

    list.sort((a, b) => b.totalOrders - a.totalOrders);
    const totalOrders = list.reduce((s, sup) => s + sup.totalOrders, 0);

    return list.map((s, i) => ({
      ...s,
      rank: i + 1,
      percentShare: totalOrders > 0 ? (s.totalOrders / totalOrders) * 100 : 0,
    }));
  }, [filteredData]);

  // ── Time-series ───────────────────────────────────────────────────────────
  const ordersByPeriod = React.useMemo<OrdersByPeriod[]>(() => {
    // Bucket by canonical order (deduplicated by orderId per period)
    const buckets = new Map<
      string,
      { orderIds: Set<number>; consolidatedIds: Set<number> }
    >();

    for (const r of filteredData) {
      const date = parseDateLocal(r.orderDate);
      if (isNaN(date.getTime())) continue;
      const key = getBucketKey(date, granularity);
      const isConsolidated = r.orderStatus !== PENDING_STATUS;

      const e = buckets.get(key);
      if (e) {
        e.orderIds.add(r.orderId);
        if (isConsolidated) e.consolidatedIds.add(r.orderId);
      } else {
        buckets.set(key, {
          orderIds: new Set([r.orderId]),
          consolidatedIds: new Set(isConsolidated ? [r.orderId] : []),
        });
      }
    }

    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => {
        const total = data.orderIds.size;
        const consolidated = data.consolidatedIds.size;
        const pending = total - consolidated;
        return {
          period,
          totalOrders: total,
          consolidated,
          pending,
          consolidationRate: total > 0 ? (consolidated / total) * 100 : 0,
        };
      });
  }, [filteredData, granularity]);

  // ── Product trends (time-series per product) ─────────────────────────────
  const productTrends = React.useMemo((): ProductTrend[] => {
    const map = new Map<
      string,
      {
        productId: number;
        productName: string;
        period: string;
        totalOrdered: number;
        totalConsolidated: number;
      }
    >();

    for (const r of filteredData) {
      const date = parseDateLocal(r.orderDate);
      if (isNaN(date.getTime())) continue;
      const period = getBucketKey(date, granularity);
      const key = `${r.productId}||${period}`;
      const e = map.get(key);
      if (e) {
        e.totalOrdered += r.orderedQuantity;
        e.totalConsolidated += r.allocatedQuantity;
      } else {
        map.set(key, {
          productId: r.productId,
          productName: r.productName,
          period,
          totalOrdered: r.orderedQuantity,
          totalConsolidated: r.allocatedQuantity,
        });
      }
    }

    return [...map.values()]
      .map((v) => ({
        productId: v.productId,
        productName: v.productName,
        period: v.period,
        totalOrdered: v.totalOrdered,
        totalConsolidated: v.totalConsolidated,
        consolidationRate:
          v.totalOrdered > 0 ? (v.totalConsolidated / v.totalOrdered) * 100 : 0,
      }))
      .sort((a, b) =>
        a.productId === b.productId
          ? a.period.localeCompare(b.period)
          : a.productId - b.productId,
      );
  }, [filteredData, granularity]);

  // ── Data loading — no date params; filtering is client-side ─────────────
  const loadData = React.useCallback(async () => {
    abortControllerRef.current?.abort();
    if (activeToastRef.current !== null) toast.dismiss(activeToastRef.current);

    abortControllerRef.current = new AbortController();
    setLoading(true);

    const MAX_RETRIES = 5;
    let lastError: unknown = null;
    let cachedDataAvailable = false;
    let loadingToast: string | number = "";
    let hasShownCacheToast = false;

    try {
      loadingToast = toast.loading("Loading data...");
      activeToastRef.current = loadingToast;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        if (abortControllerRef.current?.signal.aborted) return;
        try {
          const data = await fetchOrdersConsolidatedData(
            undefined,
            undefined,
            abortControllerRef.current.signal,
            {
              onCacheData: (cached) => {
                setRawData(deduplicateRecords(cached));
                setLoadedOnce(true);
                cachedDataAvailable = true;
                if (!hasShownCacheToast) {
                  toast.info("Showing cached data, updating...", {
                    id: loadingToast,
                    duration: 10000,
                  });
                  hasShownCacheToast = true;
                }
              },
            },
          );

          setRawData(deduplicateRecords(data));
          setLoadedOnce(true);
          toast.success("Data loaded successfully.", {
            id: loadingToast,
            duration: 5000,
          });
          activeToastRef.current = null;
          return;
        } catch (e: unknown) {
          lastError = e;
          const err = e as { name?: string; status?: number };
          if (
            err.name === "AbortError" ||
            abortControllerRef.current?.signal.aborted
          )
            return;
          const shouldRetry =
            (!err?.status || (err.status >= 500 && err.status < 600)) &&
            attempt < MAX_RETRIES;
          if (shouldRetry) {
            toast.loading(
              cachedDataAvailable
                ? `Showing cached data, retrying ${attempt}/${MAX_RETRIES}...`
                : `Fetching data ${attempt}/${MAX_RETRIES}...`,
              { id: loadingToast },
            );
          } else break;
        }
      }
      throw lastError;
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string; status?: number };
      if (
        err.name === "AbortError" ||
        abortControllerRef.current?.signal.aborted
      )
        return;
      if (err.status === 401) {
        toast.error("Session expired. Please log in again.", {
          id: loadingToast,
          duration: 4000,
        });
      } else {
        toast.error(err.message || "Failed to load data. Please try again.", {
          id: loadingToast,
          duration: 6000,
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Auto-fetch once on mount — date filtering is done client-side ────────
  React.useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Category summaries ─────────────────────────────────────────────────────
  const categorySummaries = React.useMemo(() => {
    const map = new Map<
      string,
      {
        totalOrdered: number;
        allOrderIds: Set<number>;
        pendingIds: Set<number>;
      }
    >();

    for (const r of filteredData) {
      const key = r.categoryName || "(unknown)";
      const isPending = r.orderStatus === PENDING_STATUS;
      const e = map.get(key);
      if (e) {
        e.totalOrdered += r.orderedQuantity;
        e.allOrderIds.add(r.orderId);
        if (isPending) e.pendingIds.add(r.orderId);
      } else {
        map.set(key, {
          totalOrdered: r.orderedQuantity,
          allOrderIds: new Set([r.orderId]),
          pendingIds: new Set(isPending ? [r.orderId] : []),
        });
      }
    }

    return [...map.entries()]
      .map(([name, d]) => ({
        name,
        totalOrdered: d.totalOrdered,
        orderCount: d.allOrderIds.size,
        pendingOrders: d.pendingIds.size,
      }))
      .sort((a, b) => b.totalOrdered - a.totalOrdered);
  }, [filteredData]);

  return {
    rawData,
    filteredData,
    filters,
    setFilters,
    loading,
    loadedOnce,
    granularity,
    setGranularity,
    kpis,
    canonicalOrders,
    pendingOrders,
    productSummaries,
    supplierSummaries,
    categorySummaries,
    ordersByPeriod,
    productTrends,
    consolidationStatusDistribution,
    uniqueSuppliers,
    uniqueBrands,
    uniqueCategories,
    uniqueStatuses,
    supplierCounts,
    brandCounts,
    categoryCounts,
    statusCounts,
  };
}
