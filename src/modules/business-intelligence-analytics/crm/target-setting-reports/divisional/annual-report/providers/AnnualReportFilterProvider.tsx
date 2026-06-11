"use client";

import React, { createContext, useContext, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  startOfYear, endOfYear, startOfMonth, endOfMonth, format,
} from "date-fns";

export interface AnnualReportFilters {
  dateFrom: string;
  dateTo: string;
  customerName: string;
  supplierName: string;
  year: string;
  month: string;
}

interface AnnualReportFilterContextValue {
  filters: AnnualReportFilters;
  setFilter: (key: keyof AnnualReportFilters, value: string) => void;
  resetFilters: () => void;
}

const AnnualReportFilterContext =
  createContext<AnnualReportFilterContextValue | null>(null);

export function AnnualReportFilterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramsStr = searchParams.toString();

  const filters: AnnualReportFilters = useMemo(() => {
    const sp = new URLSearchParams(paramsStr);
    const year = sp.get("year") ?? String(new Date().getFullYear());
    const month = sp.get("month") ?? "";

    if (month) {
      const m = Number(month);
      const base = new Date(Number(year), m - 1, 1);
      return {
        dateFrom: sp.get("dateFrom") ?? format(startOfMonth(base), "yyyy-MM-dd"),
        dateTo: sp.get("dateTo") ?? format(endOfMonth(base), "yyyy-MM-dd"),
        customerName: sp.get("customerName") ?? "",
        supplierName: sp.get("supplierName") ?? "",
        year,
        month,
      };
    }

    return {
      dateFrom:
        sp.get("dateFrom") ??
        format(startOfYear(new Date(Number(year), 0, 1)), "yyyy-MM-dd"),
      dateTo:
        sp.get("dateTo") ??
        format(endOfYear(new Date(Number(year), 11, 31)), "yyyy-MM-dd"),
      customerName: sp.get("customerName") ?? "",
      supplierName: sp.get("supplierName") ?? "",
      year,
      month,
    };
  }, [paramsStr]);

  const setFilter = useCallback(
    (key: keyof AnnualReportFilters, value: string) => {
      const params = new URLSearchParams(paramsStr);
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, paramsStr],
  );

  const resetFilters = useCallback(() => {
    router.replace(window.location.pathname, { scroll: false });
  }, [router]);

  return (
    <AnnualReportFilterContext.Provider
      value={{ filters, setFilter, resetFilters }}
    >
      {children}
    </AnnualReportFilterContext.Provider>
  );
}

export function useAnnualReportFilters(): AnnualReportFilterContextValue {
  const ctx = useContext(AnnualReportFilterContext);
  if (!ctx) {
    throw new Error(
      "useAnnualReportFilters must be used within AnnualReportFilterProvider",
    );
  }
  return ctx;
}
