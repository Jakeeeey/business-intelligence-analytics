// src/modules/business-intelligence-analytics/scm/stock-out-monitoring/allocated-vs-ordered/hooks/useAllocatedvsOrdered.ts
"use client";

import * as React from "react";
import { toast } from "sonner";
import type {
  AllocatedOrderedRecord,
  AllocationFilters,
  AllocationKpis,
  AllocationByPeriod,
  ProductAllocationSummary,
  SupplierAllocationSummary,
  OrderAllocationSummary,
  Granularity,
  DateRangePreset,
} from "../types";
import { fetchAllocatedOrderedData } from "../providers/fetchProvider";

// ── Date helpers ────────────────────────────────────────────────────────────

/** Parse "YYYY-MM-DD" as local midnight — avoids UTC timezone shift. */
function parseDateLocal(s: string): Date {
  if (!s) return new Date(NaN);
  const m = s.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(NaN);
}

/** Format a local Date as "YYYY-MM-DD". */
function fmtLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Map a date to the period bucket key for the chosen granularity. */
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

function getDefaultFilters(): AllocationFilters {
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
function deduplicateRecords(
  records: AllocatedOrderedRecord[],
): AllocatedOrderedRecord[] {
  const seen = new Set<string>();
  return records.filter((r) => {
    const key = `${r.orderId}:${r.productId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getDerivedGap(r: AllocatedOrderedRecord): number {
  return (r.orderedQuantity ?? 0) - (r.allocatedQuantity ?? 0);
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useAllocatedvsOrdered() {
  const [rawData, setRawData] = React.useState<AllocatedOrderedRecord[]>([]);
  const [filteredData, setFilteredData] = React.useState<
    AllocatedOrderedRecord[]
  >([]);
  const [filters, setFilters] =
    React.useState<AllocationFilters>(getDefaultFilters);
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
      // set toDate to end-of-day so inclusive
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

  // ── Date-filtered base (shared by faceted counts) ───────────────────────
  const dateFilteredData = React.useMemo(() => {
    const fromDate = parseDateLocal(filters.dateFrom);
    const toDate = parseDateLocal(filters.dateTo);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return rawData;
    const toEnd = new Date(toDate);
    toEnd.setHours(23, 59, 59, 999);
    return rawData.filter((r) => {
      const d = parseDateLocal(r.orderDate);
      return !isNaN(d.getTime()) && d >= fromDate && d <= toEnd;
    });
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

  // ── Faceted counts: each dimension counted from data filtered by all OTHER active filters ──
  const supplierCounts = React.useMemo(() => {
    // filter by brands + categories + statuses (NOT suppliers)
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
    // filter by suppliers + categories + statuses (NOT brands)
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
    // filter by suppliers + brands + statuses (NOT categories)
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
    // filter by suppliers + brands + categories (NOT statuses)
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

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const kpis = React.useMemo<AllocationKpis>(() => {
    if (!filteredData.length)
      return {
        totalOrderedQuantity: 0,
        totalAllocatedQuantity: 0,
        allocationGap: 0,
        allocationRate: 0,
        shortageOrders: 0,
        totalOrders: 0,
        totalNetAmount: 0,
      };

    let totalOrdered = 0;
    let totalAllocated = 0;
    let allocationGap = 0;
    let totalNetAmount = 0;
    const uniqueOrderIds = new Set<number>();
    const shortageOrderIds = new Set<number>();

    for (const r of filteredData) {
      const lineGap = getDerivedGap(r);
      totalOrdered += r.orderedQuantity;
      totalAllocated += r.allocatedQuantity;
      allocationGap += lineGap;
      totalNetAmount += r.netAmount;
      uniqueOrderIds.add(r.orderId);
      if (lineGap > 0) shortageOrderIds.add(r.orderId);
    }

    return {
      totalOrderedQuantity: totalOrdered,
      totalAllocatedQuantity: totalAllocated,
      allocationGap,
      allocationRate:
        totalOrdered > 0 ? (totalAllocated / totalOrdered) * 100 : 0,
      shortageOrders: shortageOrderIds.size,
      totalOrders: uniqueOrderIds.size,
      totalNetAmount,
    };
  }, [filteredData]);

  // ── Product summaries ─────────────────────────────────────────────────────
  const productSummaries = React.useMemo<ProductAllocationSummary[]>(() => {
    const map = new Map<
      number,
      Omit<ProductAllocationSummary, "rank" | "percentShare" | "allocationRate">
    >();

    for (const r of filteredData) {
      const lineGap = getDerivedGap(r);
      const e = map.get(r.productId);
      if (e) {
        e.totalOrdered += r.orderedQuantity;
        e.totalAllocated += r.allocatedQuantity;
        e.allocationGap += lineGap;
        e.netAmount += r.netAmount;
      } else {
        map.set(r.productId, {
          productId: r.productId,
          productName: r.productName,
          brandName: r.brandName,
          categoryName: r.categoryName,
          unit: r.unit,
          totalOrdered: r.orderedQuantity,
          totalAllocated: r.allocatedQuantity,
          allocationGap: lineGap,
          netAmount: r.netAmount,
        });
      }
    }

    const list = [...map.values()].map((p) => ({
      ...p,
      allocationRate:
        p.totalOrdered > 0 ? (p.totalAllocated / p.totalOrdered) * 100 : 0,
    }));

    list.sort((a, b) => b.allocationGap - a.allocationGap);
    const totalGap = list.reduce((s, p) => s + p.allocationGap, 0);

    return list.map((p, i) => ({
      ...p,
      rank: i + 1,
      percentShare: totalGap > 0 ? (p.allocationGap / totalGap) * 100 : 0,
    }));
  }, [filteredData]);

  // ── Supplier summaries ────────────────────────────────────────────────────
  const supplierSummaries = React.useMemo<SupplierAllocationSummary[]>(() => {
    const map = new Map<
      number,
      Omit<
        SupplierAllocationSummary,
        "rank" | "percentShare" | "allocationRate"
      > & { orderIds: Set<number> }
    >();

    for (const r of filteredData) {
      const lineGap = getDerivedGap(r);
      const e = map.get(r.supplierId);
      if (e) {
        e.totalOrdered += r.orderedQuantity;
        e.totalAllocated += r.allocatedQuantity;
        e.allocationGap += lineGap;
        e.netAmount += r.netAmount;
        e.orderIds.add(r.orderId);
      } else {
        map.set(r.supplierId, {
          supplierId: r.supplierId,
          supplierName: r.supplierName,
          totalOrdered: r.orderedQuantity,
          totalAllocated: r.allocatedQuantity,
          allocationGap: lineGap,
          orderCount: 1,
          netAmount: r.netAmount,
          orderIds: new Set([r.orderId]),
        });
      }
    }

    const list = [...map.values()].map((s) => ({
      supplierId: s.supplierId,
      supplierName: s.supplierName,
      totalOrdered: s.totalOrdered,
      totalAllocated: s.totalAllocated,
      allocationGap: s.allocationGap,
      allocationRate:
        s.totalOrdered > 0 ? (s.totalAllocated / s.totalOrdered) * 100 : 0,
      orderCount: s.orderIds.size,
      netAmount: s.netAmount,
      rank: 0,
      percentShare: 0,
    }));

    list.sort((a, b) => b.allocationGap - a.allocationGap);
    const totalGap = list.reduce((s, p) => s + p.allocationGap, 0);

    return list.map((s, i) => ({
      ...s,
      rank: i + 1,
      percentShare: totalGap > 0 ? (s.allocationGap / totalGap) * 100 : 0,
    }));
  }, [filteredData]);

  // ── Canonical order summaries (deduplicated) ──────────────────────────────
  const orderSummaries = React.useMemo<OrderAllocationSummary[]>(() => {
    const map = new Map<
      number,
      OrderAllocationSummary & { productIds: Set<number> }
    >();

    for (const r of filteredData) {
      const lineGap = getDerivedGap(r);
      const e = map.get(r.orderId);
      if (e) {
        e.totalOrdered += r.orderedQuantity;
        e.totalAllocated += r.allocatedQuantity;
        e.allocationGap += lineGap;
        e.netAmount += r.netAmount;
        e.productIds.add(r.productId);
        if (lineGap > 0) e.isShortage = true;
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
          allocationGap: lineGap,
          netAmount: r.netAmount,
          isShortage: lineGap > 0,
          allocationRate: 0,
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
        allocationGap: o.allocationGap,
        netAmount: o.netAmount,
        isShortage: o.isShortage,
        allocationRate:
          o.totalOrdered > 0 ? (o.totalAllocated / o.totalOrdered) * 100 : 0,
      }))
      .sort((a, b) => b.orderDate.localeCompare(a.orderDate));
  }, [filteredData]);

  const shortageSummaries = React.useMemo(
    () => orderSummaries.filter((o) => o.isShortage),
    [orderSummaries],
  );

  // ── Allocation status distribution (for donut chart) ─────────────────────
  const allocationStatusDistribution = React.useMemo(() => {
    let fullyAllocated = 0;
    let partiallyAllocated = 0;
    let notAllocated = 0;

    for (const o of orderSummaries) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      if (o.allocationGap === 0) fullyAllocated++;
      else if (o.totalAllocated > 0) partiallyAllocated++;
      else notAllocated++;
    }

    return [
      // { name: "Fully Allocated", value: fullyAllocated },
      { name: "Partially Allocated", value: partiallyAllocated },
      { name: "Not Allocated", value: notAllocated },
    ];
  }, [orderSummaries]);

  // ── Time-series ───────────────────────────────────────────────────────────
  const allocationByPeriod = React.useMemo<AllocationByPeriod[]>(() => {
    const buckets = new Map<
      string,
      {
        totalOrdered: number;
        totalAllocated: number;
        allocationGap: number;
        shortageOrderIds: Set<number>;
      }
    >();

    for (const r of filteredData) {
      const lineGap = getDerivedGap(r);
      const date = parseDateLocal(r.orderDate);
      if (isNaN(date.getTime())) continue;
      const key = getBucketKey(date, granularity);

      const e = buckets.get(key);
      if (e) {
        e.totalOrdered += r.orderedQuantity;
        e.totalAllocated += r.allocatedQuantity;
        e.allocationGap += lineGap;
        if (lineGap > 0) e.shortageOrderIds.add(r.orderId);
      } else {
        buckets.set(key, {
          totalOrdered: r.orderedQuantity,
          totalAllocated: r.allocatedQuantity,
          allocationGap: lineGap,
          shortageOrderIds: new Set(lineGap > 0 ? [r.orderId] : []),
        });
      }
    }

    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => ({
        period,
        totalOrdered: data.totalOrdered,
        totalAllocated: data.totalAllocated,
        allocationGap: data.allocationGap,
        allocationRate:
          data.totalOrdered > 0
            ? (data.totalAllocated / data.totalOrdered) * 100
            : 0,
        shortageOrders: data.shortageOrderIds.size,
      }));
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
          const data = await fetchAllocatedOrderedData(
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
      } else if (err.status === 500) {
        toast.error("Server is down. Please contact the administrator.", {
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
    productSummaries,
    supplierSummaries,
    orderSummaries,
    shortageSummaries,
    allocationByPeriod,
    allocationStatusDistribution,
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
