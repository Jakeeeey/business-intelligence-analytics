"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import type { VisitRecord, DriverOption, Filters } from "../types";
import {
  fetchDriverCustomerVisits,
  fetchDriverOptions,
} from "../providers/fetchprovider";

type ContextValue = {
  filters: Filters;
  setFilters: (
    patch: Partial<Filters> | ((prev: Filters) => Partial<Filters>),
  ) => void;
  data: VisitRecord[];
  loading: boolean;
  error?: string | null;
  drivers: DriverOption[];
  refresh: (opts?: { page?: number; limit?: number }) => Promise<void>;
  page: number;
  setPage: (p: number) => void;
  limit: number;
  setLimit: (n: number) => void;
  total: number;
  prevData?: VisitRecord[];
  lastSync?: string;
};

const DriverKPIContext = createContext<ContextValue | undefined>(undefined);

export const DriverKPIProvider: React.FC<React.PropsWithChildren<object>> = ({
  children,
}) => {
  const [filters, setFiltersState] = useState<Filters>(() => {
    // default to this calendar month
    const now = new Date();

    // Helper to format as YYYY-MM-DD
    function formatDatePH(date: Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    const start = formatDatePH(new Date(now.getFullYear(), now.getMonth(), 1));
    const end = formatDatePH(
      new Date(now.getFullYear(), now.getMonth() + 1, 0),
    );

    return {
      startDate: start,
      endDate: end,
      driverNames: [],
    };
  });
  const [data, setData] = useState<VisitRecord[]>([]);
  const [prevData, setPrevData] = useState<VisitRecord[] | undefined>(
    undefined,
  );
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);
  const [lastSync, setLastSync] = useState<string | undefined>(undefined);
  // track the active toast id so we can update/dismiss it safely
  const activeToastRef = useRef<string | number | null>(null);

  useEffect(() => {
    // load drivers (mapped to UI options)
    // Per request: filter by department (8) instead of by position only.
    // Pass `position: null` to avoid applying the default 'Driver' position filter.
    fetchDriverOptions({ limit: -1, department: 8, position: null })
      .then((res) => setDrivers(res || []))
      .catch(() => setDrivers([]));
  }, []);

  function computePrevRange(start?: string, end?: string) {
    if (!start || !end) return null;
    try {
      const s = new Date(start);
      const e = new Date(end);
      const msPerDay = 24 * 60 * 60 * 1000;
      const days = Math.round((e.getTime() - s.getTime()) / msPerDay) + 1;
      const prevEnd = new Date(s.getTime() - msPerDay);
      const prevStart = new Date(prevEnd.getTime() - (days - 1) * msPerDay);
      const toISO = (d: Date) => d.toISOString().slice(0, 10);
      return { start: toISO(prevStart), end: toISO(prevEnd) };
    } catch {
      return null;
    }
  }

  const refresh = async (opts?: { page?: number; limit?: number }) => {
    setLoading(true);
    setError(null);
    const p = opts?.page ?? page;
    const l = opts?.limit ?? limit;
    try {
      if (activeToastRef.current != null) {
        // dismiss the previous toast explicitly by id to avoid leaving stale toasts
        toast.dismiss(activeToastRef.current);
        activeToastRef.current = null;
      }
    } catch {}

    // include active period in the loading toast so users know what is being fetched
    const periodText =
      filters.startDate && filters.endDate
        ? `${filters.startDate} → ${filters.endDate}`
        : "all dates";
    const driverText =
      filters.driverNames && filters.driverNames.length > 0
        ? `${filters.driverNames.length} drivers`
        : "all drivers";
    activeToastRef.current = toast.loading(
      `Loading data (${periodText} · ${driverText})`,
    );
    try {
      const r = await fetchDriverCustomerVisits({
        startDate: filters.startDate,
        endDate: filters.endDate,
        driverNames: filters.driverNames,
        page: p,
        limit: l,
        search: filters.searchCustomer,
      });

      setData(r.rows ?? []);
      setTotal(r.total ?? 0);

      // If we explicitly fetched the full dataset (limit === -1), keep the
      // UI page/limit as-is (client-side pagination). Otherwise update page/limit
      // from the server response.
      if (opts?.limit === -1) {
        setPage(opts?.page ?? 1);
        // do not override `limit` when fetching all rows
      } else {
        setPage(r.page ?? p);
        setLimit(r.limit ?? l);
      }

      const now = new Date().toISOString();
      setLastSync(now);
      // fetch prev period for comparison (if available) and only show success after both finish
      const prev = computePrevRange(filters.startDate, filters.endDate);
      if (prev) {
        try {
          const prevRes = await fetchDriverCustomerVisits({
            startDate: prev.start,
            endDate: prev.end,
            driverNames: filters.driverNames,
            limit: -1,
          });
          setPrevData(prevRes.rows ?? []);
        } catch (prevErr) {
          // don't fail the whole refresh if prev fetch fails; surface as a warning toast
          const prevMsg =
            prevErr instanceof Error ? prevErr.message : String(prevErr);
          if (activeToastRef.current != null) {
            toast.warning("Previous-period data unavailable", {
              id: activeToastRef.current,
              description: prevMsg,
            });
          } else {
            toast.warning("Previous-period data unavailable", {
              description: prevMsg,
            });
          }
          setPrevData(undefined);
        }
      } else {
        setPrevData(undefined);
      }

      // Only mark success after both current and prev (if applicable) complete
      if (activeToastRef.current != null) {
        toast.success(`Data loaded (${periodText} · ${driverText})`, {
          id: activeToastRef.current,
        });
        activeToastRef.current = null;
      } else {
        toast.success(`Data loaded (${periodText} · ${driverText})`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      if (activeToastRef.current != null) {
        toast.error("Failed to load data", {
          description: message,
          id: activeToastRef.current,
        });
        activeToastRef.current = null;
      } else {
        toast.error("Failed to load data", { description: message });
      }
    } finally {
      setLoading(false);
    }
  };

  const driverNamesKey = (filters.driverNames || []).join(",");

  useEffect(() => {
    // refresh when core filters change (dates or driver selection).
    // IMPORTANT: do NOT refresh on `filters.searchCustomer` so typing in
    // the search box doesn't trigger a network request on every keystroke.
    // Search is applied client-side against the already-fetched dataset.
    refresh({ page: 1, limit: -1 });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.startDate, filters.endDate, driverNamesKey]);

  const setFilters = (
    patch: Partial<Filters> | ((prev: Filters) => Partial<Filters>),
  ) =>
    setFiltersState((prev) => ({
      ...prev,
      ...(typeof patch === "function" ? patch(prev) : patch),
    }));

  return (
    <DriverKPIContext.Provider
      value={{
        filters,
        setFilters,
        data,
        loading,
        error,
        drivers,
        refresh,
        page,
        setPage,
        limit,
        setLimit,
        total,
        prevData,
        lastSync,
      }}
    >
      {children}
    </DriverKPIContext.Provider>
  );
};

export function useDriverKPI() {
  const ctx = useContext(DriverKPIContext);
  if (!ctx)
    throw new Error("useDriverKPI must be used within DriverKPIProvider");
  return ctx;
}
