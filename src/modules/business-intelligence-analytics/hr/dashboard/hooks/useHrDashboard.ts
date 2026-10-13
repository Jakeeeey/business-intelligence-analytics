import { useState, useEffect, useCallback, useMemo } from "react";
import {
  HrDashboardData,
  HrDashboardFilters,
  SortField,
  SortOrder,
} from "../types";
import { fetchHrDashboardData } from "../providers/fetchProvider";

export function useHrDashboard() {
  const [filters, setFilters] = useState<HrDashboardFilters>({
    department: "ALL",
    status: "ALL",
    gender: "ALL",
    search: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<HrDashboardData | null>(
    null
  );

  // Table sorting
  const [sortField, setSortField] = useState<SortField>("employeeId");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHrDashboardData(filters);
      setDashboardData(data);
      setPage(1);
    } catch (err: unknown) {
      console.error("[useHrDashboard] error:", err);
      const msg =
        err instanceof Error ? err.message : "Failed to load HR Dashboard data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetFilters = useCallback(() => {
    setFilters({
      department: "ALL",
      status: "ALL",
      gender: "ALL",
      search: "",
    });
  }, []);

  // Filtered employees based on search, status, and gender
  const filteredEmployees = useMemo(() => {
    if (!dashboardData) return [];
    let list = dashboardData.employees;

    if (filters.status && filters.status !== "ALL") {
      list = list.filter((item) => item.employmentStatus === filters.status);
    }

    if (filters.gender && filters.gender !== "ALL") {
      list = list.filter((item) => item.gender === filters.gender);
    }

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.employeeId.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.department.toLowerCase().includes(q) ||
          item.position.toLowerCase().includes(q) ||
          item.city.toLowerCase().includes(q) ||
          item.province.toLowerCase().includes(q)
      );
    }

    return list;
  }, [dashboardData, filters.status, filters.gender, filters.search]);

  // Sorted employees
  const sortedEmployees = useMemo(() => {
    const list = [...filteredEmployees];
    list.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "employeeId":
          comparison = a.employeeId.localeCompare(b.employeeId);
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "department":
          comparison = a.department.localeCompare(b.department);
          break;
        case "position":
          comparison = a.position.localeCompare(b.position);
          break;
        case "employmentStatus":
          comparison = a.employmentStatus.localeCompare(b.employmentStatus);
          break;
        case "dateOfHire": {
          const tA = a.dateOfHire || "";
          const tB = b.dateOfHire || "";
          comparison = tA.localeCompare(tB);
          break;
        }
        case "tenureYears":
          comparison = a.tenureYears - b.tenureYears;
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
    return list;
  }, [filteredEmployees, sortField, sortOrder]);

  // Paginated employees
  const paginatedEmployees = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedEmployees.slice(start, start + pageSize);
  }, [sortedEmployees, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(sortedEmployees.length / pageSize));

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return {
    filters,
    setFilters,
    loading,
    error,
    dashboardData,
    filteredEmployees,
    sortedEmployees,
    paginatedEmployees,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    sortField,
    sortOrder,
    handleSort,
    loadData,
    resetFilters,
  };
}
