// src/modules/business-intelligence-analytics/sales-report/product-sales-performance/hooks/useProductSalesPerformance.ts
"use client";

import * as React from "react";
import { toast } from "sonner";
import type {
  ProductSaleRecord,
  ProductPerformanceFilters,
  ProductPerformanceKpis,
  RevenueByPeriod,
  TopItem,
  LocationRevenue,
  ProductTrend,
  SupplierPerformance,
  DateRangePreset,
} from "../types";
import { fetchProductSalesData } from "../providers/fetchProvider";
// import runCacheMigration from "../utils/migrateCache";

/**
 * Parse a YYYY-MM-DD date string (or ISO timestamp) as local midnight
 * to avoid UTC timezone shifts (e.g. "2026-03-01" → local March 1, not Feb 28).
 */
function parseDateLocal(s: string): Date {
  if (!s) return new Date(NaN);
  const datePart = s.slice(0, 10);
  const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return new Date(NaN);
}

/** Format a local Date as YYYY-MM-DD without UTC conversion. */
function fmtLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const getDefaultFilters = (): ProductPerformanceFilters => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    dateRangePreset: "this-month",
    dateFrom: fmtLocalDate(monthStart),
    dateTo: fmtLocalDate(monthEnd),
    suppliers: [],
    products: [],
    cities: [],
    provinces: [],
    divisions: [],
    operations: [],
    salesmen: [],
  };
};

// Calculate actual date range from preset
const getDateRangeFromPreset = (
  preset: DateRangePreset,
  customFrom: string,
  customTo: string,
): { from: string; to: string } => {
  const now = new Date();

  switch (preset) {
    case "yesterday": {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = fmtLocalDate(yesterday);
      return { from: dateStr, to: dateStr };
    }
    case "today": {
      const dateStr = fmtLocalDate(now);
      return { from: dateStr, to: dateStr };
    }
    case "tomorrow": {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = fmtLocalDate(tomorrow);
      return { from: dateStr, to: dateStr };
    }
    case "this-week": {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return { from: fmtLocalDate(weekStart), to: fmtLocalDate(weekEnd) };
    }
    case "this-month": {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: fmtLocalDate(monthStart), to: fmtLocalDate(monthEnd) };
    }
    case "this-year": {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearEnd = new Date(now.getFullYear(), 11, 31);
      return { from: fmtLocalDate(yearStart), to: fmtLocalDate(yearEnd) };
    }
    case "custom":
      return { from: customFrom, to: customTo };
    default: {
      const dateStr = fmtLocalDate(now);
      return { from: dateStr, to: dateStr };
    }
  }
};

