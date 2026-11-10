import { useState, useEffect, useMemo, useCallback } from "react";
import {
  IntercompanyEvaluationData,
  IntercompanyEvaluationKpis,
  EvaluationFilters,
} from "../types";
import { fetchIntercompanyEvaluationData } from "../providers/fetchProvider";
import { exportEvaluationsToCsv } from "../utils/exportCsv";

export type SortField =
  | "evaluationDate"
  | "totalScore"
  | "name"
  | "companyName"
  | "department"
  | "evalType"
  | "result";

export type SortOrder = "asc" | "desc";

export function useIntercompanyEvaluations() {
  const [data, setData] = useState<IntercompanyEvaluationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [filters, setFilters] = useState<EvaluationFilters>({
    company: "ALL",
    department: "ALL",
    evalType: "ALL",
    ratingBand: "ALL",
    result: "ALL",
    startDate: "",
    endDate: "",
    search: "",
  });

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("evaluationDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Load data
  const loadData = useCallback(async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchIntercompanyEvaluationData(force);
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load evaluation data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side filtering
  const filteredRecords = useMemo(() => {
    if (!data) return [];
    return data.records.filter((rec) => {
      // Company filter
      if (filters.company !== "ALL") {
        if (rec.companyCode !== filters.company && String(rec.companyId) !== filters.company) {
          return false;
        }
      }

      // Department filter
      if (filters.department !== "ALL" && rec.department !== filters.department) {
        return false;
      }

      // Eval Type filter
      if (filters.evalType !== "ALL" && rec.evalType !== filters.evalType) {
        return false;
      }

      // Rating Band filter
      if (filters.ratingBand !== "ALL" && rec.ratingBand !== filters.ratingBand) {
        return false;
      }

      // Result filter
      if (filters.result !== "ALL" && rec.result !== filters.result) {
        return false;
      }

      // Date range filter
      if (filters.startDate) {
        const evalDate = rec.evaluationDate.slice(0, 10);
        if (evalDate < filters.startDate) return false;
      }
      if (filters.endDate) {
        const evalDate = rec.evaluationDate.slice(0, 10);
        if (evalDate > filters.endDate) return false;
      }

      // Search term
      if (filters.search.trim()) {
        const term = filters.search.toLowerCase();
        const matchesName = rec.name.toLowerCase().includes(term);
        const matchesPosition = rec.position.toLowerCase().includes(term);
        const matchesDept = rec.department.toLowerCase().includes(term);
        const matchesCompany = rec.companyName.toLowerCase().includes(term) || rec.companyCode.toLowerCase().includes(term);
        const matchesEvaluator = rec.evaluatorName ? rec.evaluatorName.toLowerCase().includes(term) : false;
        const matchesComments = rec.evaluatorComments ? rec.evaluatorComments.toLowerCase().includes(term) : false;
        if (!matchesName && !matchesPosition && !matchesDept && !matchesCompany && !matchesEvaluator && !matchesComments) {
          return false;
        }
      }

      return true;
    });
  }, [data, filters]);

  // Client-side sorting
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

      switch (sortField) {
        case "evaluationDate":
          valA = new Date(a.evaluationDate).getTime() || 0;
          valB = new Date(b.evaluationDate).getTime() || 0;
          break;
        case "totalScore":
          valA = a.totalScore;
          valB = b.totalScore;
          break;
        case "name":
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case "companyName":
          valA = a.companyName.toLowerCase();
          valB = b.companyName.toLowerCase();
          break;
        case "department":
          valA = a.department.toLowerCase();
          valB = b.department.toLowerCase();
          break;
        case "evalType":
          valA = a.evalType.toLowerCase();
          valB = b.evalType.toLowerCase();
          break;
        case "result":
          valA = a.result.toLowerCase();
          valB = b.result.toLowerCase();
          break;
        default:
          valA = a.evaluationId;
          valB = b.evaluationId;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRecords, sortField, sortOrder]);

  // Pagination calculation
  const totalItems = sortedRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, page, pageSize]);

  // Dynamic KPIs recalculation based on filtered records
  const dynamicKpis = useMemo<IntercompanyEvaluationKpis>(() => {
    if (!data) {
      return {
        totalEvaluations: 0,
        passedCount: 0,
        failedCount: 0,
        regularizedCount: 0,
        avgTotalScore: 0,
        overallPassRate: 0,
        regularizationRate: 0,
        activeCompaniesCount: 0,
        totalCompaniesCount: 0,
        companiesWithEvaluationsCount: 0,
        topPerformingCompany: "None",
        topPerformingDepartment: "None",
        predominantRatingBand: "None",
      };
    }

    const count = filteredRecords.length;
    const passed = filteredRecords.filter((r) => r.result === "PASSED").length;
    const failed = filteredRecords.filter((r) => r.result === "FAILED").length;
    const regularized = filteredRecords.filter((r) => r.result === "REGULARIZED").length;
    const passRate = count > 0 ? Math.round(((passed + regularized) / count) * 100) : 100;
    const regRate = count > 0 ? Math.round((regularized / count) * 100) : 0;

    const sumScore = filteredRecords.reduce((acc, r) => acc + r.totalScore, 0);
    const avgScore = count > 0 ? Number((sumScore / count).toFixed(1)) : 85;

    const companiesWithData = new Set(filteredRecords.map((r) => r.companyCode)).size;

    // Predominant band
    const bandCounts = new Map<string, number>();
    filteredRecords.forEach((r) => {
      bandCounts.set(r.ratingBand, (bandCounts.get(r.ratingBand) || 0) + 1);
    });
    let topBand = "None";
    let maxBand = 0;
    bandCounts.forEach((c, b) => {
      if (c > maxBand) {
        maxBand = c;
        topBand = b;
      }
    });

    // Top dept
    const deptScores = new Map<string, { sum: number; count: number }>();
    filteredRecords.forEach((r) => {
      const curr = deptScores.get(r.department) || { sum: 0, count: 0 };
      curr.sum += r.totalScore;
      curr.count++;
      deptScores.set(r.department, curr);
    });
    let topDept = "None";
    let maxDeptAvg = 0;
    deptScores.forEach((stat, d) => {
      const avg = stat.sum / stat.count;
      if (avg > maxDeptAvg) {
        maxDeptAvg = avg;
        topDept = d;
      }
    });

    return {
      totalEvaluations: count,
      passedCount: passed,
      failedCount: failed,
      regularizedCount: regularized,
      avgTotalScore: avgScore,
      overallPassRate: passRate,
      regularizationRate: regRate,
      activeCompaniesCount: data.kpis.activeCompaniesCount,
      totalCompaniesCount: data.kpis.totalCompaniesCount,
      companiesWithEvaluationsCount: companiesWithData,
      topPerformingCompany: data.kpis.topPerformingCompany,
      topPerformingDepartment: topDept !== "None" ? topDept : data.kpis.topPerformingDepartment,
      predominantRatingBand: topBand !== "None" ? topBand : data.kpis.predominantRatingBand,
    };
  }, [data, filteredRecords]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const resetFilters = () => {
    setFilters({
      company: "ALL",
      department: "ALL",
      evalType: "ALL",
      ratingBand: "ALL",
      result: "ALL",
      startDate: "",
      endDate: "",
      search: "",
    });
    setPage(1);
  };

  const handleExport = () => {
    exportEvaluationsToCsv(
      filteredRecords,
      `evaluation_report_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  return {
    data,
    loading,
    error,
    filters,
    setFilters,
    filteredRecords,
    sortedRecords,
    paginatedRecords,
    dynamicKpis,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    sortField,
    sortOrder,
    handleSort,
    resetFilters,
    handleExport,
    loadData,
  };
}

