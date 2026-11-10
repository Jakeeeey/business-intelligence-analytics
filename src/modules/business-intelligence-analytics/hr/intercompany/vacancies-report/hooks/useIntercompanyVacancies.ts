import { useState, useEffect, useMemo, useCallback } from "react";
import {
  IntercompanyVacanciesData,
  IntercompanyVacancyRecord,
  IntercompanyVacanciesKpis,
  VacanciesFilters,
} from "../types";
import { fetchIntercompanyVacanciesData } from "../providers/fetchProvider";
import { exportVacanciesToCsv } from "../utils/exportCsv";

export type VacancySortField =
  | "requestNo"
  | "companyName"
  | "position"
  | "department"
  | "totalNeeded"
  | "hiredCount"
  | "openVacancies"
  | "urgency"
  | "agingDays"
  | "rate"
  | "createdAt";

export type SortOrder = "asc" | "desc";

const INITIAL_FILTERS: VacanciesFilters = {
  company: "ALL",
  department: "ALL",
  purpose: "ALL",
  employmentType: "ALL",
  urgency: "ALL",
  dateRange: "all",
  startDate: "",
  endDate: "",
  search: "",
};

export function useIntercompanyVacancies() {
  const [data, setData] = useState<IntercompanyVacanciesData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<VacanciesFilters>(INITIAL_FILTERS);

  // Sorting & pagination
  const [sortField, setSortField] = useState<VacancySortField>("openVacancies");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const loadData = useCallback(
    async (force = false, overrideFilters?: Partial<VacanciesFilters>) => {
      try {
        setLoading(true);
        setError(null);
        const activeFilters = {
          company: filters.company,
          dateRange: filters.dateRange,
          startDate: filters.startDate,
          endDate: filters.endDate,
          ...overrideFilters,
        };
        const res = await fetchIntercompanyVacanciesData(force, activeFilters);
        setData(res);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to load vacancies report data";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [filters.company, filters.dateRange, filters.startDate, filters.endDate]
  );

  // Re-fetch when company or date bounds change
  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  }, []);

  const handleSort = useCallback(
    (field: VacancySortField) => {
      if (sortField === field) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortOrder("desc");
      }
      setPage(1);
    },
    [sortField]
  );

  // Filtered vacancies
  const filteredVacancies = useMemo<IntercompanyVacancyRecord[]>(() => {
    if (!data?.vacancies) return [];
    let list = [...data.vacancies];

    // Company filter (if client-side matching needed)
    if (filters.company !== "ALL") {
      list = list.filter(
        (v) =>
          v.companyCode.toUpperCase() === filters.company.toUpperCase() ||
          String(v.companyId) === filters.company
      );
    }

    // Department filter
    if (filters.department !== "ALL") {
      list = list.filter((v) => v.department === filters.department);
    }

    // Purpose filter
    if (filters.purpose !== "ALL") {
      list = list.filter((v) => v.purpose === filters.purpose);
    }

    // Employment type filter
    if (filters.employmentType !== "ALL") {
      list = list.filter((v) => v.employmentType === filters.employmentType);
    }

    // Urgency filter
    if (filters.urgency !== "ALL") {
      list = list.filter((v) => v.urgency === filters.urgency);
    }

    // Text search query
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (v) =>
          v.position.toLowerCase().includes(q) ||
          v.requestNo.toLowerCase().includes(q) ||
          v.companyName.toLowerCase().includes(q) ||
          v.companyCode.toLowerCase().includes(q) ||
          v.department.toLowerCase().includes(q) ||
          (v.replacementName && v.replacementName.toLowerCase().includes(q)) ||
          (v.reasonJustification && v.reasonJustification.toLowerCase().includes(q)) ||
          (v.qualification && v.qualification.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (typeof valA === "string" && typeof valB === "string") {
        return sortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      if (typeof valA === "number" && typeof valB === "number") {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
      return 0;
    });

    return list;
  }, [data?.vacancies, filters, sortField, sortOrder]);

  // Recalculated dynamic KPIs
  const dynamicKpis = useMemo<IntercompanyVacanciesKpis>(() => {
    if (!data?.kpis) {
      return {
        totalOpenVacancies: 0,
        totalRequisitions: 0,
        replacementRoles: 0,
        newPositionRoles: 0,
        avgAgingDays: 0,
        totalAllocatedBudget: 0,
        criticalRolesCount: 0,
      };
    }

    // If no client filters applied, return server KPIs
    if (
      filters.department === "ALL" &&
      filters.purpose === "ALL" &&
      filters.employmentType === "ALL" &&
      filters.urgency === "ALL" &&
      !filters.search
    ) {
      return data.kpis;
    }

    const totalOpen = filteredVacancies.reduce((acc, v) => acc + v.openVacancies, 0);
    const replacements = filteredVacancies
      .filter((v) => v.purpose.toLowerCase() === "replacement")
      .reduce((acc, v) => acc + v.openVacancies, 0);
    const newPositions = filteredVacancies
      .filter((v) => v.purpose.toLowerCase() === "new position")
      .reduce((acc, v) => acc + v.openVacancies, 0);
    const critical = filteredVacancies
      .filter((v) => v.urgency === "Critical")
      .reduce((acc, v) => acc + v.openVacancies, 0);
    const totalAging = filteredVacancies.reduce((acc, v) => acc + v.agingDays, 0);
    const totalBudget = filteredVacancies.reduce((acc, v) => acc + v.totalAllocatedBudget, 0);

    return {
      totalOpenVacancies: totalOpen,
      totalRequisitions: filteredVacancies.length,
      replacementRoles: replacements,
      newPositionRoles: newPositions,
      avgAgingDays:
        filteredVacancies.length > 0 ? Math.round(totalAging / filteredVacancies.length) : 0,
      totalAllocatedBudget: totalBudget,
      criticalRolesCount: critical,
    };
  }, [data?.kpis, filteredVacancies, filters]);

  // Pagination
  const totalItems = filteredVacancies.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedVacancies = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredVacancies.slice(start, start + pageSize);
  }, [filteredVacancies, page, pageSize]);

  const handleExport = useCallback(() => {
    exportVacanciesToCsv(
      filteredVacancies,
      `intercompany_vacancies_${filters.company}_${filters.dateRange}.csv`
    );
  }, [filteredVacancies, filters.company, filters.dateRange]);

  return {
    data,
    loading,
    error,
    filters,
    setFilters,
    resetFilters,
    sortField,
    sortOrder,
    handleSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    filteredVacancies,
    paginatedVacancies,
    dynamicKpis,
    handleExport,
    loadData,
  };
}

