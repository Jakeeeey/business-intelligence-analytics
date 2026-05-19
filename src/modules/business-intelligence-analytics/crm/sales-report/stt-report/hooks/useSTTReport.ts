// src/modules/business-intelligence-analytics/sales-report/sales-report-summary/hooks/useSTTReport.ts
"use client";

import * as React from "react";
import { toast } from "sonner";
import type {
  STTReportRecord,
  STTReportFilters,
  STTReportKpis,
  SalesByPeriod,
  BranchSummary,
  SalesmanSummary,
  CustomerSummary,
  ProductSummary,
  InvoiceSummary,
  ReturnRecord,
  DateRangePreset,
} from "../types";
import { fetchSTTReportData } from "../providers/fetchProvider";

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

// Toggle: when true, derive paymentStatus from numeric fields when the source
// `paymentStatus` is null. This is a code-only flag (no UI exposure) — change
// the value here to enable/disable the derivation logic.
const ENABLE_DERIVE_PAYMENT_STATUS = true;

// Toggle: when true, derive transactionStatus from invoice fields when the
// source `transactionStatus` is null. Code-only flag.
const ENABLE_DERIVE_TRANSACTION_STATUS = true;

const getDefaultFilters = (): STTReportFilters => {
  const now = new Date();
  // Use local date formatting — toISOString() returns UTC and shifts dates in UTC+N timezones
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    dateRangePreset: "this-month",
    dateFrom: fmtLocalDate(monthStart),
    dateTo: fmtLocalDate(monthEnd),
    branches: [],
    salesmen: [],
    statuses: [],
    suppliers: [],
  };
};

export const getDateRangeFromPreset = (
  preset: DateRangePreset,
  customFrom: string,
  customTo: string,
): { from: string; to: string } => {
  const now = new Date();

  // Helper to format date as YYYY-MM-DD in local timezone
  const formatDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  switch (preset) {
    case "yesterday": {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = formatDate(yesterday);
      return { from: dateStr, to: dateStr };
    }
    case "today": {
      const dateStr = formatDate(now);
      return { from: dateStr, to: dateStr };
    }
    case "this-week": {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return { from: formatDate(weekStart), to: formatDate(weekEnd) };
    }
    case "this-month": {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: formatDate(monthStart), to: formatDate(monthEnd) };
    }
    case "this-year": {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearEnd = new Date(now.getFullYear(), 11, 31);
      return { from: formatDate(yearStart), to: formatDate(yearEnd) };
    }
    case "custom":
      return { from: customFrom, to: customTo };
    default: {
      const dateStr = formatDate(now);
      return { from: dateStr, to: dateStr };
    }
  }
};

