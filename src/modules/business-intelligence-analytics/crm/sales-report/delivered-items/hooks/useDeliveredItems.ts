// src/modules/business-intelligence-analytics/crm/sales-report/delivered-items/hooks/useDeliveredItems.ts
"use client";

import * as React from "react";
import type {
  DateRangePreset,
  DeliveredItemRecord,
  DeliveredItemsFilters,
  DeliveredItemsKpis,
  CustomerDeliveredSummary,
  ProductDeliveredSummary,
  CustomerLookupItem,
} from "../types";

function fmtLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDateRangeFromPreset(
  preset: DateRangePreset,
  customStart: string,
  customEnd: string
): { start: string; end: string } {
  const now = new Date();
  switch (preset) {
    case "today": {
      const s = fmtLocalDate(now);
      return { start: s, end: s };
    }
    case "yesterday": {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      const s = fmtLocalDate(d);
      return { start: s, end: s };
    }
    case "this-week": {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return { start: fmtLocalDate(weekStart), end: fmtLocalDate(weekEnd) };
    }
    case "this-month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: fmtLocalDate(start), end: fmtLocalDate(end) };
    }
    case "this-year": {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return { start: fmtLocalDate(start), end: fmtLocalDate(end) };
    }
    case "custom":
      return { start: customStart, end: customEnd };
    default: {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: fmtLocalDate(start), end: fmtLocalDate(end) };
    }
  }
}

