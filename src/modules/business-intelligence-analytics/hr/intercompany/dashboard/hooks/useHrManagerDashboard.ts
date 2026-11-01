import { useState, useEffect, useMemo, useCallback } from "react";
import {
  IntercompanyDashboardData,
  DashboardFilters,
  CompanyMatrixRow,
  ActionCenterItem,
  ActionCategory,
} from "../types";
import { fetchIntercompanyDashboardData } from "../providers/fetchProvider";

export type MatrixSortField =
  | "companyName"
  | "headcount"
  | "attendanceRate"
  | "punctualityRate"
  | "overtimeHours"
  | "turnoverRate"
  | "openRequisitions"
  | "avgAppraisalScore"
  | "unresolvedConcerns"
  | "healthIndex";

export type SortOrder = "asc" | "desc";

export function useHrManagerDashboard() {
  const [data, setData] = useState<IntercompanyDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState<DashboardFilters>({
    company: "ALL",
    dateRange: "all",
    startDate: "",
    endDate: "",
    search: "",
  });

  // Action Center active category tab
  const [actionCategoryTab, setActionCategoryTab] = useState<"ALL" | ActionCategory>("ALL");

  // Matrix sorting
  const [matrixSortField, setMatrixSortField] = useState<MatrixSortField>("headcount");
  const [matrixSortOrder, setMatrixSortOrder] = useState<SortOrder>("desc");

  const loadData = useCallback(async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchIntercompanyDashboardData(force);
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetFilters = useCallback(() => {
    setFilters({
      company: "ALL",
      dateRange: "all",
      startDate: "",
      endDate: "",
      search: "",
    });
  }, []);

  const handleMatrixSort = useCallback(
    (field: MatrixSortField) => {
      if (matrixSortField === field) {
        setMatrixSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setMatrixSortField(field);
        setMatrixSortOrder("desc");
      }
    },
    [matrixSortField]
  );

  // Filtered & sorted company matrix
  const filteredCompanyMatrix = useMemo<CompanyMatrixRow[]>(() => {
    if (!data?.companyMatrix) return [];
    let rows = [...data.companyMatrix];

    // Filter by company
    if (filters.company !== "ALL") {
      rows = rows.filter(
        (r) =>
          r.companyCode.toUpperCase() === filters.company.toUpperCase() ||
          String(r.companyId) === filters.company
      );
    }

    // Filter by search query
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      rows = rows.filter(
        (r) =>
          r.companyName.toLowerCase().includes(q) ||
          r.companyCode.toLowerCase().includes(q)
      );
    }

    // Sort
    rows.sort((a, b) => {
      const valA = a[matrixSortField];
      const valB = b[matrixSortField];

      if (typeof valA === "string" && typeof valB === "string") {
        return matrixSortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return matrixSortOrder === "asc" ? valA - valB : valB - valA;
      }

      return 0;
    });

    return rows;
  }, [data?.companyMatrix, filters.company, filters.search, matrixSortField, matrixSortOrder]);

  // Filtered action items
  const filteredActionItems = useMemo<ActionCenterItem[]>(() => {
    if (!data?.actionItems) return [];
    let items = [...data.actionItems];

    // Company filter
    if (filters.company !== "ALL") {
      items = items.filter(
        (i) => i.companyCode.toUpperCase() === filters.company.toUpperCase()
      );
    }

    // Category filter
    if (actionCategoryTab !== "ALL") {
      items = items.filter((i) => i.category === actionCategoryTab);
    }

    // Search filter
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.subtitle.toLowerCase().includes(q) ||
          i.companyName.toLowerCase().includes(q)
      );
    }

    return items;
  }, [data?.actionItems, filters.company, actionCategoryTab, filters.search]);

  return {
    data,
    loading,
    error,
    refresh: loadData,
    filters,
    setFilters,
    resetFilters,
    actionCategoryTab,
    setActionCategoryTab,
    matrixSortField,
    matrixSortOrder,
    handleMatrixSort,
    filteredCompanyMatrix,
    filteredActionItems,
  };
}
