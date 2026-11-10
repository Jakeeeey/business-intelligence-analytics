import { useState, useEffect, useMemo, useCallback } from "react";
import {
  IntercompanyDashboardData,
  DashboardFilters,
  CompanyMatrixRow,
  ActionCenterItem,
  ActionCategory,
  WorkforceMetrics,
  AttendanceMetrics,
  PunctualityMetrics,
  OvertimeMetrics,
  ManpowerMetrics,
  EvaluationMetrics,
  ConcernsMetrics,
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

  const loadData = useCallback(
    async (force = false, overrideFilters?: Partial<DashboardFilters>) => {
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
        const res = await fetchIntercompanyDashboardData(force, activeFilters);
        setData(res);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load dashboard data";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [filters.company, filters.dateRange, filters.startDate, filters.endDate]
  );

  // Trigger re-fetch when dateRange, company, or custom date range changes
  useEffect(() => {
    loadData(false);
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

  // Dynamic KPI Rollup: Adjusts top cards dynamically if single company or search is selected
  const effectiveData = useMemo<IntercompanyDashboardData | null>(() => {
    if (!data) return null;

    // If no search query, return server aggregated metrics directly (server handles entity & dateRange filters)
    if (!filters.search || !filters.search.trim()) {
      return data;
    }

    // If filtered by company or search, recompute metrics based on the visible matrix rows
    const visibleRows = filteredCompanyMatrix;
    const activeHeadcountSum = visibleRows.reduce((acc, r) => acc + r.headcount, 0);
    const activeRows = visibleRows.filter((r) => r.status === "ACTIVE" && r.headcount > 0);

    const avgAttendance =
      activeRows.length > 0
        ? Number(
            (
              activeRows.reduce((acc, r) => acc + r.attendanceRate, 0) / activeRows.length
            ).toFixed(1)
          )
        : 0;

    const avgPunctuality =
      activeRows.length > 0
        ? Number(
            (
              activeRows.reduce((acc, r) => acc + r.punctualityRate, 0) / activeRows.length
            ).toFixed(1)
          )
        : 0;

    const totalOtHours = visibleRows.reduce((acc, r) => acc + r.overtimeHours, 0);
    const totalOpenReqs = visibleRows.reduce((acc, r) => acc + r.openRequisitions, 0);
    const totalConcerns = visibleRows.reduce((acc, r) => acc + r.unresolvedConcerns, 0);

    const rowsWithScore = visibleRows.filter((r) => r.avgAppraisalScore > 0);
    const avgScore =
      rowsWithScore.length > 0
        ? Number(
            (
              rowsWithScore.reduce((acc, r) => acc + r.avgAppraisalScore, 0) /
              rowsWithScore.length
            ).toFixed(1)
          )
        : 0;

    const dynamicWorkforce: WorkforceMetrics = {
      ...data.workforce,
      totalEmployees: activeHeadcountSum,
      activeEmployees: activeHeadcountSum,
      regularCount: activeHeadcountSum,
      activeRatio: 100,
    };

    const dynamicAttendance: AttendanceMetrics = {
      totalLogs: data.attendance.totalLogs,
      presentCount: Math.round((data.attendance.totalLogs * avgAttendance) / 100),
      absentCount: Math.max(
        0,
        data.attendance.totalLogs - Math.round((data.attendance.totalLogs * avgAttendance) / 100)
      ),
      attendanceRate: avgAttendance,
    };

    const dynamicPunctuality: PunctualityMetrics = {
      ...data.punctuality,
      punctualityRate: avgPunctuality,
    };

    const dynamicOvertime: OvertimeMetrics = {
      ...data.overtime,
      approvedHours: Math.round(totalOtHours),
      totalHours: Math.round(totalOtHours),
    };

    const dynamicManpower: ManpowerMetrics = {
      ...data.manpower,
      openPositions: totalOpenReqs,
    };

    const dynamicConcerns: ConcernsMetrics = {
      ...data.concerns,
      pendingCount: totalConcerns,
    };

    const dynamicEvaluation: EvaluationMetrics = {
      ...data.evaluation,
      avgScore,
      totalEvaluations: rowsWithScore.length,
    };

    return {
      ...data,
      workforce: dynamicWorkforce,
      attendance: dynamicAttendance,
      punctuality: dynamicPunctuality,
      overtime: dynamicOvertime,
      manpower: dynamicManpower,
      evaluation: dynamicEvaluation,
      concerns: dynamicConcerns,
      companyMatrix: visibleRows,
    };
  }, [data, filters.search, filteredCompanyMatrix]);

  return {
    data: effectiveData,
    rawData: data,
    loading,
    error,
    refresh: (force = true) => loadData(force),
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