export function useProductSalesPerformance() {
  const [rawData, setRawData] = React.useState<ProductSaleRecord[]>([]);
  const [filteredData, setFilteredData] = React.useState<ProductSaleRecord[]>(
    [],
  );
  const [filters, setFilters] =
    React.useState<ProductPerformanceFilters>(getDefaultFilters);
  const [loading, setLoading] = React.useState(false);
  const [loadedOnce, setLoadedOnce] = React.useState(false);
  const [isLoadingFresh, setIsLoadingFresh] = React.useState(false);
  const [fetchFailed, setFetchFailed] = React.useState(false);

  // Track abort controller and active toasts for cleanup
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const activeToastRef = React.useRef<string | number | null>(null);
  const isFirstMountRef = React.useRef(true);
  const suppressAutoFetchRef = React.useRef(false);
  const hasCompletedFirstLoadRef = React.useRef(false);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (activeToastRef.current !== null) {
        toast.dismiss(activeToastRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Sync dateFrom/dateTo when preset changes (except for custom)
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

  // // Load initial data with caching support
  // // Run a one-time migration to fix older cached summaries that lacked division/operation fields.
  // React.useEffect(() => {
  //   (async () => {
  //     try {
  //       await runCacheMigration("product-sales-performance");
  //     } catch (e) {
  //       // best-effort; ignore errors
  //     }
  //   })();
  // }, []);

  async function loadData(overrides?: { from?: string; to?: string }) {
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (activeToastRef.current !== null) {
      toast.dismiss(activeToastRef.current);
    }

    abortControllerRef.current = new AbortController();

    setLoading(true);
    setIsLoadingFresh(true);
    setFetchFailed(false);

    const MAX_RETRIES = 5;
    let lastError: unknown = null;
    let cachedDataAvailable = false;
    let loadingToast: string | number = "";
    let hasShownCacheToast = false;

    try {
      // Calculate date range from current filters (or use overrides)
      const { from, to } = overrides
        ? { from: overrides.from!, to: overrides.to! }
        : getDateRangeFromPreset(
            filters.dateRangePreset,
            filters.dateFrom,
            filters.dateTo,
          );

      // Show toast for loading
      loadingToast = toast.loading("Loading data...");
      activeToastRef.current = loadingToast;

      // Retry loop
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        try {
          // Fetch with cache support
          const data = await fetchProductSalesData(
            from,
            to,
            abortControllerRef.current.signal,
            {
              onCacheData: (cachedData) => {
                // Immediately show cached data (normalized)
                setRawData(
                  Array.isArray(cachedData)
                    ? cachedData.map((r) => ({
                        ...r,
                        supplier:
                          (r.supplier && String(r.supplier).trim()) ||
                          "Unknown Supplier",
                        productName:
                          (r.productName && String(r.productName).trim()) ||
                          "Unknown Product",
                        customerName:
                          (r.customerName && String(r.customerName).trim()) ||
                          "Unknown Customer",
                        salesmanName:
                          (r.salesmanName && String(r.salesmanName).trim()) ||
                          "Unknown Salesman",
                        city:
                          (r.city && String(r.city).trim()) || "Unknown City",
                        province:
                          (r.province && String(r.province).trim()) ||
                          "Unknown Province",
                      }))
                    : cachedData,
                );
                setLoadedOnce(true);
                cachedDataAvailable = true;
                // Keep loading=true to show background refresh indicator
                if (!hasShownCacheToast) {
                  toast.info("Showing old data, Updating....", {
                    id: loadingToast,
                    duration: 10000,
                  });
                  hasShownCacheToast = true;
                }
              },
            },
          );

          // Normalize incoming records: ensure blank/empty names become explicit labels
          const normalize = (r: ProductSaleRecord): ProductSaleRecord => ({
            ...r,
            supplier:
              (r.supplier && String(r.supplier).trim()) || "Unknown Supplier",
            productName:
              (r.productName && String(r.productName).trim()) ||
              "Unknown Product",
            customerName:
              (r.customerName && String(r.customerName).trim()) ||
              "Unknown Customer",
            salesmanName:
              (r.salesmanName && String(r.salesmanName).trim()) ||
              "Unknown Salesman",
            city: (r.city && String(r.city).trim()) || "Unknown City",
            province:
              (r.province && String(r.province).trim()) || "Unknown Province",
          });

          // Update with fresh data (normalized)
          setRawData(Array.isArray(data) ? data.map(normalize) : data);
          setLoadedOnce(true);
          hasCompletedFirstLoadRef.current = true;
          toast.success("Data loaded successfully " + from + " → " + to, {
            id: loadingToast,
            duration: 5000,
          });
          activeToastRef.current = null;
          return; // Success - exit function
        } catch (err: unknown) {
          lastError = err;

          const eObj = err as {
            name?: string;
            status?: unknown;
            message?: string;
          };
          if (
            eObj.name === "AbortError" ||
            abortControllerRef.current?.signal.aborted
          ) {
            return;
          }

          // Retry on network errors (no status) or HTTP 500 errors
          const status = eObj.status;
          const isNetworkError = typeof status === "undefined";
          const isServerError =
            typeof status === "number" && status >= 500 && status < 600;
          const shouldRetry =
            (isNetworkError || isServerError) && attempt < MAX_RETRIES;

          if (shouldRetry) {
            // Show retry message
            if (cachedDataAvailable) {
              toast.info(
                `Showing old data, Fetching new data ${attempt}/${MAX_RETRIES}`,
                // { id: loadingToast, duration: Infinity },
                { id: loadingToast },
              );
            } else {
              toast.loading(`Fetching data ${attempt}/${MAX_RETRIES}...`, {
                id: loadingToast,
              });
            }
            // No backoff - retry immediately
          } else {
            // Don't retry for other errors (4xx, etc.) - exit immediately
            break;
          }
        }
      }

      // All retries failed
      throw lastError;
    } catch (e: unknown) {
      const errObj = e as { name?: string; message?: string; status?: number };
      if (
        errObj?.name === "AbortError" ||
        abortControllerRef.current?.signal.aborted
      ) {
        return;
      }

      if (errObj.status === 401) {
        // toast.error("Session expired. Please log in again. Redirecting in 3 seconds...", {
        toast.error("Session expired. Please log in again.", {
          id: loadingToast,
          duration: 4000,
        });
        activeToastRef.current = null;
        // No Token or Invalid Token case: redirect to login after showing toast
        // if (typeof window !== "undefined")
        //   setTimeout(() => {
        //     window.location.href = "/login";
        //   }, 3000);
        // return;
      }

      setFetchFailed(true);
      // If we have cached data, show a warning instead of error
      if (cachedDataAvailable) {
        toast.info("Failed to load new data, showing old data", {
          id: loadingToast,
        });
                setTimeout(() => {
          if (errObj.status === 500) {
            toast.error("Server is down. Please try again later.", {
              duration: 5000,
            });
          }
        }, 5000);
      } else {
        toast.error(errObj?.message ?? "Failed to load product sales data", {
          id: loadingToast,
          duration: 5000,
        });
      }
      activeToastRef.current = null;
    } finally {
      setLoading(false);
      setIsLoadingFresh(false);
    }
  }

  // Auto-fetch when date range changes (after first successful load)
  React.useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    if (suppressAutoFetchRef.current) {
      // This change was already handled by the preset watcher; skip once.
      suppressAutoFetchRef.current = false;
      return;
    }

    if (hasCompletedFirstLoadRef.current && !loading) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.dateFrom, filters.dateTo]);

  // When the preset changes, sync dates and trigger a fetch once (avoid duplicate fetches)
  React.useEffect(() => {
    if (filters.dateRangePreset === "custom") return;
    if (isFirstMountRef.current) return;

    const { from, to } = getDateRangeFromPreset(
      filters.dateRangePreset,
      filters.dateFrom,
      filters.dateTo,
    );

    // Update the filters with new from/to if needed
    if (filters.dateFrom !== from || filters.dateTo !== to) {
      setFilters((prev) => ({ ...prev, dateFrom: from, dateTo: to }));
    }

    if (hasCompletedFirstLoadRef.current) {
      // Prevent the dateFrom/dateTo watcher from triggering a second fetch
      // Start a fresh fetch even if a previous fetch is still loading —
      // loadData() will abort the previous request.
      suppressAutoFetchRef.current = true;
      loadData({ from, to });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.dateRangePreset]);

  // Apply filters to raw data
  React.useEffect(() => {
    if (!rawData.length) {
      setFilteredData([]);
      return;
    }

    // Calculate actual date range from preset
    const { from, to } = getDateRangeFromPreset(
      filters.dateRangePreset,
      filters.dateFrom,
      filters.dateTo,
    );

    const filtered = rawData.filter((record) => {
      const recordDate = parseDateLocal(record.date);
      const fromDate = parseDateLocal(from);
      const toDate = parseDateLocal(to);
      toDate.setHours(23, 59, 59, 999);

      if (isNaN(recordDate.getTime())) return false;
      if (recordDate < fromDate || recordDate > toDate) return false;
      if (
        filters.suppliers.length &&
        !filters.suppliers.includes(record.supplier)
      )
        return false;
      if (
        filters.products.length &&
        !filters.products.includes(record.productName)
      )
        return false;
      if (filters.cities.length && !filters.cities.includes(record.city))
        return false;
      if (
        filters.provinces.length &&
        !filters.provinces.includes(record.province)
      )
        return false;
      if (
        filters.divisions.length &&
        !filters.divisions.includes(record.divisionName)
      )
        return false;
      if (
        filters.operations.length &&
        !filters.operations.includes(record.operationName)
      )
        return false;
      if (
        filters.salesmen.length &&
        !filters.salesmen.includes(record.salesmanName)
      )
        return false;

      return true;
    });

    setFilteredData(filtered);
  }, [rawData, filters]);

  // Compute KPIs
  const kpis = React.useMemo((): ProductPerformanceKpis => {
    if (!filteredData.length) {
      return {
        totalRevenue: 0,
        totalTransactions: 0,
        avgTransactionValue: 0,
        topProduct: "N/A",
        topSupplier: "N/A",
      };
    }

    const totalRevenue = filteredData.reduce((sum, r) => sum + r.amount, 0);
    const totalTransactions = filteredData.length;
    const avgTransactionValue = totalRevenue / totalTransactions;

    const productRevenue = new Map<string, number>();
    const supplierRevenue = new Map<string, number>();

    filteredData.forEach((r) => {
      productRevenue.set(
        r.productName,
        (productRevenue.get(r.productName) || 0) + r.amount,
      );
      // Normalize supplier key to avoid empty-string keys which cause falsy lookups
      const supplierKey =
        (r.supplier && String(r.supplier).trim()) || "Unknown";
      supplierRevenue.set(
        supplierKey,
        (supplierRevenue.get(supplierKey) || 0) + r.amount,
      );
    });

    const topProduct =
      Array.from(productRevenue.entries()).sort(
        (a, b) => b[1] - a[1],
      )[0]?.[0] || "N/A";

    const topSupplier =
      Array.from(supplierRevenue.entries()).sort(
        (a, b) => b[1] - a[1],
      )[0]?.[0] || "Unknown";

    // dont delete this comment
    // let topSupplier = supplierEntries[0]?.[0] ?? "Unknown";

    // // If the top is 'Unknown' but there are actual suppliers present, prefer the highest actual supplier
    // if (topSupplier === "Unknown") {
    //   const firstReal = supplierEntries.find(
    //     ([k]) => Boolean(k) && k !== "Unknown",
    //   );
    //   if (firstReal) topSupplier = firstReal[0];
    // }

    return {
      totalRevenue,
      totalTransactions,
      avgTransactionValue,
      topProduct,
      topSupplier,
    };
  }, [filteredData]);

  // Revenue by Period (Monthly)
  const revenueByPeriod = React.useMemo((): RevenueByPeriod[] => {
    const periodMap = new Map<string, number>();

    filteredData.forEach((r) => {
      const date = parseDateLocal(r.date);
      if (isNaN(date.getTime())) return;
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      periodMap.set(period, (periodMap.get(period) || 0) + r.amount);
    });

    return Array.from(periodMap.entries())
      .map(([period, revenue]) => ({ period, revenue }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [filteredData]);

  // Top Products
  const topProducts = React.useMemo((): TopItem[] => {
    const productMap = new Map<string, { revenue: number; count: number }>();

    filteredData.forEach((r) => {
      const existing = productMap.get(r.productName) || {
        revenue: 0,
        count: 0,
      };
      productMap.set(r.productName, {
        revenue: existing.revenue + r.amount,
        count: existing.count + 1,
      });
    });

    return Array.from(productMap.entries())
      .map(([name, data]) => ({
        name,
        revenue: data.revenue,
        count: data.count,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredData]);

  // Top Suppliers
  const topSuppliers = React.useMemo((): TopItem[] => {
    const supplierMap = new Map<string, { revenue: number; count: number }>();

    filteredData.forEach((r) => {
      const existing = supplierMap.get(r.supplier) || { revenue: 0, count: 0 };
      supplierMap.set(r.supplier, {
        revenue: existing.revenue + r.amount,
        count: existing.count + 1,
      });
    });

    return Array.from(supplierMap.entries())
      .map(([name, data]) => ({
        name,
        revenue: data.revenue,
        count: data.count,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredData]);

  // Location Revenue
  const locationRevenue = React.useMemo((): LocationRevenue[] => {
    const cityMap = new Map<
      string,
      { revenue: number; transactions: number }
    >();

    filteredData.forEach((r) => {
      const location = `${r.city}, ${r.province}`;
      const existing = cityMap.get(location) || { revenue: 0, transactions: 0 };
      cityMap.set(location, {
        revenue: existing.revenue + r.amount,
        transactions: existing.transactions + 1,
      });
    });

    return Array.from(cityMap.entries())
      .map(([location, data]) => ({
        location,
        revenue: data.revenue,
        transactions: data.transactions,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredData]);

  // Product Trends (top 5 products over time)
  const productTrends = React.useMemo((): ProductTrend[] => {
    const top5Products = topProducts.slice(0, 5).map((p) => p.name);

    return top5Products.map((productName) => {
      const productData = filteredData.filter(
        (r) => r.productName === productName,
      );
      const dateMap = new Map<string, number>();

      productData.forEach((r) => {
        const date = r.date.split("T")[0];
        dateMap.set(date, (dateMap.get(date) || 0) + r.amount);
      });

      const data = Array.from(dateMap.entries())
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => {
          // Explicitly parse date components for consistent sorting
          const [yearA, monthA, dayA] = a.date.split("-").map(Number);
          const [yearB, monthB, dayB] = b.date.split("-").map(Number);
          const dateA = new Date(yearA, monthA - 1, dayA).getTime();
          const dateB = new Date(yearB, monthB - 1, dayB).getTime();
          return dateA - dateB;
        });

      return { productName, data };
    });
  }, [filteredData, topProducts]);

  // Supplier Performance
  const supplierPerformance = React.useMemo((): SupplierPerformance[] => {
    const supplierMap = new Map<string, Map<string, number>>();

    filteredData.forEach((r) => {
      if (!supplierMap.has(r.supplier)) {
        supplierMap.set(r.supplier, new Map());
      }
      const productMap = supplierMap.get(r.supplier)!;
      productMap.set(
        r.productName,
        (productMap.get(r.productName) || 0) + r.amount,
      );
    });

    return Array.from(supplierMap.entries())
      .map(([supplier, productMap]) => {
        const revenue = Array.from(productMap.values()).reduce(
          (sum, r) => sum + r,
          0,
        );
        const products = Array.from(productMap.entries())
          .map(([name, rev]) => ({ name, revenue: rev, count: 0 }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        return { supplier, revenue, products };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredData]);

  // Get unique values for filters
  const uniqueSuppliers = React.useMemo(
    () => Array.from(new Set(rawData.map((r) => r.supplier))).sort(),
    [rawData],
  );

  const uniqueProducts = React.useMemo(
    () => Array.from(new Set(rawData.map((r) => r.productName))).sort(),
    [rawData],
  );

  const uniqueCities = React.useMemo(
    () => Array.from(new Set(rawData.map((r) => r.city))).sort(),
    [rawData],
  );

  const uniqueProvinces = React.useMemo(
    () => Array.from(new Set(rawData.map((r) => r.province))).sort(),
    [rawData],
  );

  const uniqueDivisions = React.useMemo(
    () =>
      Array.from(
        new Set(
          rawData
            .map((r) => r.divisionName)
            .filter((d) => d != null && d !== ""),
        ),
      ).sort(),
    [rawData],
  );

  const uniqueOperations = React.useMemo(
    () =>
      Array.from(
        new Set(
          rawData
            .map((r) => r.operationName)
            .filter((o) => o != null && o !== ""),
        ),
      ).sort(),
    [rawData],
  );

  const uniqueSalesmen = React.useMemo(
    () =>
      Array.from(
        new Set(
          rawData
            .map((r) => r.salesmanName)
            .filter((s) => s != null && s !== ""),
        ),
      ).sort(),
    [rawData],
  );

  return {
    loading,
    loadedOnce,
    isLoadingFresh,
    fetchFailed,
    loadData,
    rawData,
    filteredData,
    filters,
    setFilters,
    kpis,
    revenueByPeriod,
    topProducts,
    topSuppliers,
    locationRevenue,
    productTrends,
    supplierPerformance,
    uniqueSuppliers,
    uniqueProducts,
    uniqueCities,
    uniqueProvinces,
    uniqueDivisions,
    uniqueOperations,
    uniqueSalesmen,
  };
}
