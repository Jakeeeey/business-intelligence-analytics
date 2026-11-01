"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  IntercompanyConcernsData,
  IntercompanyConcernsFilters,
  IntercompanyConcernRecord,
  IntercompanyConcernsKpis,
  CompanyConcernsSummary,
  DepartmentConcernsSummary,
  ConcernDistributionSegment,
  ConcernTrendPoint,
  ConcernsSortField,
  ConcernsSortOrder,
} from "../types";
import { fetchIntercompanyConcernsData } from "../providers/fetchProvider";

const DEFAULT_FILTERS: IntercompanyConcernsFilters = {
  companyIds: [],
  departments: [],
  status: "ALL",
  anonymousFilter: "ALL",
  category: "ALL",
  startDate: "",
  endDate: "",
  search: "",
};

export function useIntercompanyConcerns() {
  const [data, setData] = useState<IntercompanyConcernsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<IntercompanyConcernsFilters>(DEFAULT_FILTERS);
  const [sortField, setSortField] = useState<ConcernsSortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<ConcernsSortOrder>("desc");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const [selectedRecord, setSelectedRecord] = useState<IntercompanyConcernRecord | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);

  const loadData = useCallback(async (opts?: { force?: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchIntercompanyConcernsData({
        force: opts?.force,
      });
      setData(res);
    } catch (err: unknown) {
      console.error("[useIntercompanyConcerns Error]", err);
      const msg = err instanceof Error ? err.message : "Failed to load employee concerns";
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
    if (!data?.records) return [];

    return data.records.filter((rec) => {
      // 1. Company filter
      if (filters.companyIds && filters.companyIds.length > 0) {
        if (!filters.companyIds.includes(String(rec.companyId))) {
          return false;
        }
      }

      // 2. Department filter
      if (filters.departments && filters.departments.length > 0) {
        if (!filters.departments.includes(rec.department)) {
          return false;
        }
      }

      // 3. Status filter
      if (filters.status !== "ALL") {
        if (rec.status.toUpperCase() !== filters.status.toUpperCase()) {
          return false;
        }
      }

      // 4. Anonymous filter
      if (filters.anonymousFilter === "ANONYMOUS" && !rec.isAnonymous) {
        return false;
      }
      if (filters.anonymousFilter === "IDENTIFIED" && rec.isAnonymous) {
        return false;
      }

      // 5. Category filter
      if (filters.category !== "ALL") {
        if (rec.category !== filters.category) {
          return false;
        }
      }

      // 6. Date Range filter
      if (filters.startDate) {
        const itemDate = rec.createdAt.slice(0, 10);
        if (itemDate < filters.startDate) return false;
      }
      if (filters.endDate) {
        const itemDate = rec.createdAt.slice(0, 10);
        if (itemDate > filters.endDate) return false;
      }

      // 7. Search query
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const matchSubject = rec.subjectOfConcern.toLowerCase().includes(q);
        const matchBody = rec.concern.toLowerCase().includes(q);
        const matchName = rec.name.toLowerCase().includes(q);
        const matchEmpId = rec.employeeId.toLowerCase().includes(q);
        const matchCompany =
          rec.companyName.toLowerCase().includes(q) ||
          rec.companyCode.toLowerCase().includes(q);
        const matchDept = rec.department.toLowerCase().includes(q);
        const matchCategory = rec.category.toLowerCase().includes(q);
        const matchStatus = rec.status.toLowerCase().includes(q);

        if (
          !matchSubject &&
          !matchBody &&
          !matchName &&
          !matchEmpId &&
          !matchCompany &&
          !matchDept &&
          !matchCategory &&
          !matchStatus
        ) {
          return false;
        }
      }

      return true;
    });
  }, [data?.records, filters]);

  const hasActiveFilter = useMemo(() => {
    return (
      (filters.companyIds && filters.companyIds.length > 0) ||
      (filters.departments && filters.departments.length > 0) ||
      filters.status !== "ALL" ||
      filters.anonymousFilter !== "ALL" ||
      filters.category !== "ALL" ||
      Boolean(filters.startDate) ||
      Boolean(filters.endDate) ||
      Boolean(filters.search.trim())
    );
  }, [filters]);

  // Dynamic Filtered KPIs
  const filteredKpis = useMemo<IntercompanyConcernsKpis | null>(() => {
    if (!data?.kpis) return null;
    if (!hasActiveFilter) return data.kpis;

    let pendingCount = 0;
    let inReviewCount = 0;
    let resolvedCount = 0;
    let closedCount = 0;
    let anonymousCount = 0;
    const uniqueCos = new Set<number>();
    const compCountMap = new Map<string, number>();
    const deptCountMap = new Map<string, number>();

    filteredRecords.forEach((r) => {
      uniqueCos.add(r.companyId);
      compCountMap.set(r.companyName, (compCountMap.get(r.companyName) || 0) + 1);
      deptCountMap.set(r.department, (deptCountMap.get(r.department) || 0) + 1);

      if (r.isAnonymous) anonymousCount++;

      const st = r.status.toUpperCase();
      if (st === "PENDING") pendingCount++;
      else if (
        st === "IN_REVIEW" ||
        st === "UNDER_REVIEW" ||
        st === "IN PROGRESS" ||
        st === "INVESTIGATING"
      ) {
        inReviewCount++;
      } else if (st === "RESOLVED" || st === "COMPLETED") {
        resolvedCount++;
      } else if (st === "CLOSED" || st === "DISMISSED") {
        closedCount++;
      }
    });

    const total = filteredRecords.length;
    const resolutionRate =
      total > 0 ? Math.round(((resolvedCount + closedCount) / total) * 100) : 0;
    const anonymousPercentage =
      total > 0 ? Math.round((anonymousCount / total) * 100) : 0;

    let topCompany = "None";
    let maxCompCount = 0;
    compCountMap.forEach((cnt, cName) => {
      if (cnt > maxCompCount) {
        maxCompCount = cnt;
        topCompany = cName;
      }
    });

    let topDept = "None";
    let maxDeptCount = 0;
    deptCountMap.forEach((cnt, dName) => {
      if (cnt > maxDeptCount) {
        maxDeptCount = cnt;
        topDept = dName;
      }
    });

    return {
      totalConcerns: total,
      pendingCount,
      inReviewCount,
      resolvedCount,
      closedCount,
      anonymousCount,
      anonymousPercentage,
      resolutionRate,
      activeCompaniesCount: uniqueCos.size,
      totalCompaniesCount: data.kpis.totalCompaniesCount,
      companiesWithConcernsCount: compCountMap.size,
      topConcernCompany: topCompany,
      topConcernDepartment: topDept,
    };
  }, [data, hasActiveFilter, filteredRecords]);

  // Dynamic Filtered Company Summaries
  const filteredCompanySummaries = useMemo<CompanyConcernsSummary[]>(() => {
    if (!data?.companySummaries) return [];
    if (!hasActiveFilter) return data.companySummaries;

    const compMap = new Map<
      number,
      {
        companyName: string;
        companyCode: string;
        total: number;
        pending: number;
        inReview: number;
        resolved: number;
        closed: number;
        anonymous: number;
      }
    >();

    filteredRecords.forEach((r) => {
      const cur = compMap.get(r.companyId) || {
        companyName: r.companyName,
        companyCode: r.companyCode,
        total: 0,
        pending: 0,
        inReview: 0,
        resolved: 0,
        closed: 0,
        anonymous: 0,
      };

      cur.total++;
      if (r.isAnonymous) cur.anonymous++;

      const st = r.status.toUpperCase();
      if (st === "PENDING") cur.pending++;
      else if (
        st === "IN_REVIEW" ||
        st === "UNDER_REVIEW" ||
        st === "IN PROGRESS" ||
        st === "INVESTIGATING"
      ) {
        cur.inReview++;
      } else if (st === "RESOLVED" || st === "COMPLETED") {
        cur.resolved++;
      } else if (st === "CLOSED" || st === "DISMISSED") {
        cur.closed++;
      }

      compMap.set(r.companyId, cur);
    });

    const totalFiltered = filteredRecords.length;
    const result: CompanyConcernsSummary[] = [];

    compMap.forEach((c, cid) => {
      const resRate =
        c.total > 0 ? Math.round(((c.resolved + c.closed) / c.total) * 100) : 0;
      result.push({
        companyId: cid,
        companyName: c.companyName,
        companyCode: c.companyCode,
        status: "ACTIVE",
        totalConcerns: c.total,
        pendingCount: c.pending,
        inReviewCount: c.inReview,
        resolvedCount: c.resolved,
        closedCount: c.closed,
        anonymousCount: c.anonymous,
        resolutionRate: resRate,
        sharePercentage:
          totalFiltered > 0 ? Math.round((c.total / totalFiltered) * 100) : 0,
      });
    });

    return result.sort((a, b) => b.totalConcerns - a.totalConcerns);
  }, [data?.companySummaries, hasActiveFilter, filteredRecords]);

  // Dynamic Filtered Department Summaries
  const filteredDepartmentSummaries = useMemo<DepartmentConcernsSummary[]>(() => {
    if (!data?.departmentSummaries) return [];
    if (!hasActiveFilter) return data.departmentSummaries;

    const deptMap = new Map<
      string,
      { total: number; pending: number; resolved: number; cos: Set<number> }
    >();

    filteredRecords.forEach((r) => {
      const cur = deptMap.get(r.department) || {
        total: 0,
        pending: 0,
        resolved: 0,
        cos: new Set<number>(),
      };

      cur.total++;
      const st = r.status.toUpperCase();
      if (st === "PENDING") cur.pending++;
      if (st === "RESOLVED") cur.resolved++;
      cur.cos.add(r.companyId);

      deptMap.set(r.department, cur);
    });

    const totalFiltered = filteredRecords.length;
    const result: DepartmentConcernsSummary[] = [];

    deptMap.forEach((v, dept) => {
      result.push({
        department: dept,
        totalConcerns: v.total,
        pendingCount: v.pending,
        resolvedCount: v.resolved,
        companiesCount: v.cos.size,
        percentage: totalFiltered > 0 ? Math.round((v.total / totalFiltered) * 100) : 0,
      });
    });

    return result.sort((a, b) => b.totalConcerns - a.totalConcerns);
  }, [data?.departmentSummaries, hasActiveFilter, filteredRecords]);

  // Dynamic Filtered Status Distribution
  const filteredStatusDistribution = useMemo<ConcernDistributionSegment[]>(() => {
    if (!data?.statusDistribution) return [];
    if (!hasActiveFilter) return data.statusDistribution;

    const sMap = new Map<string, number>();
    filteredRecords.forEach((r) => {
      sMap.set(r.status, (sMap.get(r.status) || 0) + 1);
    });

    const total = filteredRecords.length;
    const statusColorMap: Record<string, string> = {
      PENDING: "#f59e0b",
      IN_REVIEW: "#3b82f6",
      UNDER_REVIEW: "#3b82f6",
      RESOLVED: "#10b981",
      CLOSED: "#6b7280",
      DISMISSED: "#ef4444",
    };

    return Array.from(sMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: statusColorMap[name] || "#8b5cf6",
      }))
      .sort((a, b) => b.count - a.count);
  }, [data?.statusDistribution, hasActiveFilter, filteredRecords]);

  // Dynamic Filtered Category Distribution
  const filteredCategoryDistribution = useMemo<ConcernDistributionSegment[]>(() => {
    if (!data?.categoryDistribution) return [];
    if (!hasActiveFilter) return data.categoryDistribution;

    const cMap = new Map<string, number>();
    filteredRecords.forEach((r) => {
      cMap.set(r.category, (cMap.get(r.category) || 0) + 1);
    });

    const total = filteredRecords.length;
    const categoryPalette = ["#06b6d4", "#f59e0b", "#8b5cf6", "#10b981", "#ec4899", "#3b82f6"];

    return Array.from(cMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], idx) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: categoryPalette[idx % categoryPalette.length],
      }));
  }, [data?.categoryDistribution, hasActiveFilter, filteredRecords]);

  // Dynamic Filtered Trends
  const filteredTrends = useMemo<ConcernTrendPoint[]>(() => {
    if (!data?.trends) return [];
    if (!hasActiveFilter) return data.trends;

    const tMap = new Map<string, { total: number; pending: number; resolved: number }>();
    filteredRecords.forEach((r) => {
      const dStr = r.createdAt.slice(0, 10);
      const cur = tMap.get(dStr) || { total: 0, pending: 0, resolved: 0 };
      cur.total++;
      if (r.status.toUpperCase() === "PENDING") cur.pending++;
      if (r.status.toUpperCase() === "RESOLVED") cur.resolved++;
      tMap.set(dStr, cur);
    });

    return Array.from(tMap.entries())
      .map(([dStr, v]) => ({
        date: dStr,
        displayDate: dStr.slice(5),
        totalCount: v.total,
        pendingCount: v.pending,
        resolvedCount: v.resolved,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data?.trends, hasActiveFilter, filteredRecords]);

  // Client-side sorting
  const sortedRecords = useMemo(() => {
    const list = [...filteredRecords];

    list.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "id":
          comparison = a.concernId - b.concernId;
          break;
        case "createdAt":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "company":
          comparison = a.companyName.localeCompare(b.companyName);
          break;
        case "department":
          comparison = a.department.localeCompare(b.department);
          break;
        case "subject":
          comparison = a.subjectOfConcern.localeCompare(b.subjectOfConcern);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "isAnonymous":
          comparison = (a.isAnonymous ? 1 : 0) - (b.isAnonymous ? 1 : 0);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return list;
  }, [filteredRecords, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, page, pageSize]);

  const handleSort = (field: ConcernsSortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder(field === "createdAt" ? "desc" : "asc");
    }
    setPage(1);
  };

  const handleOpenDetail = (record: IntercompanyConcernRecord) => {
    setSelectedRecord(record);
    setDetailModalOpen(true);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const handleRefresh = () => {
    loadData({ force: true });
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
    totalRecords: filteredRecords.length,
    filteredKpis: filteredKpis || data?.kpis,
    filteredCompanySummaries,
    filteredDepartmentSummaries,
    filteredStatusDistribution,
    filteredCategoryDistribution,
    filteredTrends,
    hasActiveFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    sortField,
    sortOrder,
    handleSort,
    selectedRecord,
    detailModalOpen,
    setDetailModalOpen,
    handleOpenDetail,
    handleResetFilters,
    handleRefresh,
  };
}

