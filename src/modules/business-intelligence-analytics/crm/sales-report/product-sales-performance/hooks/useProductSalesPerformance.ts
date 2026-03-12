// src/modules/business-intelligence-analytics/sales-report/product-sales-performance/hooks/useProductSalesPerformance.ts
"use client";

import * as React from "react";
import { toast } from "sonner";
import type {
  ProductSaleRecord,
  ProductPerformanceFilters,
  ProductPerformanceKpis,
  RevenueByPeriod,
  TopItem,
  LocationRevenue,
  ProductTrend,
  SupplierPerformance,
  DateRangePreset,
} from "../types";
import { fetchProductSalesData } from "../providers/fetchProvider";

const getDefaultFilters = (): ProductPerformanceFilters => {
  const now = new Date();

  return {
    dateRangePreset: "this-month",
    dateFrom: now.toISOString().split("T")[0],
    dateTo: now.toISOString().split("T")[0],
    suppliers: [],
    products: [],
    cities: [],
    provinces: [],
  };
};

// Calculate actual date range from preset
const getDateRangeFromPreset = (preset: DateRangePreset, customFrom: string, customTo: string): { from: string; to: string } => {
  const now = new Date();
  let from: Date;
  let to: Date;

  switch (preset) {
    case "yesterday":
      from = new Date(now);
      from.setDate(now.getDate() - 1);
      to = new Date(from);
      break;
    
    case "today":
      from = new Date(now);
      to = new Date(now);
      break;
    
    case "tomorrow":
      from = new Date(now);
      from.setDate(now.getDate() + 1);
      to = new Date(from);
      break;
    
    case "this-week":
      // Start of week (Sunday)
      from = new Date(now);
      from.setDate(now.getDate() - now.getDay());
      // End of week (Saturday)
      to = new Date(from);
      to.setDate(from.getDate() + 6);
      break;
    
    case "this-month":
      // Start of month
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      // End of month
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    
    case "this-year":
      // Start of year
      from = new Date(now.getFullYear(), 0, 1);
      // End of year
      to = new Date(now.getFullYear(), 11, 31);
      break;
    
    case "custom":
      return { from: customFrom, to: customTo };
    
    default:
      from = new Date(now);
      to = new Date(now);
  }

  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
};

