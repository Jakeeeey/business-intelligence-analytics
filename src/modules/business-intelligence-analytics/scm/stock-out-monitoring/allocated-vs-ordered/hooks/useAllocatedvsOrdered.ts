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
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");

  switch (granularity) {
    case "daily":
      return `${y}-${mm}-${dd}`;
    case "weekly": {
      const jan1 = new Date(y, 0, 1);
      const week = Math.ceil(
        ((date.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7,
      );
      return `${y}-W${String(week).padStart(2, "0")}`;
    }
    case "biweekly": {
      const jan1 = new Date(y, 0, 1);
      const week = Math.ceil(
        ((date.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7,
      );
      return `${y}-BW${String(Math.ceil(week / 2)).padStart(2, "0")}`;
    }
    case "semimonth":
      return `${y}-${mm}-${d <= 15 ? "A" : "B"}`;
    case "monthly":
      return `${y}-${mm}`;
    case "quarterly":
      return `${y}-Q${Math.ceil(m / 3)}`;
    case "yearly":
      return `${y}`;
    default:
      return `${y}-${mm}-${dd}`;
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

  // ── Unique filter lists (from full rawData) ──────────────────────────────
  const uniqueSuppliers = React.useMemo(
    () =>
      [...new Set(rawData.map((r) => r.supplierName))].filter(Boolean).sort(),
    [rawData],
  );
  const uniqueBrands = React.useMemo(
    () => [...new Set(rawData.map((r) => r.brandName))].filter(Boolean).sort(),
    [rawData],
  );
  const uniqueCategories = React.useMemo(
    () =>
      [...new Set(rawData.map((r) => r.categoryName))].filter(Boolean).sort(),
    [rawData],
  );
  const uniqueStatuses = React.useMemo(
    () =>
      [...new Set(rawData.map((r) => r.orderStatus))].filter(Boolean).sort(),
    [rawData],
  );

  // ── Record counts per filter option (from rawData) ───────────────────────
  const supplierCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rawData)
      counts[r.supplierName] = (counts[r.supplierName] || 0) + 1;
    return counts;
  }, [rawData]);

  const brandCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rawData)
      counts[r.brandName] = (counts[r.brandName] || 0) + 1;
    return counts;
  }, [rawData]);

  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rawData)
      counts[r.categoryName] = (counts[r.categoryName] || 0) + 1;
    return counts;
  }, [rawData]);

  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rawData)
      counts[r.orderStatus] = (counts[r.orderStatus] || 0) + 1;
    return counts;
  }, [rawData]);

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
      totalOrdered += r.orderedQuantity;
      totalAllocated += r.allocatedQuantity;
      allocationGap += r.discrepancyGap;
      totalNetAmount += r.netAmount;
      uniqueOrderIds.add(r.orderId);
      if (r.discrepancyGap > 0) shortageOrderIds.add(r.orderId);
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
      const e = map.get(r.productId);
      if (e) {
        e.totalOrdered += r.orderedQuantity;
        e.totalAllocated += r.allocatedQuantity;
        e.allocationGap += r.discrepancyGap;
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
          allocationGap: r.discrepancyGap,
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
      const e = map.get(r.supplierId);
      if (e) {
        e.totalOrdered += r.orderedQuantity;
        e.totalAllocated += r.allocatedQuantity;
        e.allocationGap += r.discrepancyGap;
        e.netAmount += r.netAmount;
        e.orderIds.add(r.orderId);
      } else {
        map.set(r.supplierId, {
          supplierId: r.supplierId,
          supplierName: r.supplierName,
          totalOrdered: r.orderedQuantity,
          totalAllocated: r.allocatedQuantity,
          allocationGap: r.discrepancyGap,
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
      const e = map.get(r.orderId);
      if (e) {
        e.totalOrdered += r.orderedQuantity;
        e.totalAllocated += r.allocatedQuantity;
        e.allocationGap += r.discrepancyGap;
        e.netAmount += r.netAmount;
        e.productIds.add(r.productId);
        if (r.discrepancyGap > 0) e.isShortage = true;
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
          allocationGap: r.discrepancyGap,
          netAmount: r.netAmount,
          isShortage: r.discrepancyGap > 0,
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
      const date = parseDateLocal(r.orderDate);
      if (isNaN(date.getTime())) continue;
      const key = getBucketKey(date, granularity);

      const e = buckets.get(key);
      if (e) {
        e.totalOrdered += r.orderedQuantity;
        e.totalAllocated += r.allocatedQuantity;
        e.allocationGap += r.discrepancyGap;
        if (r.discrepancyGap > 0) e.shortageOrderIds.add(r.orderId);
      } else {
        buckets.set(key, {
          totalOrdered: r.orderedQuantity,
          totalAllocated: r.allocatedQuantity,
          allocationGap: r.discrepancyGap,
          shortageOrderIds: new Set(r.discrepancyGap > 0 ? [r.orderId] : []),
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
  const loadData = React.useCallback(
    async () => {
      abortControllerRef.current?.abort();
      if (activeToastRef.current !== null)
        toast.dismiss(activeToastRef.current);

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
                  setRawData(cached);
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

            setRawData(data);
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
        } else if(err.status ===500 ){
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

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
