// src/modules/business-intelligence-analytics/sales-report/product-returns-performance/hooks/useProductReturnsPerformance.ts
"use client";

import * as React from "react";
import { toast } from "sonner";
import type {
  ProductReturnRecord,
  ProductReturnsFilters,
  ProductReturnsKpis,
  ReturnByPeriod,
  TopReturnItem,
  LocationReturn,
  ProductReturnTrend,
  SupplierReturnPerformance,
  DateRangePreset,
} from "../types";
import { fetchProductReturnsData } from "../providers/fetchProvider";
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

const getDefaultFilters = (): ProductReturnsFilters => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    dateRangePreset: "this-month",
    dateFrom: fmtLocalDate(monthStart),
    dateTo: fmtLocalDate(monthEnd),
    branches: [],
    statuses: [],
    suppliers: [],
    products: [],
    brands: [],
    cities: [],
    provinces: [],
    divisions: [],
    operations: [],
    salesmen: [],
  };
};

export const getDateRangeFromPreset = (
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

export function useProductReturnsPerformance() {
  const [rawData, setRawData] = React.useState<ProductReturnRecord[]>([]);
  const [filteredData, setFilteredData] = React.useState<ProductReturnRecord[]>(
    [],
  );
  const [filters, setFilters] =
    React.useState<ProductReturnsFilters>(getDefaultFilters);
  const [loading, setLoading] = React.useState(false);
  const [loadedOnce, setLoadedOnce] = React.useState(false);
  const [isLoadingFresh, setIsLoadingFresh] = React.useState(false);
  const [fetchFailed, setFetchFailed] = React.useState(false);

  // Track abort controller and active toasts for cleanup
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const activeToastRef = React.useRef<string | number | null>(null);
  const isFirstMountRef = React.useRef(true);
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

  // // Run a one-time migration to fix older cached summaries that lacked brand/category fields.
  // React.useEffect(() => {
  //   // best-effort migration; do not block UI
  //   (async () => {
  //     try {
  //       await runCacheMigration("product-returns-performance");
  //     } catch (e) {
  //       // ignore
  //     }
  //   })();
  // }, []);

  async function loadData() {
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

    // When generating a report, pass all current filters server-side
    // const fetchFilters: FetchFilters | undefined = forReport
    //   ? {
    //       branches: filters.branches,
    //       salesmen: filters.salesmen,
    //       statuses: filters.statuses,
    //       suppliers: filters.suppliers,
    //     }
    //   : undefined; // date-only fetch: no filters, just populate dropdowns

    try {
      const { from, to } = getDateRangeFromPreset(
        filters.dateRangePreset,
        filters.dateFrom,
        filters.dateTo,
      );

      loadingToast = toast.loading("Loading data...");
      activeToastRef.current = loadingToast;

      // Retry loop
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        try {
          // Normalizer: ensure empty/blank name fields are explicit
          const normalize = (r: ProductReturnRecord): ProductReturnRecord => ({
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

          const data = await fetchProductReturnsData(
            from,
            to,
            abortControllerRef.current.signal,
            {
              onCacheData: (cachedData) => {
                setRawData(
                  Array.isArray(cachedData)
                    ? cachedData.map(normalize)
                    : cachedData,
                );
                setLoadedOnce(true);
                cachedDataAvailable = true;
                // Keep loading=true to show background refresh indicator
                if (!hasShownCacheToast) {
                  toast.info("Showing old data, Updating...", {
                    id: loadingToast,
                    duration: 10000,
                  });
                  hasShownCacheToast = true;
                }
              },
            },
          );

          // Normalize incoming records before storing
          setRawData(Array.isArray(data) ? data.map(normalize) : data);
          setLoadedOnce(true);
          hasCompletedFirstLoadRef.current = true;
          toast.success("Data loaded successfully for " + from + " → " + to, {
            id: loadingToast,
            duration: 5000,
          });
          activeToastRef.current = null;
          return; // Success - exit function
        } catch (e: unknown) {
          lastError = e;
          const err = e as { name?: string; status?: number };

          if (
            err.name === "AbortError" ||
            abortControllerRef.current?.signal.aborted
          ) {
            return;
          }

          const isNetworkError = !err?.status;
          const isServerError =
            (err?.status ?? 0) >= 500 && (err?.status ?? 0) < 600;
          const shouldRetry =
            (isNetworkError || isServerError) && attempt < MAX_RETRIES;

          if (shouldRetry) {
            if (cachedDataAvailable) {
              toast.info(
                `Showing old data, Fetching new data ${attempt}/${MAX_RETRIES}`,
                { id: loadingToast },
              );
            } else {
              toast.loading(`Fetching data ${attempt}/${MAX_RETRIES}...`, {
                id: loadingToast,
              });
            }
          } else {
            break;
          }
        }
      }

      // All retries failed
      throw lastError;
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string; status?: number };
      if (
        err.name === "AbortError" ||
        abortControllerRef.current?.signal.aborted
      ) {
        return;
      }

      if (err.status === 401) {
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
      if (cachedDataAvailable) {
        toast.error("Failed to load new data, showing old data", {
          id: loadingToast,
        });
        setTimeout(() => {
          if (err.status === 500) {
            toast.error("Server is down. Please try again later.", {
              duration: 5000,
            });
          }
        }, 5000);
      } else {
        toast.error(err?.message || "Failed to load product returns data", {
          id: loadingToast,
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
    if (hasCompletedFirstLoadRef.current && !loading) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.dateFrom, filters.dateTo]);

  // Apply filters to raw data
  React.useEffect(() => {
    if (!rawData.length) {
      setFilteredData([]);
      return;
    }

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
      if (
        filters.brands.length &&
        !filters.brands.includes(record.productBrand)
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

  // // When date range changes: auto-fetch raw data to populate filter dropdowns
  // // but do NOT set reportGenerated — data visualization stays hidden until Generate Report
  // // Debounced to avoid firing many requests when users quickly change date inputs.
  // React.useEffect(() => {
  //   // debug: indicate the date filters changed
  //   // eslint-disable-next-line no-console
  //   console.debug("PRP: date-range changed, scheduling filter load", {
  //     preset: filters.dateRangePreset,
  //     from: filters.dateFrom,
  //     to: filters.dateTo,
  //   });
  //   setReportGenerated(false);
  //   const t = setTimeout(() => loadData(false), 300);
  //   return () => clearTimeout(t);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [filters.dateRangePreset, filters.dateFrom, filters.dateTo]);

  // Compute KPIs
  const kpis = React.useMemo((): ProductReturnsKpis => {
    if (!filteredData.length) {
      return {
        totalReturns: 0,
        totalReturnValue: 0,
        avgReturnValue: 0,
        topReturnedProduct: "N/A",
        topSupplier: "N/A",
      };
    }

    const totalReturnValue = filteredData.reduce((sum, r) => sum + r.amount, 0);
    const totalReturns = filteredData.length;
    const avgReturnValue = totalReturnValue / totalReturns;

    const productMap = new Map<string, number>();
    const supplierMap = new Map<string, number>();

    filteredData.forEach((r) => {
      productMap.set(
        r.productName,
        (productMap.get(r.productName) || 0) + r.amount,
      );
      supplierMap.set(
        r.supplier,
        (supplierMap.get(r.supplier) || 0) + r.amount,
      );
    });

    const topReturnedProduct =
      Array.from(productMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "N/A";

    const topSupplier =
      Array.from(supplierMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "N/A";

    return {
      totalReturns,
      totalReturnValue,
      avgReturnValue,
      topReturnedProduct,
      topSupplier,
    };
  }, [filteredData]);

  // Return by Period (Monthly default)
  const returnsByPeriod = React.useMemo((): ReturnByPeriod[] => {
    const periodMap = new Map<
      string,
      { returnValue: number; returnCount: number }
    >();

    filteredData.forEach((r) => {
      const date = parseDateLocal(r.date);
      if (isNaN(date.getTime())) return;
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const existing = periodMap.get(period) || {
        returnValue: 0,
        returnCount: 0,
      };
      periodMap.set(period, {
        returnValue: existing.returnValue + r.amount,
        returnCount: existing.returnCount + 1,
      });
    });

    return Array.from(periodMap.entries())
      .map(([period, data]) => ({ period, ...data }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [filteredData]);

  // Top Returned Products
  const topProducts = React.useMemo((): TopReturnItem[] => {
    const map = new Map<string, { returnValue: number; returnCount: number }>();

    filteredData.forEach((r) => {
      const existing = map.get(r.productName) || {
        returnValue: 0,
        returnCount: 0,
      };
      map.set(r.productName, {
        returnValue: existing.returnValue + r.amount,
        returnCount: existing.returnCount + 1,
      });
    });

    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.returnValue - a.returnValue)
      .slice(0, 10);
  }, [filteredData]);

  // All Products (no slice for table)
  const allProducts = React.useMemo((): TopReturnItem[] => {
    const map = new Map<string, { returnValue: number; returnCount: number }>();

    filteredData.forEach((r) => {
      const existing = map.get(r.productName) || {
        returnValue: 0,
        returnCount: 0,
      };
      map.set(r.productName, {
        returnValue: existing.returnValue + r.amount,
        returnCount: existing.returnCount + 1,
      });
    });

    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.returnValue - a.returnValue);
  }, [filteredData]);

  // Top Suppliers by Return Value
  const topSuppliers = React.useMemo((): TopReturnItem[] => {
    const map = new Map<string, { returnValue: number; returnCount: number }>();

    filteredData.forEach((r) => {
      const existing = map.get(r.supplier) || {
        returnValue: 0,
        returnCount: 0,
      };
      map.set(r.supplier, {
        returnValue: existing.returnValue + r.amount,
        returnCount: existing.returnCount + 1,
      });
    });

    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.returnValue - a.returnValue)
      .slice(0, 10);
  }, [filteredData]);

  // Location Returns
  const locationReturns = React.useMemo((): LocationReturn[] => {
    const cityMap = new Map<
      string,
      { returnValue: number; returnCount: number }
    >();

    filteredData.forEach((r) => {
      const location = `${r.city}, ${r.province}`;
      const existing = cityMap.get(location) || {
        returnValue: 0,
        returnCount: 0,
      };
      cityMap.set(location, {
        returnValue: existing.returnValue + r.amount,
        returnCount: existing.returnCount + 1,
      });
    });

    return Array.from(cityMap.entries())
      .map(([location, data]) => ({ location, ...data }))
      .sort((a, b) => b.returnValue - a.returnValue);
  }, [filteredData]);

  // Product Return Trends (top 5 products)
  const productTrends = React.useMemo((): ProductReturnTrend[] => {
    const top5 = topProducts.slice(0, 5).map((p) => p.name);

    return top5.map((productName) => {
      const productData = filteredData.filter(
        (r) => r.productName === productName,
      );
      const dateMap = new Map<string, number>();

      productData.forEach((r) => {
        const date = r.date.split("T")[0];
        dateMap.set(date, (dateMap.get(date) || 0) + r.amount);
      });

      const data = Array.from(dateMap.entries())
        .map(([date, returnValue]) => ({ date, returnValue }))
        .sort((a, b) => {
          const [yearA, monthA, dayA] = a.date.split("-").map(Number);
          const [yearB, monthB, dayB] = b.date.split("-").map(Number);
          return (
            new Date(yearA, monthA - 1, dayA).getTime() -
            new Date(yearB, monthB - 1, dayB).getTime()
          );
        });

      return { productName, data };
    });
  }, [filteredData, topProducts]);

  // Supplier Performance
  const supplierPerformance = React.useMemo((): SupplierReturnPerformance[] => {
    const supplierMap = new Map<string, Map<string, number>>();

    filteredData.forEach((r) => {
      if (!supplierMap.has(r.supplier)) supplierMap.set(r.supplier, new Map());
      const productMap = supplierMap.get(r.supplier)!;
      productMap.set(
        r.productName,
        (productMap.get(r.productName) || 0) + r.amount,
      );
    });

    return Array.from(supplierMap.entries())
      .map(([supplier, productMap]) => {
        const returnValue = Array.from(productMap.values()).reduce(
          (s, v) => s + v,
          0,
        );
        const returnCount = filteredData.filter(
          (r) => r.supplier === supplier,
        ).length;
        const productCountMap = new Map<string, number>();
        filteredData
          .filter((r) => r.supplier === supplier)
          .forEach((r) => {
            productCountMap.set(
              r.productName,
              (productCountMap.get(r.productName) || 0) + 1,
            );
          });
        const products = Array.from(productMap.entries())
          .map(([name, rv]) => ({
            name,
            returnValue: rv,
            returnCount: productCountMap.get(name) || 0,
          }))
          .sort((a, b) => b.returnValue - a.returnValue)
          .slice(0, 5);

        return { supplier, returnValue, returnCount, products };
      })
      .sort((a, b) => b.returnValue - a.returnValue);
  }, [filteredData]);

  // Unique values for filters
  const uniqueSuppliers = React.useMemo(
    () => Array.from(new Set(rawData.map((r) => r.supplier))).sort(),
    [rawData],
  );

  const uniqueProducts = React.useMemo(
    () => Array.from(new Set(rawData.map((r) => r.productName))).sort(),
    [rawData],
  );

  const productBrandMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    rawData.forEach((r) => {
      if (r.productName) map[r.productName] = r.productBrand || "Unknown";
    });
    return map;
  }, [rawData]);

  const uniqueBrands = React.useMemo(
    () =>
      Array.from(
        new Set(
          rawData
            .map((r) => r.productBrand)
            .filter((b) => b != null && b !== ""),
        ),
      ).sort(),
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
    // generateReport: () => loadData(true),
    // reportGenerated,
    rawData,
    filteredData,
    filters,
    setFilters,
    kpis,
    returnsByPeriod,
    topProducts,
    allProducts,
    topSuppliers,
    locationReturns,
    productTrends,
    supplierPerformance,
    uniqueSuppliers,
    uniqueProducts,
    productBrandMap,
    uniqueBrands,
    uniqueCities,
    uniqueProvinces,
    uniqueDivisions,
    uniqueOperations,
    uniqueSalesmen,
  };
}
