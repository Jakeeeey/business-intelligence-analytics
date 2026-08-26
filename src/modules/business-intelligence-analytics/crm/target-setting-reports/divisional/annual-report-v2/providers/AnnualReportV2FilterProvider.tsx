"use client";

import React, { createContext, useContext, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  startOfYear, endOfYear, startOfMonth, endOfMonth, format,
} from "date-fns";

export interface AnnualReportV2Filters {
  dateFrom: string;
  dateTo: string;
  customerName: string;
  supplierName: string;
  categoryName: string;
  year: string;
  month: string;
}

interface AnnualReportV2FilterContextValue {
  filters: AnnualReportV2Filters;
  setFilter: (key: keyof AnnualReportV2Filters, value: string) => void;
  resetFilters: () => void;
}

const AnnualReportV2FilterContext =
  createContext<AnnualReportV2FilterContextValue | null>(null);

export function AnnualReportV2FilterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramsStr = searchParams.toString();

  const filters: AnnualReportV2Filters = useMemo(() => {
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
        categoryName: sp.get("categoryName") ?? "",
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
      categoryName: sp.get("categoryName") ?? "",
      year,
      month,
    };
  }, [paramsStr]);

  const setFilter = useCallback(
    (key: keyof AnnualReportV2Filters, value: string) => {
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
    <AnnualReportV2FilterContext.Provider
      value={{ filters, setFilter, resetFilters }}
    >
      {children}
    </AnnualReportV2FilterContext.Provider>
  );
}

export function useAnnualReportV2Filters(): AnnualReportV2FilterContextValue {
  const ctx = useContext(AnnualReportV2FilterContext);
  if (!ctx) {
    throw new Error(
      "useAnnualReportV2Filters must be used within AnnualReportV2FilterProvider",
    );
  }
  return ctx;
}
