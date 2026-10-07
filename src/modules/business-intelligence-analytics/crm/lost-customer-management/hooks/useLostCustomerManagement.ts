import { useState, useEffect, useCallback, useMemo } from "react";
import {
  LostCustomerFilters,
  LostCustomerRecord,
  LostCustomerKpis,
  SortField,
  SortOrder,
  TaggingDistributionItem,
  InactivityRangeDistribution,
} from "../types";
import { fetchLostCustomerList } from "../providers/fetchProvider";

export function useLostCustomerManagement() {
  const [filters, setFilters] = useState<LostCustomerFilters>({
    customerCode: "",
    customerName: "",
    tagging: "ALL",
    minDaysNoSales: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<LostCustomerRecord[]>([]);

  // Sorting
  const [sortField, setSortField] = useState<SortField>("minDaysNoSales");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected customer for modal
  const [selectedCustomer, setSelectedCustomer] =
    useState<LostCustomerRecord | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLostCustomerList(filters);
      setCustomers(data);
      setPage(1);
    } catch (err: unknown) {
      console.error("[useLostCustomerManagement] loadData error:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to load lost customer records";
      setError(msg);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetFilters = useCallback(() => {
    setFilters({
      customerCode: "",
      customerName: "",
      tagging: "ALL",
      minDaysNoSales: "",
    });
    setSearchQuery("");
  }, []);

  // Distinct tags
  const uniqueTaggings = useMemo(() => {
    const tags = new Set<string>();
    customers.forEach((c) => {
      if (c.tagging && c.tagging.trim()) {
        tags.add(c.tagging.trim());
      }
    });
    return Array.from(tags).sort();
  }, [customers]);

  // Client-side quick filter
  const filteredCustomers = useMemo(() => {
    let result = customers;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.customerCode.toLowerCase().includes(q) ||
          c.customerName.toLowerCase().includes(q) ||
          c.tagging.toLowerCase().includes(q) ||
          (c.salesmanName && c.salesmanName.toLowerCase().includes(q)) ||
          (c.branchName && c.branchName.toLowerCase().includes(q))
      );
    }

    return result;
  }, [customers, searchQuery]);

  // Sorting
  const sortedCustomers = useMemo(() => {
    const sorted = [...filteredCustomers];
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "customerCode":
          comparison = a.customerCode.localeCompare(b.customerCode);
          break;
        case "customerName":
          comparison = a.customerName.localeCompare(b.customerName);
          break;
        case "tagging":
          comparison = a.tagging.localeCompare(b.tagging);
          break;
        case "minDaysNoSales":
          comparison = a.minDaysNoSales - b.minDaysNoSales;
          break;
        case "lastSalesDate": {
          const dateA = a.lastSalesDate ? new Date(a.lastSalesDate).getTime() : 0;
          const dateB = b.lastSalesDate ? new Date(b.lastSalesDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
        }
        case "totalHistoricalSales":
          comparison = a.totalHistoricalSales - b.totalHistoricalSales;
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [filteredCustomers, sortField, sortOrder]);

  // Pagination
  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedCustomers.slice(start, start + pageSize);
  }, [sortedCustomers, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(sortedCustomers.length / pageSize));

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // KPIs
  const kpis: LostCustomerKpis = useMemo(() => {
    const totalCustomers = customers.length;
    let totalValueAtRisk = 0;
    let totalDays = 0;
    let atRiskCount = 0;
    let dormantCount = 0;
    let lostCount = 0;

    customers.forEach((c) => {
      totalValueAtRisk += c.totalHistoricalSales;
      totalDays += c.minDaysNoSales;

      const tagLower = c.tagging.toLowerCase();
      if (tagLower.includes("risk") || (c.minDaysNoSales >= 30 && c.minDaysNoSales <= 60)) {
        atRiskCount++;
      } else if (tagLower.includes("dormant") || (c.minDaysNoSales > 60 && c.minDaysNoSales <= 120)) {
        dormantCount++;
      } else if (tagLower.includes("lost") || c.minDaysNoSales > 120) {
        lostCount++;
      } else {
        atRiskCount++;
      }
    });

    const avgDaysInactive =
      totalCustomers > 0 ? Math.round(totalDays / totalCustomers) : 0;

    return {
      totalCustomers,
      atRiskCount,
      dormantCount,
      lostCount,
      avgDaysInactive,
      totalValueAtRisk,
    };
  }, [customers]);

  // Tagging Distribution
  const taggingDistribution: TaggingDistributionItem[] = useMemo(() => {
    const map = new Map<string, { count: number; totalSales: number }>();
    customers.forEach((c) => {
      const tag = c.tagging || "Unassigned";
      const existing = map.get(tag) || { count: 0, totalSales: 0 };
      map.set(tag, {
        count: existing.count + 1,
        totalSales: existing.totalSales + c.totalHistoricalSales,
      });
    });

    return Array.from(map.entries())
      .map(([tag, data]) => ({
        tag,
        count: data.count,
        totalSales: data.totalSales,
      }))
      .sort((a, b) => b.count - a.count);
  }, [customers]);

  // Inactivity Range Distribution
  const inactivityDistribution: InactivityRangeDistribution[] = useMemo(() => {
    const brackets = [
      { range: "30-60 Days", min: 30, max: 60, count: 0, totalSales: 0 },
      { range: "61-90 Days", min: 61, max: 90, count: 0, totalSales: 0 },
      { range: "91-180 Days", min: 91, max: 180, count: 0, totalSales: 0 },
      { range: "181-365 Days", min: 181, max: 365, count: 0, totalSales: 0 },
      { range: "> 365 Days", min: 366, max: Infinity, count: 0, totalSales: 0 },
    ];

    customers.forEach((c) => {
      const days = c.minDaysNoSales;
      const bracket =
        brackets.find((b) => days >= b.min && days <= b.max) ||
        brackets[brackets.length - 1];
      bracket.count++;
      bracket.totalSales += c.totalHistoricalSales;
    });

    return brackets.map(({ range, count, totalSales }) => ({
      range,
      count,
      totalSales,
    }));
  }, [customers]);

  // Top accounts at risk
  const topAtRiskCustomers = useMemo(() => {
    return [...customers]
      .sort((a, b) => b.totalHistoricalSales - a.totalHistoricalSales)
      .slice(0, 5);
  }, [customers]);

  return {
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    customers,
    filteredCustomers,
    sortedCustomers,
    paginatedCustomers,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    sortField,
    sortOrder,
    handleSort,
    selectedCustomer,
    setSelectedCustomer,
    uniqueTaggings,
    kpis,
    taggingDistribution,
    inactivityDistribution,
    topAtRiskCustomers,
    loadData,
    resetFilters,
  };
}