export function useDeliveredItems() {
  const now = new Date();
  const defaultStart = fmtLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const defaultEnd = fmtLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  const [filters, setFilters] = React.useState<DeliveredItemsFilters>({
    dateRangePreset: "this-month",
    startDate: defaultStart,
    endDate: defaultEnd,
    selectedCustomers: [],
    searchTerm: "",
  });

  const [rawData, setRawData] = React.useState<DeliveredItemRecord[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedCustomerModal, setSelectedCustomerModal] = React.useState<string | null>(null);

  // Dynamic database customer lookup state
  const [dbCustomerResults, setDbCustomerResults] = React.useState<CustomerLookupItem[]>([]);
  const [isSearchingDb, setIsSearchingDb] = React.useState<boolean>(false);

  const loadAbortRef = React.useRef<AbortController | null>(null);
  const searchAbortRef = React.useRef<AbortController | null>(null);

  // Sync date strings when preset changes
  React.useEffect(() => {
    if (filters.dateRangePreset !== "custom") {
      const { start, end } = getDateRangeFromPreset(
        filters.dateRangePreset,
        filters.startDate,
        filters.endDate
      );
      if (start !== filters.startDate || end !== filters.endDate) {
        setFilters((prev) => ({ ...prev, startDate: start, endDate: end }));
      }
    }
  }, [filters.dateRangePreset, filters.startDate, filters.endDate]);

  // Fetch report data
  const loadData = React.useCallback(async () => {
    if (loadAbortRef.current) {
      loadAbortRef.current.abort();
    }
    const controller = new AbortController();
    loadAbortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
      });

      if (filters.selectedCustomers.length > 0) {
        params.append("customers", filters.selectedCustomers.join(","));
      }

      const res = await fetch(`/api/bia/crm/sales-report/delivered-items?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Failed to fetch delivered items (${res.status})`);
      }

      const json = await res.json();
      const records = Array.isArray(json?.data) ? (json.data as DeliveredItemRecord[]) : [];
      setRawData(records);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      console.error("[useDeliveredItems] load error:", err);
      const msg = err instanceof Error ? err.message : "Error loading delivered items";
      setError(msg);
    } finally {
      if (loadAbortRef.current === controller) {
        setLoading(false);
      }
    }
  }, [filters.startDate, filters.endDate, filters.selectedCustomers]);

  // Initial fetch
  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Database customer search function
  const searchDatabaseCustomers = React.useCallback(async (query: string) => {
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setIsSearchingDb(true);
    try {
      const q = query.trim();
      const res = await fetch(
        `/api/bia/crm/sales-report/delivered-items?mode=customers&q=${encodeURIComponent(q)}`,
        { cache: "no-store", signal: controller.signal }
      );
      if (!controller.signal.aborted && res.ok) {
        const j = await res.json();
        setDbCustomerResults(Array.isArray(j.data) ? j.data : []);
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") {
        return;
      }
      console.warn("[useDeliveredItems] Customer lookup failed:", e);
    } finally {
      if (searchAbortRef.current === controller) {
        setIsSearchingDb(false);
      }
    }
  }, []);

  // Pre-load top customers on initial mount for the popover
  React.useEffect(() => {
    searchDatabaseCustomers("");
  }, [searchDatabaseCustomers]);

  // Unique customers from rawData
  const deliveredCustomersMap = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rawData) {
      const name = r.customerName || "Unknown Customer";
      map.set(name, (map.get(name) || 0) + (r.quantity || 1));
    }
    return map;
  }, [rawData]);

  // Combined list of customers for the filter:
  // includes database lookup results, selected customers, and customers in rawData
  const availableCustomers = React.useMemo(() => {
    const map = new Map<string, { name: string; totalQty: number; city?: string; province?: string }>();

    // 1. From database lookup results
    for (const dbCust of dbCustomerResults) {
      const name = dbCust.customer_name?.trim();
      if (name) {
        map.set(name, {
          name,
          totalQty: deliveredCustomersMap.get(name) || 0,
          city: dbCust.city,
          province: dbCust.province,
        });
      }
    }

    // 2. From currently selected customers
    for (const sel of filters.selectedCustomers) {
      if (!map.has(sel)) {
        map.set(sel, {
          name: sel,
          totalQty: deliveredCustomersMap.get(sel) || 0,
        });
      }
    }

    // 3. From raw delivered records
    for (const [name, qty] of deliveredCustomersMap.entries()) {
      const existing = map.get(name);
      if (existing) {
        existing.totalQty = qty;
      } else {
        map.set(name, { name, totalQty: qty });
      }
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [dbCustomerResults, filters.selectedCustomers, deliveredCustomersMap]);

  // Filtered dataset based on selected customers and table search term
  const filteredRecords = React.useMemo(() => {
    const hasCustomerFilter = filters.selectedCustomers.length > 0;
    const search = filters.searchTerm.trim().toLowerCase();

    return rawData.filter((r) => {
      // Customer filter
      if (hasCustomerFilter && !filters.selectedCustomers.includes(r.customerName)) {
        return false;
      }
      // Search term filter
      if (search) {
        const cName = (r.customerName || "").toLowerCase();
        const pName = (r.productName || "").toLowerCase();
        const city = (r.city || "").toLowerCase();
        const prov = (r.province || "").toLowerCase();
        const ord = (r.orderNo || "").toLowerCase();
        if (
          !cName.includes(search) &&
          !pName.includes(search) &&
          !city.includes(search) &&
          !prov.includes(search) &&
          !ord.includes(search)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [rawData, filters.selectedCustomers, filters.searchTerm]);

  // KPI Calculations
  const kpis = React.useMemo((): DeliveredItemsKpis => {
    const totalDeliveredItems = filteredRecords.reduce((sum, r) => sum + (r.quantity || 0), 0);
    const totalDeliveredAmount = filteredRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
    const activeCustomers = new Set(filteredRecords.map((r) => r.customerName));
    const uniqueProducts = new Set(filteredRecords.map((r) => r.productName));

    return {
      totalDeliveredItems,
      totalDeliveredAmount,
      activeCustomersCount: activeCustomers.size,
      uniqueProductsCount: uniqueProducts.size,
    };
  }, [filteredRecords]);

  // Customer Summaries
  const customerSummaries = React.useMemo((): CustomerDeliveredSummary[] => {
    const map = new Map<
      string,
      {
        city: string;
        province: string;
        items: number;
        amount: number;
        products: Map<string, number>;
        dates: string[];
      }
    >();

    for (const r of filteredRecords) {
      const name = r.customerName || "Unknown Customer";
      let entry = map.get(name);
      if (!entry) {
        entry = {
          city: r.city || "—",
          province: r.province || "—",
          items: 0,
          amount: 0,
          products: new Map<string, number>(),
          dates: [],
        };
        map.set(name, entry);
      }

      entry.items += r.quantity || 0;
      entry.amount += r.amount || 0;
      if (r.date) entry.dates.push(r.date);

      const pName = r.productName || "Unknown Product";
      entry.products.set(pName, (entry.products.get(pName) || 0) + (r.quantity || 0));
    }

    return Array.from(map.entries())
      .map(([customerName, data]) => {
        let topProduct = "—";
        let maxQty = -1;
        for (const [p, qty] of data.products.entries()) {
          if (qty > maxQty) {
            maxQty = qty;
            topProduct = p;
          }
        }

        const sortedDates = [...data.dates].sort().reverse();
        const lastDeliveryDate = sortedDates[0] || "—";

        return {
          customerName,
          city: data.city,
          province: data.province,
          totalItemsDelivered: data.items,
          totalDeliveredAmount: data.amount,
          uniqueProductsCount: data.products.size,
          topProduct,
          lastDeliveryDate,
        };
      })
      .sort((a, b) => b.totalItemsDelivered - a.totalItemsDelivered);
  }, [filteredRecords]);

  // Product Summaries
  const productSummaries = React.useMemo((): ProductDeliveredSummary[] => {
    const map = new Map<
      string,
      {
        productId?: number;
        supplier: string;
        totalQuantity: number;
        totalAmount: number;
        customers: Set<string>;
      }
    >();

    for (const r of filteredRecords) {
      const name = r.productName || "Unknown Product";
      let entry = map.get(name);
      if (!entry) {
        entry = {
          productId: r.productId,
          supplier: r.supplier || "—",
          totalQuantity: 0,
          totalAmount: 0,
          customers: new Set<string>(),
        };
        map.set(name, entry);
      }

      entry.totalQuantity += r.quantity || 0;
      entry.totalAmount += r.amount || 0;
      if (r.customerName) entry.customers.add(r.customerName);
    }

    return Array.from(map.entries())
      .map(([productName, data]) => ({
        productId: data.productId,
        productName,
        supplier: data.supplier,
        totalQuantity: data.totalQuantity,
        totalAmount: data.totalAmount,
        customersCount: data.customers.size,
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [filteredRecords]);

  // Customer items for modal drilldown
  const modalCustomerItems = React.useMemo(() => {
    if (!selectedCustomerModal) return [];
    return rawData.filter((r) => r.customerName === selectedCustomerModal);
  }, [rawData, selectedCustomerModal]);

  // Customer selection helpers
  const selectAllCustomers = () => {
    setFilters((prev) => ({
      ...prev,
      selectedCustomers: availableCustomers.map((c) => c.name),
    }));
  };

  const clearAllCustomers = () => {
    setFilters((prev) => ({
      ...prev,
      selectedCustomers: [],
    }));
  };

  const toggleCustomer = (customerName: string) => {
    setFilters((prev) => {
      const exists = prev.selectedCustomers.includes(customerName);
      return {
        ...prev,
        selectedCustomers: exists
          ? prev.selectedCustomers.filter((c) => c !== customerName)
          : [...prev.selectedCustomers, customerName],
      };
    });
  };

  return {
    filters,
    setFilters,
    rawData,
    filteredRecords,
    availableCustomers,
    customerSummaries,
    productSummaries,
    kpis,
    loading,
    error,
    loadData,
    searchDatabaseCustomers,
    isSearchingDb,
    selectAllCustomers,
    clearAllCustomers,
    toggleCustomer,
    selectedCustomerModal,
    setSelectedCustomerModal,
    modalCustomerItems,
  };
}