export function useProductSalesPerformance() {
  const [rawData, setRawData] = React.useState<ProductSaleRecord[]>([]);
  const [filteredData, setFilteredData] = React.useState<ProductSaleRecord[]>([]);
  const [filters, setFilters] = React.useState<ProductPerformanceFilters>(getDefaultFilters);
  const [loading, setLoading] = React.useState(false);
  const [loadedOnce, setLoadedOnce] = React.useState(false);
  const [isLoadingFresh, setIsLoadingFresh] = React.useState(false);

  // Load initial data with caching support
  async function loadData() {
    setLoading(true);
    setIsLoadingFresh(true);
    
    try {
      // Calculate date range from current filters
      const { from, to } = getDateRangeFromPreset(
        filters.dateRangePreset,
        filters.dateFrom,
        filters.dateTo
      );
      
      // Show toast for loading
      const loadingToast = toast.loading("Loading data...");
      
      // Fetch with cache support
      const data = await fetchProductSalesData(from, to, {
        onCacheData: (cachedData) => {
          // Immediately show cached data
          setRawData(cachedData);
          setLoadedOnce(true);
          setLoading(false);
          toast.success("Showing cached data, updating...", { id: loadingToast });
        },
      });
      
      // Update with fresh data
      setRawData(data);
      setLoadedOnce(true);
      toast.success("Data loaded successfully", { id: loadingToast });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load product sales data");
    } finally {
      setLoading(false);
      setIsLoadingFresh(false);
    }
  }

  // Apply filters to raw data
  React.useEffect(() => {
    if (!rawData.length) {
      setFilteredData([]);
      return;
    }

    // Calculate actual date range from preset
    const { from, to } = getDateRangeFromPreset(
      filters.dateRangePreset,
      filters.dateFrom,
      filters.dateTo
    );

    const filtered = rawData.filter((record) => {
      const recordDate = new Date(record.date);
      const fromDate = new Date(from);
      const toDate = new Date(to);

      if (recordDate < fromDate || recordDate > toDate) return false;
      if (filters.suppliers.length && !filters.suppliers.includes(record.supplier)) return false;
      if (filters.products.length && !filters.products.includes(record.productName)) return false;
      if (filters.cities.length && !filters.cities.includes(record.city)) return false;
      if (filters.provinces.length && !filters.provinces.includes(record.province)) return false;

      return true;
    });

    setFilteredData(filtered);
  }, [rawData, filters]);

  // Compute KPIs
  const kpis = React.useMemo((): ProductPerformanceKpis => {
    if (!filteredData.length) {
      return {
        totalRevenue: 0,
        totalTransactions: 0,
        avgTransactionValue: 0,
        topProduct: "N/A",
        topSupplier: "N/A",
      };
    }

    const totalRevenue = filteredData.reduce((sum, r) => sum + r.amount, 0);
    const totalTransactions = filteredData.length;
    const avgTransactionValue = totalRevenue / totalTransactions;

    const productRevenue = new Map<string, number>();
    const supplierRevenue = new Map<string, number>();

    filteredData.forEach((r) => {
      productRevenue.set(r.productName, (productRevenue.get(r.productName) || 0) + r.amount);
      supplierRevenue.set(r.supplier, (supplierRevenue.get(r.supplier) || 0) + r.amount);
    });

    const topProduct = Array.from(productRevenue.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
    
    const topSupplier = Array.from(supplierRevenue.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    return {
      totalRevenue,
      totalTransactions,
      avgTransactionValue,
      topProduct,
      topSupplier,
    };
  }, [filteredData]);

  // Revenue by Period (Monthly)
  const revenueByPeriod = React.useMemo((): RevenueByPeriod[] => {
    const periodMap = new Map<string, number>();

    filteredData.forEach((r) => {
      const date = new Date(r.date);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      periodMap.set(period, (periodMap.get(period) || 0) + r.amount);
    });

    return Array.from(periodMap.entries())
      .map(([period, revenue]) => ({ period, revenue }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [filteredData]);

  // Top Products
  const topProducts = React.useMemo((): TopItem[] => {
    const productMap = new Map<string, { revenue: number; count: number }>();

    filteredData.forEach((r) => {
      const existing = productMap.get(r.productName) || { revenue: 0, count: 0 };
      productMap.set(r.productName, {
        revenue: existing.revenue + r.amount,
        count: existing.count + 1,
      });
    });

    return Array.from(productMap.entries())
      .map(([name, data]) => ({ name, revenue: data.revenue, count: data.count }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredData]);

  // Top Suppliers
  const topSuppliers = React.useMemo((): TopItem[] => {
    const supplierMap = new Map<string, { revenue: number; count: number }>();

    filteredData.forEach((r) => {
      const existing = supplierMap.get(r.supplier) || { revenue: 0, count: 0 };
      supplierMap.set(r.supplier, {
        revenue: existing.revenue + r.amount,
        count: existing.count + 1,
      });
    });

    return Array.from(supplierMap.entries())
      .map(([name, data]) => ({ name, revenue: data.revenue, count: data.count }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredData]);

  // Location Revenue
  const locationRevenue = React.useMemo((): LocationRevenue[] => {
    const cityMap = new Map<string, { revenue: number; transactions: number }>();

    filteredData.forEach((r) => {
      const location = `${r.city}, ${r.province}`;
      const existing = cityMap.get(location) || { revenue: 0, transactions: 0 };
      cityMap.set(location, {
        revenue: existing.revenue + r.amount,
        transactions: existing.transactions + 1,
      });
    });

    return Array.from(cityMap.entries())
      .map(([location, data]) => ({
        location,
        revenue: data.revenue,
        transactions: data.transactions,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredData]);

  // Product Trends (top 5 products over time)
  const productTrends = React.useMemo((): ProductTrend[] => {
    const top5Products = topProducts.slice(0, 5).map((p) => p.name);

    return top5Products.map((productName) => {
      const productData = filteredData.filter((r) => r.productName === productName);
      const dateMap = new Map<string, number>();

      productData.forEach((r) => {
        const date = r.date.split("T")[0];
        dateMap.set(date, (dateMap.get(date) || 0) + r.amount);
      });

      const data = Array.from(dateMap.entries())
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return { productName, data };
    });
  }, [filteredData, topProducts]);

  // Supplier Performance
  const supplierPerformance = React.useMemo((): SupplierPerformance[] => {
    const supplierMap = new Map<string, Map<string, number>>();

    filteredData.forEach((r) => {
      if (!supplierMap.has(r.supplier)) {
        supplierMap.set(r.supplier, new Map());
      }
      const productMap = supplierMap.get(r.supplier)!;
      productMap.set(r.productName, (productMap.get(r.productName) || 0) + r.amount);
    });

    return Array.from(supplierMap.entries())
      .map(([supplier, productMap]) => {
        const revenue = Array.from(productMap.values()).reduce((sum, r) => sum + r, 0);
        const products = Array.from(productMap.entries())
          .map(([name, rev]) => ({ name, revenue: rev, count: 0 }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        return { supplier, revenue, products };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredData]);

  // Get unique values for filters
  const uniqueSuppliers = React.useMemo(() => 
    Array.from(new Set(rawData.map((r) => r.supplier))).sort(),
    [rawData]
  );

  const uniqueProducts = React.useMemo(() =>
    Array.from(new Set(rawData.map((r) => r.productName))).sort(),
    [rawData]
  );

  const uniqueCities = React.useMemo(() =>
    Array.from(new Set(rawData.map((r) => r.city))).sort(),
    [rawData]
  );

  const uniqueProvinces = React.useMemo(() =>
    Array.from(new Set(rawData.map((r) => r.province))).sort(),
    [rawData]
  );

  return {
    loading,
    loadedOnce,
    isLoadingFresh,
    loadData,
    rawData,
    filteredData,
    filters,
    setFilters,
    kpis,
    revenueByPeriod,
    topProducts,
    topSuppliers,
    locationRevenue,
    productTrends,
    supplierPerformance,
    uniqueSuppliers,
    uniqueProducts,
    uniqueCities,
    uniqueProvinces,
  };
}
