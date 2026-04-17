"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { toast } from "sonner";
import type { VisitRecord, DriverOption, Filters } from "../types";
import {
  fetchDriverCustomerVisits,
  fetchDriverOptions,
} from "../providers/fetchprovider";

type ContextValue = {
  filters: Filters;
  setFilters: (patch: Partial<Filters>) => void;
  data: VisitRecord[];
  loading: boolean;
  error?: string | null;
  drivers: DriverOption[];
  refresh: (opts?: { page?: number; limit?: number }) => Promise<void>;

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

  const computePrevRange = useCallback((start?: string, end?: string) => {
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
  }, []);

  // derive a stable string key for driverNames so effects don't re-run on array identity changes
  // const driverNamesKey = (filters.driverNames || []).join(",");

  const refresh = useCallback(async (opts?: { page?: number; limit?: number }) => {
    setLoading(true);
    setError(null);

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
        search: filters.searchCustomer,
        page: opts?.page,
        limit: opts?.limit,
      });

      setData(r.rows ?? []);
      setTotal(r.total ?? 0);

      const now = new Date().toISOString();
      setLastSync(now);

      // fetch prev period for comparison (if available) but do not await it --
      // run in background so large previous-period requests don't block UI
      const prev = computePrevRange(filters.startDate, filters.endDate);
      if (prev) {
        (async () => {
          try {
            const prevRes = await fetchDriverCustomerVisits({
              startDate: prev.start,
              endDate: prev.end,
              driverNames: filters.driverNames,
              limit: -1,
            });
            setPrevData(prevRes.rows ?? []);
          } catch (prevErr) {
            const prevMsg =
              prevErr instanceof Error ? prevErr.message : String(prevErr);
            // show a non-blocking warning if prev fails
            toast.warning("Previous-period data unavailable", {
              description: prevMsg,
            });
            setPrevData(undefined);
          }
        })();
      } else {
        setPrevData(undefined);
      }

      // Mark success immediately after current dataset loads (prev fetch continues in background)
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
  }, [
    filters.startDate,
    filters.endDate,
    filters.driverNames,
    filters.searchCustomer,
    computePrevRange,
  ]);

  useEffect(() => {
    // refresh when core filters change. Fetch the full dataset (limit=-1)
    // so pagination can be performed client-side without triggering
    // additional network requests when the UI page changes.
    refresh({ page: 1, limit: -1 });
  }, [refresh]);

  const setFilters = (patch: Partial<Filters>) =>
    setFiltersState((prev) => ({ ...prev, ...patch }));

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
