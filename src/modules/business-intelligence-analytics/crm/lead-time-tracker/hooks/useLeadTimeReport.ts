"use client";

import * as React from "react";
import { toast } from "sonner";

import type {
  DateRangePreset,
  LeadTimeFilters,
  LeadTimeProductOption,
  LeadTimeRow,
  LeadTimeRecord,
} from "../types";
import {
  fetchLeadTimeData,
  fetchLeadTimeProducts,
} from "../providers/fetchProvider";
import normalizeAndAggregate from "../utils/groupData";

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
const getDefaultFilters = (): LeadTimeFilters => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    dateRangePreset: "this-month",
    dateFrom: fmtLocalDate(monthStart),
    dateTo: fmtLocalDate(monthEnd),
    productIds: [],
    productNames: null,
  };
};

export const getDateRangeFromPreset = (
  preset: DateRangePreset,
  customFrom: string,
  customTo: string,
): { from: string; to: string } => {
  
  const now = new Date();
  const DAY_MS = 24 * 60 * 60 * 1000;

  const addDays = (base: Date, days: number) =>
    new Date(base.getTime() + days * DAY_MS);

  const getWeekBounds = (base: Date) => {
    const start = new Date(base);
    start.setDate(base.getDate() - base.getDay());
    const end = addDays(start, 6);
    return { start, end };
  };

  const getQuarterBounds = (year: number, quarterIndex: number) => {
    const startMonth = quarterIndex * 3;
    const start = new Date(year, startMonth, 1);
    const end = new Date(year, startMonth + 3, 0);
    return { start, end };
  };

  switch (preset) {
    case "day-before-yesterday": {
      const d = addDays(now, -2);
      const dateStr = fmtLocalDate(d);
      return { from: dateStr, to: dateStr };
    }
    case "yesterday": {
      const yesterday = addDays(now, -1);
      const dateStr = fmtLocalDate(yesterday);
      return { from: dateStr, to: dateStr };
    }
    case "today": {
      const dateStr = fmtLocalDate(now);
      return { from: dateStr, to: dateStr };
    }
    case "this-week": {
      const { start: weekStart, end: weekEnd } = getWeekBounds(now);
      return { from: fmtLocalDate(weekStart), to: fmtLocalDate(weekEnd) };
    }
    case "last-week": {
      const { start: thisWeekStart } = getWeekBounds(now);
      const lastWeekStart = addDays(thisWeekStart, -7);
      const lastWeekEnd = addDays(lastWeekStart, 6);
      return {
        from: fmtLocalDate(lastWeekStart),
        to: fmtLocalDate(lastWeekEnd),
      };
    }
    case "last-7-days": {
      const start = addDays(now, -6);
      return { from: fmtLocalDate(start), to: fmtLocalDate(now) };
    }
    case "last-2-weeks": {
      const start = addDays(now, -13);
      return { from: fmtLocalDate(start), to: fmtLocalDate(now) };
    }
    case "this-month": {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: fmtLocalDate(monthStart), to: fmtLocalDate(monthEnd) };
    }
    case "last-month": {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: fmtLocalDate(monthStart), to: fmtLocalDate(monthEnd) };
    }
    case "last-30-days": {
      const start = addDays(now, -29);
      return { from: fmtLocalDate(start), to: fmtLocalDate(now) };
    }
    case "last-2-months": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: fmtLocalDate(start), to: fmtLocalDate(end) };
    }
    case "this-quarter": {
      const quarterIndex = Math.floor(now.getMonth() / 3);
      const { start, end } = getQuarterBounds(now.getFullYear(), quarterIndex);
      return { from: fmtLocalDate(start), to: fmtLocalDate(end) };
    }
    case "last-quarter": {
      const quarterIndex = Math.floor(now.getMonth() / 3);
      const lastQuarterIndex = quarterIndex - 1;
      if (lastQuarterIndex >= 0) {
        const { start, end } = getQuarterBounds(
          now.getFullYear(),
          lastQuarterIndex,
        );
        return { from: fmtLocalDate(start), to: fmtLocalDate(end) };
      }

      const { start, end } = getQuarterBounds(now.getFullYear() - 1, 3);
      return { from: fmtLocalDate(start), to: fmtLocalDate(end) };
    }
    case "last-3-months": {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return { from: fmtLocalDate(start), to: fmtLocalDate(now) };
    }
    case "last-2-quarters": {
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      return { from: fmtLocalDate(start), to: fmtLocalDate(now) };
    }
    case "this-year": {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearEnd = new Date(now.getFullYear(), 11, 31);
      return { from: fmtLocalDate(yearStart), to: fmtLocalDate(yearEnd) };
    }
    case "last-year": {
      const yearStart = new Date(now.getFullYear() - 1, 0, 1);
      const yearEnd = new Date(now.getFullYear() - 1, 11, 31);
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

export function useLeadTimeReport(opts?: { prefetchKeysOnly?: boolean }) {
  const prefetchKeysOnly = opts?.prefetchKeysOnly ?? true;

  const [filters, setFilters] =
    React.useState<LeadTimeFilters>(getDefaultFilters);
  const [products, setProducts] = React.useState<LeadTimeProductOption[]>([]);
  const [rows, setRows] = React.useState<LeadTimeRow[]>([]);
  const [loadingFilters, setLoadingFilters] = React.useState(false);
  const [loadingData, setLoadingData] = React.useState(false);
  const [loadedOnce, setLoadedOnce] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const abortRef = React.useRef<AbortController | null>(null);
  // Note: we do not persist prefetched full rows for reuse — always fetch
  // live data when applying filters to ensure up-to-date results.

  // Remember last prefetch meta so generate/apply can reuse prefetched rows
  const lastPrefetchMetaRef = React.useRef<{
    from: string;
    to: string;
    productNames?: string[] | null;
    keysOnly: boolean;
  } | null>(null);

  // Toast tracking for long-running prefetches
  const activeToastRef = React.useRef<string | number | null>(null);

  // Sync dateFrom/dateTo when preset changes (except custom)
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
  }, [filters.dateRangePreset, filters.dateFrom, filters.dateTo]);

  // Load product options on mount (Directus-backed product list). Fetch once
  // when the page loads — product options are static in Directus and do not
  // need to be re-fetched on every date range change.
  React.useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const toastId = "lead-time-filter-prefetch";
    setLoadingFilters(true);
    activeToastRef.current = toast.loading("Loading product options...", {
      id: toastId,
    });

    (async () => {
      try {
        // Use initial/default filters for the one-time prefetch so the
        // product lookup is deterministic and doesn't cause the effect to
        // re-run when the user adjusts date ranges.
        const initialFilters = getDefaultFilters();
        const { from: preFrom, to: preTo } = getDateRangeFromPreset(
          initialFilters.dateRangePreset,
          initialFilters.dateFrom,
          initialFilters.dateTo,
        );

        // Primary attempt: Directus via server proxy returning lightweight
        // product lookup lists (fast). This keeps the static token server-side.
        if (prefetchKeysOnly) {
          try {
            const opts = await fetchLeadTimeProducts(controller.signal);
            if (cancelled) return;
            setProducts(opts);
            lastPrefetchMetaRef.current = {
              from: preFrom,
              to: preTo,
              productNames: null,
              keysOnly: true,
            };
            toast.success("Product options loaded", {
              id: toastId,
              duration: 2000,
            });
            return;
          } catch (e) {
            // fallthrough to server-side prefetch
            console.warn(
              "Directus product prefetch failed, falling back to server prefetch",
              e,
            );
          }
        }

        // Fallback: prefetch full rows from our backend route (may be heavier,
        // but ensures filter lists are populated even if Directus proxy fails).
        try {
          const rowsPrefetch = await fetchLeadTimeData(
            { from: preFrom, to: preTo },
            controller.signal,
          );
          if (cancelled) return;

          // Derive unique product list from prefetched rows
          const names = Array.from(
            new Set(
              rowsPrefetch
                .map(
                  (r: LeadTimeRecord) =>
                    r.product_name ?? r.productName ?? r.name,
                )
                .filter((v): v is string => Boolean(v)),
            ),
          );
          const mapped = names.map((n) => ({ id: String(n), name: n }));
          setProducts(mapped);

          lastPrefetchMetaRef.current = {
            from: preFrom,
            to: preTo,
            productNames: null,
            keysOnly: false,
          };

          toast.success("Product options loaded (fallback)", {
            id: toastId,
            duration: 2000,
          });
          return;
        } catch (e: unknown) {
          const msg =
            e instanceof Error ? e.message : "Failed to load product filters";
          toast.error(msg, { id: toastId, duration: 4000 });
        }
      } finally {
        if (!cancelled) setLoadingFilters(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      toast.dismiss("lead-time-filter-prefetch");
    };
  }, [prefetchKeysOnly]);

  const applyFilters = React.useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoadingData(true);
    setError(null);

    const { from, to } = getDateRangeFromPreset(
      filters.dateRangePreset,
      filters.dateFrom,
      filters.dateTo,
    );

    // Basic validation: ensure dates are present and from <= to
    const fromD = parseDateLocal(from);
    const toD = parseDateLocal(to);
    if (isNaN(fromD.getTime()) || isNaN(toD.getTime())) {
      const msg =
        "Invalid date range: please provide valid start and end dates.";
      setError(msg);
      toast.error(msg, { duration: 3000 });
      setLoadingData(false);
      return;
    }
    if (fromD.getTime() > toD.getTime()) {
      const msg =
        "Invalid date range: start date must be before or equal to end date.";
      setError(msg);
      toast.error(msg, { duration: 3000 });
      setLoadingData(false);
      return;
    }

    const selectedProductNames =
      filters.productIds && filters.productIds.length > 0
        ? (filters.productIds
            .map((id) => {
              const idStr = String(id);
              return products.find((p) => String(p.id) === idStr)?.name;
            })
            .filter(Boolean) as string[])
        : [];

    const loadingToast = toast.loading("Loading lead time data...");

    // NOTE: we intentionally do NOT reuse previously-prefetched full rows
    // here. Always fetch the latest lead time data from the backend to
    // ensure users see up-to-date information instead of potentially stale
    // cached data.

    const MAX_RETRIES = 3;
    let lastError: unknown = null;
    try {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        if (controller.signal.aborted) return;
        try {
          // If multiple products selected, fetch each product separately
          // (backend accepts only a single productName param). Merge the
          // results client-side and run the normal aggregation.
          let combined: LeadTimeRecord[] = [];
          if (selectedProductNames.length <= 1) {
            const data = await fetchLeadTimeData(
              { from, to, productName: selectedProductNames[0] ?? undefined },
              controller.signal,
            );
            combined = data;
          } else {
            const responses = await Promise.all(
              selectedProductNames.map((name) =>
                fetchLeadTimeData(
                  { from, to, productName: name },
                  controller.signal,
                ),
              ),
            );
            combined = responses.flat();
          }

          const deduped = normalizeAndAggregate(combined as unknown[]);
          setRows(deduped);
          setLoadedOnce(true);
          toast.success("Lead time data ready", {
            id: loadingToast,
            duration: 2500,
          });
          lastError = null;
          break;
        } catch (err: unknown) {
          lastError = err;
          const e = err as { status?: number; name?: string };
          if (e?.name === "AbortError" || controller.signal.aborted) return;
          const isNetwork = !e?.status;
          const isServer = (e?.status ?? 0) >= 500 && (e?.status ?? 0) < 600;
          const shouldRetry = (isNetwork || isServer) && attempt < MAX_RETRIES;
          if (shouldRetry) {
            toast.loading(`Retrying fetch ${attempt + 1}/${MAX_RETRIES}...`, {
              id: loadingToast,
            });
            // exponential backoff
            await new Promise((r) => setTimeout(r, attempt * 500));
            continue;
          }
          break;
        }
      }

      if (lastError) {
        const e = lastError as { message?: string; status?: number };
        const msg = e?.message || "Failed to load lead time data";
        setError(msg);
        toast.error(msg, { id: loadingToast, duration: 4000 });
      }
    } finally {
      setLoadingData(false);
    }
  }, [filters, products]);

  const readyState = {
    hasData: rows.length > 0,
    loadedOnce,
  };

  return {
    filters,
    setFilters,
    products,
    rows,
    loadingFilters,
    loadingData,
    error,
    applyFilters,
    readyState,
  } as const;
}
