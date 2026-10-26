"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  IntercompanyOvertimeData,
  IntercompanyOvertimeFilters,
  IntercompanyOvertimeKpis,
  CompanyOvertimeSummary,
  EmployeeOvertimeSummary,
  DailyOtTrendPoint,
  StatusDistributionSegment,
  IntercompanyOvertimeRecord,
  OvertimeSortField,
  OvertimeSortOrder,
} from "../types";
import { fetchIntercompanyOvertimeData } from "../providers/fetchProvider";

function getMonthStartAndToday(): { startStr: string; todayStr: string } {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return {
    startStr: `${year}-${month}-01`,
    todayStr: `${year}-${month}-${day}`,
  };
}

const { startStr, todayStr } = getMonthStartAndToday();
const DEFAULT_FILTERS: IntercompanyOvertimeFilters = {
  startDate: startStr,
  endDate: todayStr,
  dates: undefined,
  companyIds: [],
  departments: [],
  status: "ALL",
  search: "",
};

export function useIntercompanyOvertime() {
  const [data, setData] = useState<IntercompanyOvertimeData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<IntercompanyOvertimeFilters>(DEFAULT_FILTERS);
  const [sortField, setSortField] = useState<OvertimeSortField>("approvedOtHours");
  const [sortOrder, setSortOrder] = useState<OvertimeSortOrder>("desc");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOvertimeSummary | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);

  const loadData = useCallback(async (opts?: { force?: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchIntercompanyOvertimeData({
        startDate: filters.startDate,
        endDate: filters.endDate,
        dates: filters.dates,
        force: opts?.force,
      });
      setData(res);
    } catch (err: unknown) {
      console.error("[useIntercompanyOvertime Error]", err);
      const msg = err instanceof Error ? err.message : "Failed to load overtime report";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [filters.startDate, filters.endDate, filters.dates]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check if active filters exist
  const hasActiveFilter = useMemo(() => {
    return (
      (filters.companyIds && filters.companyIds.length > 0) ||
      (filters.departments && filters.departments.length > 0) ||
      filters.status !== "ALL" ||
      Boolean(filters.search.trim())
    );
  }, [filters]);

  // Filtered Employee Summaries
  const filteredEmployeeSummaries = useMemo<EmployeeOvertimeSummary[]>(() => {
    if (!data?.employeeSummaries) return [];

    return data.employeeSummaries.filter((emp) => {
      // 1. Company filter
      if (filters.companyIds && filters.companyIds.length > 0) {
        if (!filters.companyIds.includes(String(emp.companyId))) {
          return false;
        }
      }

      // 2. Department filter
      if (filters.departments && filters.departments.length > 0) {
        if (!filters.departments.includes(emp.department)) {
          return false;
        }
      }

      // 3. Status filter
      if (filters.status !== "ALL") {
        if (filters.status === "approved" && emp.approvedOtRequests === 0) return false;
        if (filters.status === "pending" && emp.pendingOtRequests === 0) return false;
        if (filters.status === "rejected" && emp.rejectedOtRequests === 0) return false;
      }

      // 4. Search query
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const matchesName = emp.name.toLowerCase().includes(q);
        const matchesEmpId = emp.employeeId.toLowerCase().includes(q);
        const matchesDept = emp.department.toLowerCase().includes(q);
        const matchesPos = emp.position.toLowerCase().includes(q);
        const matchesCo =
          emp.companyName.toLowerCase().includes(q) ||
          emp.companyCode.toLowerCase().includes(q);
        if (!matchesName && !matchesEmpId && !matchesDept && !matchesPos && !matchesCo) {
          return false;
        }
      }

      return true;
    });
  }, [data, filters]);

  // Filtered Overtime Records
  const filteredOtRecords = useMemo<IntercompanyOvertimeRecord[]>(() => {
    if (!data?.overtimeRecords) return [];

    return data.overtimeRecords.filter((ot) => {
      // 1. Company filter
      if (filters.companyIds && filters.companyIds.length > 0) {
        if (!filters.companyIds.includes(String(ot.companyId))) {
          return false;
        }
      }

      // 2. Department filter
      if (filters.departments && filters.departments.length > 0) {
        if (!filters.departments.includes(ot.department)) {
          return false;
        }
      }

      // 3. Status filter
      if (filters.status !== "ALL" && ot.status !== filters.status) {
        return false;
      }

      // 4. Search filter
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const matchesName = ot.name.toLowerCase().includes(q);
        const matchesEmpId = ot.employeeId.toLowerCase().includes(q);
        const matchesDept = ot.department.toLowerCase().includes(q);
        const matchesPurpose = ot.purpose.toLowerCase().includes(q);
        const matchesCo =
          ot.companyName.toLowerCase().includes(q) ||
          ot.companyCode.toLowerCase().includes(q);
        if (!matchesName && !matchesEmpId && !matchesDept && !matchesPurpose && !matchesCo) {
          return false;
        }
      }

      return true;
    });
  }, [data, filters]);

  // Recalculated dynamic KPIs
  const filteredKpis = useMemo<IntercompanyOvertimeKpis | null>(() => {
    if (!data?.kpis) return null;

    if (!hasActiveFilter) {
      return data.kpis;
    }

    let otReqs = 0;
    let appOtReqs = 0;
    let pendOtReqs = 0;
    let rejOtReqs = 0;
    let otMins = 0;
    let appOtMins = 0;

    filteredOtRecords.forEach((ot) => {
      otReqs++;
      otMins += ot.durationMinutes;
      if (ot.status === "approved") {
        appOtReqs++;
        appOtMins += ot.durationMinutes;
      } else if (ot.status === "pending") {
        pendOtReqs++;
      } else {
        rejOtReqs++;
      }
    });

    const uniqueCos = new Set<number>();
    filteredOtRecords.forEach((r) => uniqueCos.add(r.companyId));
    filteredEmployeeSummaries.forEach((r) => uniqueCos.add(r.companyId));

    const otApprovalRate = otReqs > 0 ? Math.round((appOtReqs / otReqs) * 100) : 0;
    const topEmp = filteredEmployeeSummaries[0]?.approvedOtHours > 0 ? filteredEmployeeSummaries[0].name : "N/A";

    return {
      totalEmployees: filteredEmployeeSummaries.length,
      totalOtMinutes: otMins,
      totalOtHours: Math.round((otMins / 60) * 10) / 10,
      totalOtRequests: otReqs,
      totalApprovedOtRequests: appOtReqs,
      totalApprovedOtMinutes: appOtMins,
      totalApprovedOtHours: Math.round((appOtMins / 60) * 10) / 10,
      totalPendingOtRequests: pendOtReqs,
      totalRejectedOtRequests: rejOtReqs,
      otApprovalRate,
      activeCompaniesCount: uniqueCos.size,
      totalCompaniesCount: data.kpis.totalCompaniesCount,
      topOtEmployee: topEmp,
      topOtCompany: data.kpis.topOtCompany,
    };
  }, [data, hasActiveFilter, filteredOtRecords, filteredEmployeeSummaries]);

  // Filtered Company Summaries
  const filteredCompanySummaries = useMemo<CompanyOvertimeSummary[]>(() => {
    if (!data?.companySummaries) return [];

    const compSummaries = data.companySummaries;
    const companyIds = filters.companyIds;

    if (companyIds && companyIds.length > 0) {
      return compSummaries.filter((c) =>
        companyIds.includes(String(c.companyId))
      );
    }

    return compSummaries;
  }, [data, filters.companyIds]);

  // Filtered Status Distribution
  const filteredStatusDistribution = useMemo<StatusDistributionSegment[]>(() => {
    if (!data?.statusDistribution) return [];

    if (!hasActiveFilter) {
      return data.statusDistribution;
    }

    let approved = 0;
    let pending = 0;
    let rejected = 0;

    filteredOtRecords.forEach((ot) => {
      if (ot.status === "approved") approved++;
      else if (ot.status === "pending") pending++;
      else rejected++;
    });

    const total = approved + pending + rejected;

    return [
      {
        name: "Approved",
        count: approved,
        percentage: total > 0 ? Math.round((approved / total) * 100) : 0,
        color: "#10b981",
      },
      {
        name: "Pending",
        count: pending,
        percentage: total > 0 ? Math.round((pending / total) * 100) : 0,
        color: "#f59e0b",
      },
      {
        name: "Rejected",
        count: rejected,
        percentage: total > 0 ? Math.round((rejected / total) * 100) : 0,
        color: "#f43f5e",
      },
    ];
  }, [data, hasActiveFilter, filteredOtRecords]);

  // Filtered Daily Trends
  const filteredDailyTrends = useMemo<DailyOtTrendPoint[]>(() => {
    if (!data?.dailyTrends) return [];

    if (!hasActiveFilter) {
      return data.dailyTrends;
    }

    const tMap = new Map<string, { totalOtMinutes: number; approvedOtMinutes: number; otCount: number; approvedCount: number }>();

    filteredOtRecords.forEach((ot) => {
      const cur = tMap.get(ot.requestDate) || {
        totalOtMinutes: 0,
        approvedOtMinutes: 0,
        otCount: 0,
        approvedCount: 0,
      };
      cur.totalOtMinutes += ot.durationMinutes;
      cur.otCount++;
      if (ot.status === "approved") {
        cur.approvedOtMinutes += ot.durationMinutes;
        cur.approvedCount++;
      }
      tMap.set(ot.requestDate, cur);
    });

    const result: DailyOtTrendPoint[] = [];
    tMap.forEach((v, d) => {
      result.push({
        date: d,
        displayDate: d.slice(5),
        totalOtMinutes: v.totalOtMinutes,
        totalOtHours: Math.round((v.totalOtMinutes / 60) * 10) / 10,
        approvedOtMinutes: v.approvedOtMinutes,
        approvedOtHours: Math.round((v.approvedOtMinutes / 60) * 10) / 10,
        otRequestsCount: v.otCount,
        approvedRequestsCount: v.approvedCount,
      });
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [data, hasActiveFilter, filteredOtRecords]);

  // Top 5 OT Contributors
  const filteredTopEmployees = useMemo(() => {
    return [...filteredEmployeeSummaries]
      .filter((e) => e.totalOtHours > 0)
      .sort((a, b) => b.approvedOtHours - a.approvedOtHours)
      .slice(0, 5);
  }, [filteredEmployeeSummaries]);

  // Client-side Sorting
  const sortedEmployeeSummaries = useMemo(() => {
    const list = [...filteredEmployeeSummaries];

    list.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "employeeId":
          comparison = a.employeeId.localeCompare(b.employeeId);
          break;
        case "company":
          comparison = a.companyName.localeCompare(b.companyName);
          break;
        case "department":
          comparison = a.department.localeCompare(b.department);
          break;
        case "totalOtHours":
          comparison = a.totalOtHours - b.totalOtHours;
          break;
        case "approvedOtHours":
          comparison = a.approvedOtHours - b.approvedOtHours;
          break;
        case "totalOtRequests":
          comparison = a.totalOtRequests - b.totalOtRequests;
          break;
        case "approvedOtRequests":
          comparison = a.approvedOtRequests - b.approvedOtRequests;
          break;
        case "approvalRate":
          comparison = a.approvalRate - b.approvalRate;
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return list;
  }, [filteredEmployeeSummaries, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedEmployeeSummaries.length / pageSize) || 1;
  const paginatedEmployeeSummaries = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedEmployeeSummaries.slice(start, start + pageSize);
  }, [sortedEmployeeSummaries, page, pageSize]);

  const handleSort = (field: OvertimeSortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const handleOpenDetail = (emp: EmployeeOvertimeSummary) => {
    setSelectedEmployee(emp);
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
    filteredEmployeeSummaries,
    sortedEmployeeSummaries,
    paginatedEmployeeSummaries,
    filteredOtRecords,
    filteredKpis: filteredKpis || data?.kpis,
    filteredCompanySummaries,
    filteredStatusDistribution,
    filteredDailyTrends,
    filteredTopEmployees,
    totalRecords: filteredEmployeeSummaries.length,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    sortField,
    sortOrder,
    handleSort,
    selectedEmployee,
    detailModalOpen,
    setDetailModalOpen,
    handleOpenDetail,
    handleResetFilters,
    handleRefresh,
  };
}
