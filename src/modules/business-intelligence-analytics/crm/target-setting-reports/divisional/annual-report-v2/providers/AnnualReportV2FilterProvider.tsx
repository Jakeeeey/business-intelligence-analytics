"use client";

import React, { createContext, useContext, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format, startOfYear, endOfYear } from "date-fns";

export interface AnnualReportV2Filters {
  dateFrom: string;
  dateTo: string;
  customerName: string;
  supplierName: string;
  categoryName: string;
  unitName: string;
  year: string;
  month: string;
  amountType: string;
  priceType: string;
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

  const [filters, setFilters] = React.useState<AnnualReportV2Filters>(() => {
    const year = searchParams.get("year") ?? String(new Date().getFullYear());
    return {
      dateFrom:
        searchParams.get("dateFrom") ??
        format(startOfYear(new Date(Number(year), 0, 1)), "yyyy-MM-dd"),
      dateTo:
        searchParams.get("dateTo") ??
        format(endOfYear(new Date(Number(year), 11, 31)), "yyyy-MM-dd"),
      year,
      month: searchParams.get("month") ?? "",
      amountType: searchParams.get("amountType") ?? "netAmount",
      customerName: searchParams.get("customerName") ?? "",
      supplierName: searchParams.get("supplierName") ?? "",
      categoryName: searchParams.get("categoryName") ?? "",
      unitName: searchParams.get("unitName") ?? "",
      priceType: searchParams.get("priceType") ?? "",
    };
  });

  const setFilter = useCallback(
    (key: keyof AnnualReportV2Filters, value: string) => {
      let updatedDateFrom = "";
      let updatedDateTo = "";
      
      setFilters((prev) => {
        const next = { ...prev, [key]: value };
        
        // If year changes, also update dateFrom and dateTo
        if (key === "year") {
          next.dateFrom = format(startOfYear(new Date(Number(value), 0, 1)), "yyyy-MM-dd");
          next.dateTo = format(endOfYear(new Date(Number(value), 11, 31)), "yyyy-MM-dd");
          updatedDateFrom = next.dateFrom;
          updatedDateTo = next.dateTo;
        }
        
        return next;
      });

      // Execute side-effect outside the pure setState function
      if (key === "year") {
        const params = new URLSearchParams(searchParams.toString());
        params.set("year", value);
        params.set("dateFrom", updatedDateFrom);
        params.set("dateTo", updatedDateTo);
        router.replace(`?${params.toString()}`, { scroll: false });
      }
    },
    [router, searchParams],
  );

  const resetFilters = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      month: "",
      amountType: "netAmount",
      priceType: "",
      customerName: "",
      supplierName: "",
      categoryName: "",
      unitName: "",
    }));
    // We don't need to push to URL since these aren't in the URL anymore
  }, []);

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