export function useSTTReport(opts?: { prefetchKeysOnly?: boolean }) {
  const [rawData, setRawData] = React.useState<STTReportRecord[]>([]);
  const [filteredData, setFilteredData] = React.useState<STTReportRecord[]>([]);
  const [filters, setFilters] =
    React.useState<STTReportFilters>(getDefaultFilters);
  // Active filters control what is shown in the visuals. `filters` is the
  // UI/draft selection; `activeFilters` is applied when the user clicks
  // Generate Report so visuals don't update while the user is changing inputs.
  const [activeFilters, setActiveFilters] =
    React.useState<STTReportFilters>(getDefaultFilters);
  const [loading, setLoading] = React.useState(false);
  const [loadedOnce, setLoadedOnce] = React.useState(false);
  const [isLoadingFresh, setIsLoadingFresh] = React.useState(false);
  const [fetchFailed, setFetchFailed] = React.useState(false);
  // Prefetch options: when true, fetch a lightweight set of key fields
  const prefetchKeysOnly = opts?.prefetchKeysOnly ?? true;

  // Lightweight prefetch data used to populate filter dropdowns
  const [rawKeysForFilters, setRawKeysForFilters] = React.useState<
    {
      branch?: string;
      salesman?: string;
      transactionStatus?: string;
      productSupplier?: string;
    }[]
  >([]);
  // Full rows prefetch fallback
  const [rawDataForFilters, setRawDataForFilters] = React.useState<
    STTReportRecord[]
  >([]);

  // Controls whether visualizations are shown (user must click Generate Report)
  const [showVisualization, setShowVisualization] = React.useState(false);

  const abortControllerRef = React.useRef<AbortController | null>(null);
  const aggregationCacheRef = React.useRef<
    Map<string, import("../types").SalesByPeriod[]>
  >(new Map());
  const lastPrefetchMetaRef = React.useRef<{
    from: string;
    to: string;
    branches: string[];
    salesmen: string[];
    statuses: string[];
    suppliers: string[];
    keysOnly: boolean;
  } | null>(null);
  const activeToastRef = React.useRef<string | number | null>(null);
  const isFirstMountRef = React.useRef(true);
  const hasCompletedFirstLoadRef = React.useRef(false);

  // Sync dateFrom/dateTo when preset changes (except for custom)
  React.useEffect(() => {
    if (filters.dateRangePreset !== "custom") {
      const { from, to } = getDateRangeFromPreset(
        filters.dateRangePreset,
        filters.dateFrom,
        filters.dateTo,
      );
      // Only update if dates are different to avoid infinite loops
      if (filters.dateFrom !== from || filters.dateTo !== to) {
        setFilters((prev) => ({ ...prev, dateFrom: from, dateTo: to }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.dateRangePreset]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (activeToastRef.current !== null)
        toast.dismiss(activeToastRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const loadData = React.useCallback(
    async (useFilters?: STTReportFilters) => {
      const f = useFilters ?? activeFilters;
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (activeToastRef.current !== null)
        toast.dismiss(activeToastRef.current);

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
        const { from, to } = getDateRangeFromPreset(
          f.dateRangePreset,
          f.dateFrom,
          f.dateTo,
        );

        loadingToast = toast.loading("Loading data...");
        activeToastRef.current = loadingToast;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          if (abortControllerRef.current?.signal.aborted) return;

          try {
            const data = await fetchSTTReportData(
              from,
              to,
              abortControllerRef.current.signal,
              {
                filters: {
                  branches: f.branches,
                  salesmen: f.salesmen,
                  statuses: f.statuses,
                  suppliers: f.suppliers,
                },
                onCacheData: (cachedData) => {
                  // Show cached preview only when the user requested a generate
                  // (we call loadData from generateReport). Update rawData so
                  // visuals will refresh once allowed by showVisualization.
                  setRawData(cachedData);
                  setLoadedOnce(true);
                  cachedDataAvailable = true;
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

            setRawData(data);
            setLoadedOnce(true);
            hasCompletedFirstLoadRef.current = true;
            toast.success("Data loaded successfully " + from + " → " + to, {
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

            const isNetworkError = !err?.status;
            const isServerError =
              (err?.status ?? 0) >= 500 && (err?.status ?? 0) < 600;
            const shouldRetry =
              (isNetworkError || isServerError) && attempt < MAX_RETRIES;

            if (shouldRetry) {
              if (cachedDataAvailable) {
                toast.info(
                  `Showing old data, Fetching new data ${attempt}/${MAX_RETRIES}`,
                  {
                    id: loadingToast,
                  },
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

        throw lastError;
      } catch (e: unknown) {
        const err = e as { name?: string; message?: string; status?: number };
        if (
          err.name === "AbortError" ||
          abortControllerRef.current?.signal.aborted
        )
          return;

        if (err.status === 401) {
          toast.error(
            "Session expired. Please log in again. Redirecting in 3 seconds...",
            {
              id: loadingToast,
              duration: 3000,
            },
          );

          activeToastRef.current = null;
          // No Token or Invalid Token case: redirect to login after showing toast
          if (typeof window !== "undefined")
            setTimeout(() => {
              window.location.href = "/login";
            }, 3000);
          return;
        }

        setFetchFailed(true);
        if (cachedDataAvailable) {
          toast.info("Failed to load new data, showing old data", {
            id: loadingToast,
          });
          setTimeout(() => {
            if (err.status === 500) {
              toast.error("Server is down. Please try again later.", {
                duration: 5000,
              });
            } else if (err.status === 401) {
              toast.error("Unauthorized. Please log in again.", {
                id: loadingToast,
                duration: 5000,
              });
            }
          }, 5000);
        } else {
          toast.error(err?.message || "Failed to load sales report data", {
            id: loadingToast,
          });
        }
        activeToastRef.current = null;
      } finally {
        setLoading(false);
        setIsLoadingFresh(false);
      }
    },
    [activeFilters],
  );

  // Do NOT auto-fetch when filters change. Instead, hide current visuals so the
  // user can adjust filters and then explicitly click "Generate Report".
  React.useEffect(() => {
    // Skip on first mount
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }

    // Hide visuals on any filter change — user must click Generate Report
    setShowVisualization(false);
  }, [
    filters.dateFrom,
    filters.dateTo,
    filters.branches,
    filters.salesmen,
    filters.statuses,
    filters.suppliers,
  ]);

  // Prefetch lightweight keys to populate filter dropdowns.
  // Previously used a hard-coded range (Sep 2025 → today). Change: use the
  // current `filters` preset (or custom range) so filter options reload when
  // the user picks a different preset or custom dates.
  React.useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    let loadingToast: string | number | undefined = undefined;

    // Compute prefetch date range from current UI filters' preset. This
    // ensures filter options reflect the user's selected preset/custom range.
    const { from: preFrom, to: preTo } = getDateRangeFromPreset(
      filters.dateRangePreset,
      filters.dateFrom,
      filters.dateTo,
    );

    loadingToast = toast.loading("Loading Filter options...");

    (async () => {
      try {
        // Use the existing server-side route as a proxy for Directus to avoid CORS.
        // The route will accept a `directusCollection` query param and forward
        // the request to the Directus /items/:collection endpoint.
        const proxyBase = "/api/bia/crm/sales-report/stt-report";

        // If keys-only prefetch is requested, load filter lookup lists from Directus
        // via our server proxy so dropdowns accurately reflect values from the content model.
        if (prefetchKeysOnly) {
          const STATUSES = [
            "Dispatched",
            "En Route",
            "For Delivery",
            "Newly Synced",
            "Not Fulfilled",
          ];

          try {
            const [branchesRes, salesmenRes, suppliersRes] = await Promise.all([
              fetch(
                `${proxyBase}?directusCollection=branches&fields=branch_name&limit=-1`,
                {
                  signal: controller.signal,
                  cache: "no-store",
                },
              ),
              fetch(
                `${proxyBase}?directusCollection=salesman&fields=id,salesman_name&limit=-1`,
                {
                  signal: controller.signal,
                  cache: "no-store",
                },
              ),
              fetch(
                `${proxyBase}?directusCollection=suppliers&fields=supplier_name,supplier_type&limit=-1`,
                {
                  signal: controller.signal,
                  cache: "no-store",
                },
              ),
            ]);

            if (controller.signal.aborted || cancelled) return;

            // safe JSON parser that returns null for empty bodies
            const safeParse = async (res: Response) => {
              try {
                const txt = await res.text();
                if (!txt) return null;
                return JSON.parse(txt);
              } catch {
                return null;
              }
            };

            const branchesJson = branchesRes.ok
              ? await safeParse(branchesRes)
              : null;
            const salesmenJson = salesmenRes.ok
              ? await safeParse(salesmenRes)
              : null;
            const suppliersJson = suppliersRes.ok
              ? await safeParse(suppliersRes)
              : null;

            // Debug: log directus fetch results so we can verify in browser console
            // that Directus endpoints returned data (or empty body).

            console.debug("Directus prefetch results:", {
              branchesStatus: branchesRes.status,
              salesmenStatus: salesmenRes.status,
              suppliersStatus: suppliersRes.status,
              branchesLength: Array.isArray(branchesJson?.data || branchesJson)
                ? Array.isArray(branchesJson.data)
                  ? branchesJson.data.length
                  : branchesJson.length
                : 0,
              salesmenLength: Array.isArray(salesmenJson?.data || salesmenJson)
                ? Array.isArray(salesmenJson.data)
                  ? salesmenJson.data.length
                  : salesmenJson.length
                : 0,
              suppliersLength: Array.isArray(
                suppliersJson?.data || suppliersJson,
              )
                ? Array.isArray(suppliersJson.data)
                  ? suppliersJson.data.length
                  : suppliersJson.length
                : 0,
            });

            const branchObjs: { branch?: string }[] = [];
            if (Array.isArray(branchesJson?.data || branchesJson)) {
              const list = Array.isArray(branchesJson.data)
                ? branchesJson.data
                : branchesJson;
              for (const b of list) {
                if (b?.branch_name)
                  branchObjs.push({ branch: String(b.branch_name) });
              }
            }

            const salesmanObjs: { salesman?: string }[] = [];
            if (Array.isArray(salesmenJson?.data || salesmenJson)) {
              const list = Array.isArray(salesmenJson.data)
                ? salesmenJson.data
                : salesmenJson;
              for (const s of list) {
                if (s?.id != null && s?.salesman_name) {
                  salesmanObjs.push({
                    salesman: `${s.id} - ${String(s.salesman_name)}`,
                  });
                }
              }
            }

            const supplierObjs: { productSupplier?: string }[] = [];
            if (Array.isArray(suppliersJson?.data || suppliersJson)) {
              const list = Array.isArray(suppliersJson.data)
                ? suppliersJson.data
                : suppliersJson;
              for (const sp of list) {
                if (sp?.supplier_type === "TRADE" && sp?.supplier_name) {
                  supplierObjs.push({
                    productSupplier: String(sp.supplier_name),
                  });
                }
              }
            }

            const statusObjs = STATUSES.map((s) => ({ transactionStatus: s }));

            if (
              branchObjs.length ||
              salesmanObjs.length ||
              supplierObjs.length ||
              statusObjs.length
            ) {
              setRawKeysForFilters([
                ...branchObjs,
                ...salesmanObjs,
                ...statusObjs,
                ...supplierObjs,
              ]);
            }

            lastPrefetchMetaRef.current = {
              from: preFrom,
              to: preTo,
              branches: filters.branches ?? [],
              salesmen: filters.salesmen ?? [],
              statuses: filters.statuses ?? [],
              suppliers: filters.suppliers ?? [],
              keysOnly: true,
            };

            toast.success("Filter options loaded...", {
              id: loadingToast,
              duration: 3000,
            });
            return;
          } catch (e) {
            // fall back to server-side prefetch if directus calls fail
            // continue to the fetchSTTReportData fallback below

            console.warn("Directus filter prefetch failed, falling back:", e);
          }
        }

        // Fallback: use existing backend prefetch (full rows or keys-only)
        const res = await fetchSTTReportData(
          preFrom,
          preTo,
          controller.signal,
          {
            filters: {
              branches: filters.branches,
              salesmen: filters.salesmen,
              statuses: filters.statuses,
              suppliers: filters.suppliers,
            },
            keysOnly: prefetchKeysOnly,
            onCacheData: (cached) => {
              if (cancelled) return;
              if (prefetchKeysOnly && Array.isArray(cached)) {
                setRawKeysForFilters(
                  cached.map((r: unknown) => {
                    const obj = (r as Record<string, unknown>) || {};
                    return {
                      branch:
                        typeof obj.branch === "string" ? obj.branch : undefined,
                      salesman:
                        typeof obj.salesman === "string"
                          ? obj.salesman
                          : undefined,
                      transactionStatus:
                        typeof obj.transactionStatus === "string"
                          ? obj.transactionStatus
                          : undefined,
                      productSupplier:
                        typeof obj.productSupplier === "string"
                          ? obj.productSupplier
                          : undefined,
                    };
                  }),
                );
              } else if (Array.isArray(cached)) {
                setRawDataForFilters(cached as STTReportRecord[]);
                lastPrefetchMetaRef.current = {
                  from: preFrom,
                  to: preTo,
                  branches: filters.branches ?? [],
                  salesmen: filters.salesmen ?? [],
                  statuses: filters.statuses ?? [],
                  suppliers: filters.suppliers ?? [],
                  keysOnly: !!prefetchKeysOnly,
                };
              }
            },
          },
        );

        if (cancelled) return;

        if (prefetchKeysOnly && Array.isArray(res)) {
          setRawKeysForFilters(
            res.map((r: unknown) => {
              const obj = (r as Record<string, unknown>) || {};
              return {
                branch: typeof obj.branch === "string" ? obj.branch : undefined,
                salesman:
                  typeof obj.salesman === "string" ? obj.salesman : undefined,
                transactionStatus:
                  typeof obj.transactionStatus === "string"
                    ? obj.transactionStatus
                    : undefined,
                productSupplier:
                  typeof obj.productSupplier === "string"
                    ? obj.productSupplier
                    : undefined,
              };
            }),
          );
          lastPrefetchMetaRef.current = {
            from: preFrom,
            to: preTo,
            branches: filters.branches ?? [],
            salesmen: filters.salesmen ?? [],
            statuses: filters.statuses ?? [],
            suppliers: filters.suppliers ?? [],
            keysOnly: true,
          };
        } else if (Array.isArray(res)) {
          setRawDataForFilters(res as STTReportRecord[]);
          lastPrefetchMetaRef.current = {
            from: preFrom,
            to: preTo,
            branches: filters.branches ?? [],
            salesmen: filters.salesmen ?? [],
            statuses: filters.statuses ?? [],
            suppliers: filters.suppliers ?? [],
            keysOnly: !!prefetchKeysOnly,
          };
        }

        // replace loading toast with success
        toast.success("Filter options loaded...", {
          id: loadingToast,
          duration: 3000,
        });
      } catch {
        // silent
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      toast.dismiss(loadingToast);
    };
  }, [
    prefetchKeysOnly,
    filters.dateRangePreset,
    filters.dateFrom,
    filters.dateTo,
    filters.branches,
    filters.salesmen,
    filters.statuses,
    filters.suppliers,
  ]);
  // the UI `filters` represent draft selections. This ensures visuals remain
  // unchanged while the user adjusts filters until they click Generate Report.
  React.useEffect(() => {
    const fromDate = activeFilters.dateFrom
      ? parseDateLocal(activeFilters.dateFrom)
      : null;
    const toDate = activeFilters.dateTo
      ? (() => {
          const d = parseDateLocal(activeFilters.dateTo);
          d.setHours(23, 59, 59, 999);
          return d;
        })()
      : null;

    const filtered = rawData.filter((r) => {
      const d = parseDateLocal(r.invoiceDate ?? "");
      const dateIsValid = !isNaN(d.getTime());
      if (fromDate && !isNaN(fromDate.getTime())) {
        if (!dateIsValid || d.getTime() < fromDate.getTime()) return false;
      }
      if (toDate && !isNaN(toDate.getTime())) {
        if (!dateIsValid || d.getTime() > toDate.getTime()) return false;
      }
      if (
        activeFilters.branches.length > 0 &&
        !activeFilters.branches.includes(r.branch ?? "")
      )
        return false;
      if (
        activeFilters.salesmen.length > 0 &&
        !activeFilters.salesmen.includes(r.salesman ?? "")
      )
        return false;
      if (
        activeFilters.statuses.length > 0 &&
        !activeFilters.statuses.includes(r.transactionStatus ?? "")
      )
        return false;
      if (
        activeFilters.suppliers.length > 0 &&
        !activeFilters.suppliers.includes(r.productSupplier ?? "")
      )
        return false;
      return true;
    });

    setFilteredData(filtered);
    aggregationCacheRef.current.clear();
  }, [
    rawData,
    activeFilters.dateFrom,
    activeFilters.dateTo,
    activeFilters.branches,
    activeFilters.salesmen,
    activeFilters.statuses,
    activeFilters.suppliers,
  ]);

  // Helper: aggregate filteredData into periods based on granularity
  const computeAggregation = (granularity: string) => {
    // Map key -> { start: Date, sales, collections, returns, invoiceIds:Set }
    const map = new Map<
      string,
      {
        start: Date;
        sales: number;
        collections: number;
        returns: number;
        invoiceIds: Set<number>;
      }
    >();

    // Use module-level parseDateLocal (avoids UTC timezone shifts on date-only strings)
    const parseDate = parseDateLocal;

    const getBucketStart = (d: Date) => {
      const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      switch (granularity) {
        case "daily": {
          return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
        }
        case "weekly": {
          // week starting Monday
          const day = dt.getDay();
          const diff = (day + 6) % 7; // 0 => Monday
          const s = new Date(dt);
          s.setDate(dt.getDate() - diff);
          return new Date(s.getFullYear(), s.getMonth(), s.getDate());
        }
        case "bi-weekly": {
          // Calendar-aligned bi-weekly: compute week-start (Monday) and then
          // group weeks into two-week buckets anchored to the year's first Monday.
          const weekStart = (() => {
            const day = dt.getDay();
            const diff = (day + 6) % 7; // 0 => Monday
            const s = new Date(dt);
            s.setDate(dt.getDate() - diff);
            return new Date(s.getFullYear(), s.getMonth(), s.getDate());
          })();

          const yearStart = new Date(dt.getFullYear(), 0, 1);
          const ysDay = yearStart.getDay();
          const ysDiff = (ysDay + 6) % 7;
          const yearFirstMonday = new Date(yearStart);
          yearFirstMonday.setDate(yearStart.getDate() - ysDiff);

          const msPerWeek = 7 * 24 * 3600 * 1000;
          const weekIndex = Math.floor(
            (weekStart.getTime() - yearFirstMonday.getTime()) / msPerWeek,
          );
          const biIndex = Math.floor(weekIndex / 2);
          const bucketStart = new Date(
            yearFirstMonday.getTime() + biIndex * 14 * 24 * 3600 * 1000,
          );
          return new Date(
            bucketStart.getFullYear(),
            bucketStart.getMonth(),
            bucketStart.getDate(),
          );
        }
        case "monthly": {
          return new Date(dt.getFullYear(), dt.getMonth(), 1);
        }
        case "bi-monthly": {
          const month = dt.getMonth();
          const startMonth = month - (month % 2);
          return new Date(dt.getFullYear(), startMonth, 1);
        }
        case "quarterly": {
          const month = dt.getMonth();
          const startMonth = Math.floor(month / 3) * 3;
          return new Date(dt.getFullYear(), startMonth, 1);
        }
        case "semi-annually": {
          const month = dt.getMonth();
          const startMonth = month < 6 ? 0 : 6;
          return new Date(dt.getFullYear(), startMonth, 1);
        }
        case "yearly": {
          return new Date(dt.getFullYear(), 0, 1);
        }
        default:
          return new Date(dt.getFullYear(), dt.getMonth(), 1);
      }
    };

    // Precompute inclusive start/end bounds from current filters so aggregation
    // only includes records inside the selected date range.
    const startBound = parseDate(
      activeFilters.dateFrom || new Date().toISOString().split("T")[0],
    );
    // Cap end bound at the end of the *current granularity period* so charts
    // don't show future empty buckets when dateTo extends into the future
    // (common with presets like this-month, this-year, etc.).
    // e.g. daily → end of today, weekly → end of this week (Sunday),
    //      monthly → end of this month, etc.
    const endBound = (() => {
      const e = parseDate(
        activeFilters.dateTo || new Date().toISOString().split("T")[0],
      );
      e.setHours(23, 59, 59, 999);

      const now = new Date();
      let periodEnd: Date;
      switch (granularity) {
        case "daily":
          periodEnd = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            23,
            59,
            59,
            999,
          );
          break;
        case "weekly": {
          // end of current calendar week (Sunday)
          const day = now.getDay(); // 0=Sun, 1=Mon … 6=Sat
          const daysToSunday = day === 0 ? 0 : 7 - day;
          periodEnd = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + daysToSunday,
            23,
            59,
            59,
            999,
          );
          break;
        }
        case "bi-weekly": {
          // end of current bi-weekly period (this Monday + 13 days)
          const day = now.getDay();
          const daysFromMonday = (day + 6) % 7;
          const monday = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - daysFromMonday,
          );
          periodEnd = new Date(
            monday.getFullYear(),
            monday.getMonth(),
            monday.getDate() + 13,
            23,
            59,
            59,
            999,
          );
          break;
        }
        case "monthly":
          periodEnd = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,
            59,
            59,
            999,
          );
          break;
        case "bi-monthly": {
          const biStart = now.getMonth() - (now.getMonth() % 2);
          periodEnd = new Date(
            now.getFullYear(),
            biStart + 2,
            0,
            23,
            59,
            59,
            999,
          );
          break;
        }
        case "quarterly": {
          const q = Math.floor(now.getMonth() / 3);
          periodEnd = new Date(
            now.getFullYear(),
            (q + 1) * 3,
            0,
            23,
            59,
            59,
            999,
          );
          break;
        }
        case "semi-annually": {
          const h = now.getMonth() < 6 ? 6 : 12;
          periodEnd = new Date(now.getFullYear(), h, 0, 23, 59, 59, 999);
          break;
        }
        case "yearly":
          periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
          break;
        default:
          periodEnd = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            23,
            59,
            59,
            999,
          );
      }

      // Use the earlier of: filter's dateTo OR end of current period
      return e.getTime() > periodEnd.getTime() ? periodEnd : e;
    })();

    const getKey = (d: Date) => {
      const s = getBucketStart(d);
      // Format as local YYYY-MM-DD to match parseDate behavior and avoid UTC shifts
      const y = s.getFullYear();
      const m = String(s.getMonth() + 1).padStart(2, "0");
      const day = String(s.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    // Prepopulate all buckets between startBound and endBound so charts show empty
    // points for periods with no data (important for consistent granularity display)
    const addPeriod = (d: Date) => {
      const dt = new Date(d);
      switch (granularity) {
        case "daily":
          dt.setDate(dt.getDate() + 1);
          return dt;
        case "weekly":
          dt.setDate(dt.getDate() + 7);
          return dt;
        case "bi-weekly":
          dt.setDate(dt.getDate() + 14);
          return dt;
        case "monthly":
          return new Date(dt.getFullYear(), dt.getMonth() + 1, 1);
        case "bi-monthly":
          return new Date(dt.getFullYear(), dt.getMonth() + 2, 1);
        case "quarterly":
          return new Date(dt.getFullYear(), dt.getMonth() + 3, 1);
        case "semi-annually":
          return new Date(dt.getFullYear(), dt.getMonth() + 6, 1);
        case "yearly":
          return new Date(dt.getFullYear() + 1, 0, 1);
        default:
          return new Date(dt.getFullYear(), dt.getMonth() + 1, 1);
      }
    };

    // start from the bucket that contains startBound
    let cursor = getBucketStart(startBound);
    while (cursor.getTime() <= endBound.getTime()) {
      const k = getKey(cursor);
      if (!map.has(k)) {
        map.set(k, {
          start: new Date(cursor),
          sales: 0,
          collections: 0,
          returns: 0,
          invoiceIds: new Set(),
        });
      }
      cursor = addPeriod(cursor);
    }

    // Build canonical invoiceDate per invoice (first-row-wins).
    // An itemised report has one row per product per invoice. Different product rows of
    // the same invoice can carry slightly different invoiceDate values (data quality issue).
    // Without canonicalisation, the same invoice lands in MULTIPLE daily buckets, making
    // the chart's total invoice count exceed the KPI's deduplicated count.
    const canonicalDateMap = new Map<number, string>();
    filteredData.forEach((r) => {
      if (!canonicalDateMap.has(r.invoiceId))
        canonicalDateMap.set(r.invoiceId, r.invoiceDate);
    });

    filteredData.forEach((r) => {
      // Use the canonical date for this invoice so it always lands in the same bucket
      const date = parseDate(
        canonicalDateMap.get(r.invoiceId) ?? r.invoiceDate,
      );
      // Guard: skip records with null / unparseable dates
      if (isNaN(date.getTime())) return;
      // skip records outside the active date filters
      if (
        date.getTime() < startBound.getTime() ||
        date.getTime() > endBound.getTime()
      )
        return;
      const key = getKey(date);
      if (!map.has(key)) {
        const start = getBucketStart(date);
        map.set(key, {
          start,
          sales: 0,
          collections: 0,
          returns: 0,
          invoiceIds: new Set(),
        });
      }
      const entry = map.get(key)!;
      if (!entry.invoiceIds.has(r.invoiceId)) {
        entry.sales += r.totalAmount;
        entry.collections += r.collection;
        entry.invoiceIds.add(r.invoiceId);
      }
      entry.returns += r.returnTotalAmount || 0;
    });

    const arr = Array.from(map.entries()).map(([k, v]) => ({
      period: k,
      sales: v.sales,
      collections: v.collections,
      returns: v.returns,
      invoiceCount: v.invoiceIds.size,
      start: v.start,
    }));
    arr.sort((a, b) => a.start.getTime() - b.start.getTime());
    // remove internal start before returning
    return arr.map(
      ({ period, sales, collections, returns: rets, invoiceCount }) => ({
        period,
        sales,
        collections,
        returns: rets,
        invoiceCount,
      }),
    );
  };

  const getSalesByPeriod = React.useCallback(
    (granularity: string) => {
      const key = granularity || "monthly";
      const cache = aggregationCacheRef.current;
      if (cache.has(key)) return cache.get(key)!;
      const res = computeAggregation(key);
      cache.set(key, res);
      return res;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredData, activeFilters.dateFrom, activeFilters.dateTo],
  );

  // ── Derived unique values for filter dropdowns ──────────────────────────────

  const uniqueBranches = React.useMemo(() => {
    const source: Array<string | undefined> = rawKeysForFilters.length
      ? rawKeysForFilters.map((r) => r.branch)
      : rawDataForFilters.length
        ? rawDataForFilters.map((r) => r.branch)
        : rawData.map((r) => r.branch);
    const filtered = source.filter((v): v is string => Boolean(v && v !== ""));
    return [...new Set(filtered)].sort();
  }, [rawKeysForFilters, rawDataForFilters, rawData]);

  const uniqueSalesmen = React.useMemo(() => {
    const source: Array<string | undefined> = rawKeysForFilters.length
      ? rawKeysForFilters.map((r) => r.salesman)
      : rawDataForFilters.length
        ? rawDataForFilters.map((r) => r.salesman)
        : rawData.map((r) => r.salesman);
    const filtered = source.filter((v): v is string => Boolean(v && v !== ""));
    return [...new Set(filtered)].sort();
  }, [rawKeysForFilters, rawDataForFilters, rawData]);

  const uniqueStatuses = React.useMemo(() => {
    const source: Array<string | undefined> = rawKeysForFilters.length
      ? rawKeysForFilters.map((r) => r.transactionStatus)
      : rawDataForFilters.length
        ? rawDataForFilters.map((r) => r.transactionStatus)
        : rawData.map((r) => r.transactionStatus);
    const filtered = source.filter((v): v is string => Boolean(v && v !== ""));
    return [...new Set(filtered)].sort();
  }, [rawKeysForFilters, rawDataForFilters, rawData]);

  const uniqueSuppliers = React.useMemo(() => {
    const source: Array<string | undefined> = rawKeysForFilters.length
      ? rawKeysForFilters.map((r) => r.productSupplier)
      : rawDataForFilters.length
        ? rawDataForFilters.map((r) => r.productSupplier)
        : rawData.map((r) => r.productSupplier);
    const filtered = source.filter((v): v is string => Boolean(v && v !== ""));
    return [...new Set(filtered)].sort();
  }, [rawKeysForFilters, rawDataForFilters, rawData]);

  // ── KPIs ───────────────────────────────────────────────────────────────────

  const kpis = React.useMemo((): STTReportKpis => {
    if (!filteredData.length) {
      return {
        totalSales: 0,
        totalDiscount: 0,
        totalSalesInvoiceCount: 0,
        netCollections: 0,
        outstandingPayments: 0,
        totalReturns: 0,
        returnedProductCount: 0,
        invoicesWithReturns: 0,
        totalInvoices: 0,
        uniqueCustomers: 0,
        collectionRate: 0,
        returnRate: 0,
        avgOrderValue: 0,
        targetQuantity: 0,
        avgInvoicesPerCustomer: 0,
      };
    }

    // ── Invoice grouping (still needed for invoice-level KPIs)
    const invoiceMap = new Map<number, STTReportRecord[]>();

    for (const r of filteredData) {
      if (!invoiceMap.has(r.invoiceId)) invoiceMap.set(r.invoiceId, []);
      invoiceMap.get(r.invoiceId)!.push(r);
    }

    const uniqueInvoices = Array.from(invoiceMap.values());



    // ── CORE CHANGE: Sales now based on product-level revenue
    const totalSales = filteredData.reduce(
      (sum, r) => sum + (r.productTotalAmount || 0),
      0,
    );


    const totalDiscount = uniqueInvoices.reduce(
      (sum, inv) => sum + (inv[0].discountAmount || 0),
      0,
    );
    const netCollections = Math.max(0, totalSales - totalDiscount);
    const outstandingPayments = Math.max(0, totalSales - netCollections);

    const totalInvoices = uniqueInvoices.length;

    const totalReturns = filteredData.reduce(
      (sum, r) => sum + (r.returnTotalAmount || 0),
      0,
    );

    const returnedProductCount = filteredData.reduce(
      (sum, r) => sum + (r.returnQuantity || 0),
      0,
    );

    const invoicesWithReturns = new Set(
      filteredData
        .filter((r) => (r.returnQuantity || 0) > 0)
        .map((r) => r.invoiceId),
    ).size;

    const uniqueCustomers = new Set(filteredData.map((r) => r.customerCode))
      .size;

    const collectionRate =
      totalSales > 0 ? (netCollections / totalSales) * 100 : 0;

    const returnRate = totalSales > 0 ? (totalReturns / totalSales) * 100 : 0;

    const avgOrderValue = totalInvoices > 0 ? totalSales / totalInvoices : 0;

    const targetQuantity = filteredData.reduce(
      (sum, r) => sum + (r.productQuantity || 0),
      0,
    );

    const avgInvoicesPerCustomer =
      uniqueCustomers > 0 ? totalInvoices / uniqueCustomers : 0;

    return {
      totalSales,
      totalDiscount,
      totalSalesInvoiceCount: totalInvoices,
      netCollections,
      outstandingPayments,
      totalReturns,
      returnedProductCount,
      invoicesWithReturns,
      totalInvoices,
      uniqueCustomers,
      collectionRate,
      returnRate,
      avgOrderValue,
      targetQuantity,
      avgInvoicesPerCustomer,
    };
  }, [filteredData]);

  // Expose a generateReport() function which toggles visualization and fetches actual data
  const generateReport = React.useCallback(async () => {
    // Compute the concrete date range for the current UI preset/custom dates
    const { from, to } = getDateRangeFromPreset(
      filters.dateRangePreset,
      filters.dateFrom,
      filters.dateTo,
    );

    const fromDate = parseDateLocal(from);
    const toDate = parseDateLocal(to);

    // If we previously prefetched FULL rows (rawDataForFilters) and they
    // already cover the requested date range, reuse them and skip a network
    // fetch. Note: when prefetchKeysOnly === true we won't have full rows.
    const meta = lastPrefetchMetaRef.current;
    const arraysEqual = (a: string[] | undefined, b: string[] | undefined) => {
      const aa = (a || []).slice().sort();
      const bb = (b || []).slice().sort();
      if (aa.length !== bb.length) return false;
      for (let i = 0; i < aa.length; i++) if (aa[i] !== bb[i]) return false;
      return true;
    };

    if (
      meta &&
      meta.keysOnly === false &&
      rawDataForFilters.length > 0 &&
      !isNaN(fromDate.getTime()) &&
      !isNaN(toDate.getTime()) &&
      meta.from <= from &&
      meta.to >= to &&
      arraysEqual(meta.branches, filters.branches) &&
      arraysEqual(meta.salesmen, filters.salesmen) &&
      arraysEqual(meta.statuses, filters.statuses) &&
      arraysEqual(meta.suppliers, filters.suppliers)
    ) {
      let minD = new Date(8640000000000000);
      let maxD = new Date(-8640000000000000);
      for (const r of rawDataForFilters) {
        const d = parseDateLocal(r.invoiceDate ?? "");
        if (isNaN(d.getTime())) continue;
        if (d.getTime() < minD.getTime()) minD = d;
        if (d.getTime() > maxD.getTime()) maxD = d;
      }

      if (
        !isNaN(minD.getTime()) &&
        !isNaN(maxD.getTime()) &&
        minD.getTime() <= fromDate.getTime() &&
        maxD.getTime() >= toDate.getTime()
      ) {
        // Reuse prefetched full rows
        setRawData(rawDataForFilters);
        setLoadedOnce(true);
        setActiveFilters(filters);
        setShowVisualization(true);
        return;
      }
    }

    // Fallback: fetch actual data from server
    setShowVisualization(true);
    setActiveFilters(filters);
    await loadData(filters);
  }, [loadData, filters, rawDataForFilters]);

  // ── Customer Summaries ───────────────────────────────────────────────────

  const customerSummaries = React.useMemo((): CustomerSummary[] => {
    const map = new Map<
      string,
      {
        name: string;
        totalSales: number;
        totalCollections: number;
        totalReturns: number;
        productSales: number;
        invoiceIds: Set<number>;
      }
    >();

    filteredData.forEach((r) => {
      const key = r.customerCode || r.customerName || "(unknown)";
      if (!map.has(key)) {
        map.set(key, {
          name: r.customerName,
          totalSales: 0,
          totalCollections: 0,
          totalReturns: 0,
          productSales: 0,
          invoiceIds: new Set<number>(),
        });
      }
      const entry = map.get(key)!;
      if (!entry.invoiceIds.has(r.invoiceId)) {
        entry.totalSales += r.totalAmount;
        entry.totalCollections += r.collection;
        entry.invoiceIds.add(r.invoiceId);
      }
      entry.totalReturns += r.returnTotalAmount || 0;
      entry.productSales += r.productTotalAmount || 0;
    });

    return Array.from(map.entries())
      .map(([code, d]) => ({
        customerCode: code,
        name: d.name,
        totalSales: d.totalSales,
        totalCollections: d.totalCollections,
        totalReturns: d.totalReturns,
        invoiceCount: d.invoiceIds.size,
        productSales: d.productSales,
      }))
      .sort((a, b) => b.totalSales - a.totalSales);
  }, [filteredData]);

  const topCustomers = React.useMemo(
    () => customerSummaries.slice(0, 10),
    [customerSummaries],
  );

  // ── Sales by Period (monthly) ──────────────────────────────────────────────

  const salesByPeriod = React.useMemo((): SalesByPeriod[] => {
    const periodMap = new Map<
      string,
      {
        sales: number;
        collections: number;
        returns: number;
        invoiceIds: Set<number>;
      }
    >();

    // Canonical invoiceDate per invoice — same first-row-wins logic as KPI & computeAggregation
    const canonicalDateMap = new Map<number, string>();
    filteredData.forEach((r) => {
      if (!canonicalDateMap.has(r.invoiceId))
        canonicalDateMap.set(r.invoiceId, r.invoiceDate);
    });

    filteredData.forEach((r) => {
      // Use parseDateLocal (timezone-safe) with canonical date
      const date = parseDateLocal(
        canonicalDateMap.get(r.invoiceId) ?? r.invoiceDate ?? "",
      );
      if (isNaN(date.getTime())) return; // skip null/invalid dates
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!periodMap.has(period)) {
        periodMap.set(period, {
          sales: 0,
          collections: 0,
          returns: 0,
          invoiceIds: new Set(),
        });
      }
      const entry = periodMap.get(period)!;
      // Add invoice-level amounts only once per invoice (canonical date ensures one bucket)
      if (!entry.invoiceIds.has(r.invoiceId)) {
        entry.sales += r.totalAmount;
        entry.collections += r.collection;
        entry.invoiceIds.add(r.invoiceId);
      }
      entry.returns += r.returnTotalAmount || 0;
    });

    return Array.from(periodMap.entries())
      .map(([period, d]) => ({
        period,
        sales: d.sales,
        collections: d.collections,
        returns: d.returns,
        invoiceCount: d.invoiceIds.size,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [filteredData]);

  // ── Salesman Summaries ─────────────────────────────────────────────────────

  const salesmanSummaries = React.useMemo((): SalesmanSummary[] => {
    const map = new Map<
      string,
      {
        totalSales: number;
        totalCollections: number;
        totalReturns: number;
        productSales: number;
        invoiceIds: Set<number>;
        customerCodes: Set<string>;
      }
    >();

    filteredData.forEach((r) => {
      const salesmanKey = r.salesman || "(unknown)";
      if (!map.has(salesmanKey)) {
        map.set(salesmanKey, {
          totalSales: 0,
          totalCollections: 0,
          totalReturns: 0,
          productSales: 0,
          invoiceIds: new Set(),
          customerCodes: new Set(),
        });
      }
      const entry = map.get(salesmanKey)!;
      if (!entry.invoiceIds.has(r.invoiceId)) {
        entry.totalSales += r.totalAmount;
        entry.totalCollections += r.collection;
        entry.invoiceIds.add(r.invoiceId);
      }
      entry.totalReturns += r.returnTotalAmount || 0;
      entry.productSales += r.productTotalAmount || 0;
      entry.customerCodes.add(r.customerCode);
    });

    return Array.from(map.entries())
      .map(([name, d]) => ({
        name,
        totalSales: d.totalSales,
        totalCollections: d.totalCollections,
        totalReturns: d.totalReturns,
        invoiceCount: d.invoiceIds.size,
        customerCount: d.customerCodes.size,
        productSales: d.productSales,
      }))
      .sort((a, b) => b.totalSales - a.totalSales);
  }, [filteredData]);

  // ── Product Summaries ──────────────────────────────────────────────────────

  const productSummaries = React.useMemo((): ProductSummary[] => {
    const map = new Map<
      string,
      {
        supplier: string;
        category: string;
        brand: string;
        totalQuantity: number;
        totalAmount: number;
        returnQuantity: number;
        returnAmount: number;
        totalDiscount: number;
      }
    >();

    filteredData.forEach((r) => {
      const productKey = r.productName || "(unknown)";
      if (!map.has(productKey)) {
        map.set(productKey, {
          supplier: r.productSupplier || "",
          category: r.productCategory || "",
          brand: r.productBrand || "",
          totalQuantity: 0,
          totalAmount: 0,
          returnQuantity: 0,
          returnAmount: 0,
          totalDiscount: 0,
        });
      }
      const entry = map.get(productKey)!;
      entry.totalQuantity += r.productQuantity;
      entry.totalAmount += r.productTotalAmount;
      entry.totalDiscount += r.productDiscountAmount;
      entry.returnQuantity += r.returnQuantity;
      entry.returnAmount += r.returnTotalAmount;
    });

    return Array.from(map.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredData]);

  // ── Invoice Summaries (deduplicated) ──────────────────────────────────────

  const invoiceSummaries = React.useMemo((): InvoiceSummary[] => {
    const seen = new Map<number, InvoiceSummary>();
    filteredData.forEach((r) => {
      if (!seen.has(r.invoiceId)) {
        // Compute invoice-level net amount (total minus discount) as fallback
        const netAmount = (r.totalAmount ?? 0) - (r.discountAmount ?? 0);

        // If paymentStatus is null/undefined, optionally derive from collection vs netAmount
        let derivedPaymentStatus: string | null = r.paymentStatus ?? null;
        if (derivedPaymentStatus == null && ENABLE_DERIVE_PAYMENT_STATUS) {
          const coll = Number(r.collection ?? 0);
          if (coll >= netAmount && netAmount > 0) {
            derivedPaymentStatus = "Paid";
          } else if (coll > 0) {
            derivedPaymentStatus = "Partially Paid";
          } else {
            derivedPaymentStatus = "Unpaid";
          }
        }

        // Determine whether we can derive payment status from available numeric fields
        const hasNumericData =
          typeof r.totalAmount === "number" ||
          typeof r.discountAmount === "number" ||
          typeof r.collection === "number";

        let derivedFlag: boolean | null = null;
        // If original paymentStatus exists, mark derived=false; if not and we have numeric data
        // we will mark derived=true (or leave null if no data to derive)
        if (r.paymentStatus != null) {
          derivedFlag = false;
        } else if (hasNumericData && ENABLE_DERIVE_PAYMENT_STATUS) {
          derivedFlag = true;
        }

        // Derive transaction status when null using invoice fields (code-only toggle)
        let derivedTransactionStatus: string | null =
          r.transactionStatus ?? null;
        const hasTransactionCandidate =
          Number(r.isDispatched) === 1 ||
          Boolean(r.dispatchDate) ||
          Boolean(r.invoiceDate) ||
          Boolean(r.orderId);

        let transDerivedFlag: boolean | null = null;
        if (r.transactionStatus != null) {
          transDerivedFlag = false;
        } else if (
          hasTransactionCandidate &&
          ENABLE_DERIVE_TRANSACTION_STATUS
        ) {
          transDerivedFlag = true;
        }

        if (
          derivedTransactionStatus == null &&
          ENABLE_DERIVE_TRANSACTION_STATUS
        ) {
          if (Number(r.isDispatched) === 1) {
            derivedTransactionStatus = "Dispatched";
          } else if (r.dispatchDate) {
            derivedTransactionStatus = "En Route";
          } else if (r.invoiceDate) {
            derivedTransactionStatus = "For Delivery";
          } else if (r.orderId) {
            derivedTransactionStatus = "Newly Synced";
          } else {
            derivedTransactionStatus = "Not Fulfilled";
          }
        }

        seen.set(r.invoiceId, {
          invoiceId: r.invoiceId,
          invoiceNo: r.invoiceNo,
          invoiceDate: r.invoiceDate,
          customerName: r.customerName,
          customerCode: r.customerCode,
          salesman: r.salesman,
          branch: r.branch,
          totalAmount: r.totalAmount,
          collection: r.collection,
          discountAmount: r.discountAmount || 0,
          transactionStatus: derivedTransactionStatus,
          paymentStatus: derivedPaymentStatus,
          paymentStatusDerived: derivedFlag,
          transactionStatusDerived: transDerivedFlag,
          divisionName: r.divisionName,
        });
        // If paymentStatus was originally null and we performed derivation but the
        // initial flag wasn't set above (older code path), ensure it's marked.
        if (
          r.paymentStatus == null &&
          hasNumericData &&
          ENABLE_DERIVE_PAYMENT_STATUS &&
          seen.get(r.invoiceId)?.paymentStatusDerived !== true
        ) {
          const entry = seen.get(r.invoiceId)!;
          entry.paymentStatusDerived = true;
        }
      }
    });
    return Array.from(seen.values()).sort(
      (a, b) =>
        new Date(b.invoiceDate ?? 0).getTime() -
        new Date(a.invoiceDate ?? 0).getTime(),
    );
  }, [filteredData]);

  // ── Return Records ─────────────────────────────────────────────────────────

  const returnRecords = React.useMemo((): ReturnRecord[] => {
    return filteredData
      .filter(
        (r) => (r.returnQuantity || 0) > 0 || (r.returnTotalAmount || 0) > 0,
      )
      .map((r) => ({
        invoiceId: r.invoiceId,
        invoiceNo: r.invoiceNo,
        invoiceDate: r.invoiceDate,
        customerName: r.customerName,
        productName: r.productName,
        productSupplier: r.productSupplier,
        salesman: r.salesman,
        branch: r.branch,
        returnQuantity: r.returnQuantity || 0,
        returnTotalAmount: r.returnTotalAmount || 0,
        returnNetAmount: r.returnNetAmount || 0,
        returnDiscountAmount: r.returnDiscountAmount || 0,
      }))
      .sort((a, b) => b.returnTotalAmount - a.returnTotalAmount);
  }, [filteredData]);

  // ── Top charts data ────────────────────────────────────────────────────────

  const topSalesmen = React.useMemo(
    () => salesmanSummaries.slice(0, 10),
    [salesmanSummaries],
  );

  const topProducts = React.useMemo(
    () => productSummaries.slice(0, 10),
    [productSummaries],
  );

  // Status distribution must reflect the deduplicated invoice-level summaries
  // (these summaries include derived transactionStatus/paymentStatus when the
  // code-only toggles are enabled). Use `invoiceSummaries` as the single
  // source of truth for charts so counts match the table.
  const statusDistribution = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const inv of invoiceSummaries) {
      const status = inv.transactionStatus ?? "N/A";
      map.set(status, (map.get(status) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  }, [invoiceSummaries]);

  const branchSummaries = React.useMemo((): BranchSummary[] => {
    const map = new Map<
      string,
      {
        totalSales: number;
        totalCollections: number;
        totalReturns: number;
        invoiceIds: Set<number>;
      }
    >();

    filteredData.forEach((r) => {
      const branchKey = r.branch || "(unknown)";
      if (!map.has(branchKey)) {
        map.set(branchKey, {
          totalSales: 0,
          totalCollections: 0,
          totalReturns: 0,
          invoiceIds: new Set(),
        });
      }

      const entry = map.get(branchKey)!;
      if (!entry.invoiceIds.has(r.invoiceId)) {
        entry.totalSales += r.totalAmount;
        entry.totalCollections += r.collection;
        entry.invoiceIds.add(r.invoiceId);
      }
      entry.totalReturns += r.returnTotalAmount || 0;
    });

    return Array.from(map.entries())
      .map(([name, d]) => ({
        name,
        totalSales: d.totalSales,
        totalCollections: d.totalCollections,
        totalReturns: d.totalReturns,
        invoiceCount: d.invoiceIds.size,
      }))
      .sort((a, b) => b.totalSales - a.totalSales);
  }, [filteredData]);

  return {
    rawData,
    filteredData,
    filters,
    setFilters,
    loading,
    loadedOnce,
    isLoadingFresh,
    fetchFailed,
    loadData,
    // Controls
    showVisualization,
    generateReport,
    // filter options
    uniqueBranches,
    uniqueSalesmen,
    uniqueStatuses,
    uniqueSuppliers,
    // computed
    kpis,
    salesByPeriod,
    getSalesByPeriod,
    salesmanSummaries,
    topSalesmen,
    customerSummaries,
    topCustomers,
    productSummaries,
    topProducts,
    invoiceSummaries,
    returnRecords,
    statusDistribution,
    branchSummaries,
  };
}
