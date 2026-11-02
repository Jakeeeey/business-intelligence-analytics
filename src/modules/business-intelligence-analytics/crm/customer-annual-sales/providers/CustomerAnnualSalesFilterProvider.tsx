"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { CustomerAnnualSalesFilters } from "../types/customer-annual-sales.schema";

interface CustomerAnnualSalesFilterContextValue {
  filters: CustomerAnnualSalesFilters;
  setFilter: <K extends keyof CustomerAnnualSalesFilters>(
    key: K,
    value: CustomerAnnualSalesFilters[K]
  ) => void;
  resetFilters: () => void;
}

const defaultFilters: CustomerAnnualSalesFilters = {
  year: String(new Date().getFullYear()),
  month: "",
  salesmanId: "",
  customerName: "",
  supplierName: "",
  categoryName: "",
  unitName: "",
  priceType: "",
  amountType: "netAmount",
};

const CustomerAnnualSalesFilterContext = createContext<
  CustomerAnnualSalesFilterContextValue | undefined
>(undefined);

export function CustomerAnnualSalesFilterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [filters, setFilters] = useState<CustomerAnnualSalesFilters>(defaultFilters);

  const setFilter = useCallback(
    <K extends keyof CustomerAnnualSalesFilters>(
      key: K,
      value: CustomerAnnualSalesFilters[K]
    ) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const value = useMemo(
    () => ({ filters, setFilter, resetFilters }),
    [filters, setFilter, resetFilters]
  );

  return (
    <CustomerAnnualSalesFilterContext.Provider value={value}>
      {children}
    </CustomerAnnualSalesFilterContext.Provider>
  );
}

export function useCustomerAnnualSalesFilters(): CustomerAnnualSalesFilterContextValue {
  const ctx = useContext(CustomerAnnualSalesFilterContext);
  if (!ctx) {
    throw new Error(
      "useCustomerAnnualSalesFilters must be used within CustomerAnnualSalesFilterProvider"
    );
  }
  return ctx;
}
