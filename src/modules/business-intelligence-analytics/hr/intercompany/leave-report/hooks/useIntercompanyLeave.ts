"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  IntercompanyLeaveData,
  IntercompanyLeaveFilters,
  IntercompanyLeaveKpis,
  CompanyLeaveOtSummary,
  EmployeeLeaveAndOtSummary,
  DailyOtTrendPoint,
  StatusDistributionSegment,
  IntercompanyOvertimeRecord,
  IntercompanyLeaveRecord,
  LeaveSortField,
  LeaveSortOrder,
} from "../types";
import { fetchIntercompanyLeaveData } from "../providers/fetchProvider";

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
const DEFAULT_FILTERS: IntercompanyLeaveFilters = {
  startDate: startStr,
  endDate: todayStr,
  dates: undefined,
  companyIds: [],
  departments: [],
  status: "ALL",
  typeFilter: "ALL",
  search: "",
};

export function useIntercompanyLeave() {
  const [data, setData] = useState<IntercompanyLeaveData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<IntercompanyLeaveFilters>(DEFAULT_FILTERS);
  const [sortField, setSortField] = useState<LeaveSortField>("approvedOtHours");
  const [sortOrder, setSortOrder] = useState<LeaveSortOrder>("desc");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeLeaveAndOtSummary | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);

  const loadData = useCallback(async (opts?: { force?: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchIntercompanyLeaveData({
        startDate: filters.startDate,
        endDate: filters.endDate,
        dates: filters.dates,
        force: opts?.force,
      });
      setData(res);
    } catch (err: unknown) {
      console.error("[useIntercompanyLeave Error]", err);
      const msg = err instanceof Error ? err.message : "Failed to load leave & overtime report";
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
      filters.typeFilter !== "ALL" ||
      Boolean(filters.search.trim())
    );
  }, [filters]);

  // Filtered Employee Summaries
  const filteredEmployeeSummaries = useMemo<EmployeeLeaveAndOtSummary[]>(() => {
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

      // 3. Search query
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const mName = emp.name.toLowerCase().includes(q);
        const mId = emp.employeeId.toLowerCase().includes(q);
        const mCompany =
          emp.companyName.toLowerCase().includes(q) ||
          emp.companyCode.toLowerCase().includes(q);
        const mDept = emp.department.toLowerCase().includes(q);
        const mPos = emp.position.toLowerCase().includes(q);

        if (!mName && !mId && !mCompany && !mDept && !mPos) {
          return false;
        }
      }

      return true;
    });
  }, [data?.employeeSummaries, filters]);

  // Filtered Overtime Records
  const filteredOtRecords = useMemo<IntercompanyOvertimeRecord[]>(() => {
    if (!data?.overtimeRecords) return [];

    return data.overtimeRecords.filter((ot) => {
      if (filters.companyIds && filters.companyIds.length > 0) {
        if (!filters.companyIds.includes(String(ot.companyId))) {
          return false;
        }
      }
      if (filters.departments && filters.departments.length > 0) {
        if (!filters.departments.includes(ot.department)) {
          return false;
        }
      }
      if (filters.status !== "ALL") {
        if (ot.status !== filters.status.toLowerCase()) {
          return false;
        }
      }
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const mName = ot.name.toLowerCase().includes(q);
        const mId = ot.employeeId.toLowerCase().includes(q);
        const mComp = ot.companyName.toLowerCase().includes(q) || ot.companyCode.toLowerCase().includes(q);
        const mDept = ot.department.toLowerCase().includes(q);
        const mPurp = ot.purpose.toLowerCase().includes(q);
        if (!mName && !mId && !mComp && !mDept && !mPurp) return false;
      }
      return true;
    });
  }, [data?.overtimeRecords, filters]);

  // Filtered Leave Records
  const filteredLeaveRecords = useMemo<IntercompanyLeaveRecord[]>(() => {
    if (!data?.leaveRecords) return [];

    return data.leaveRecords.filter((lv) => {
      if (filters.companyIds && filters.companyIds.length > 0) {
        if (!filters.companyIds.includes(String(lv.companyId))) {
          return false;
        }
      }
      if (filters.departments && filters.departments.length > 0) {
        if (!filters.departments.includes(lv.department)) {
          return false;
        }
      }
      if (filters.status !== "ALL") {
        if (lv.status !== filters.status.toLowerCase()) {
          return false;
        }
      }
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const mName = lv.name.toLowerCase().includes(q);
        const mId = lv.employeeId.toLowerCase().includes(q);
        const mComp = lv.companyName.toLowerCase().includes(q) || lv.companyCode.toLowerCase().includes(q);
        const mDept = lv.department.toLowerCase().includes(q);
        const mReason = lv.reason.toLowerCase().includes(q);
        const mType = lv.leaveType.toLowerCase().includes(q);
        if (!mName && !mId && !mComp && !mDept && !mReason && !mType) return false;
      }
      return true;
    });
  }, [data?.leaveRecords, filters]);

  // Dynamic Filtered KPIs
  const filteredKpis = useMemo<IntercompanyLeaveKpis | null>(() => {
    if (!data?.kpis) return null;
    if (!hasActiveFilter) return data.kpis;

    let otMins = 0;
    let appOtMins = 0;
    let otReqs = 0;
    let appOtReqs = 0;
    let pendOtReqs = 0;
    let rejOtReqs = 0;

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

    let lvReqs = 0;
    let appLvReqs = 0;
    let appLvDays = 0;
    let pendLvReqs = 0;

    filteredLeaveRecords.forEach((lv) => {
      lvReqs++;
      if (lv.status === "approved") {
        appLvReqs++;
        appLvDays += lv.totalDays;
      } else if (lv.status === "pending") {
        pendLvReqs++;
      }
    });

    const uniqueCos = new Set<number>();
    filteredOtRecords.forEach((r) => uniqueCos.add(r.companyId));
    filteredLeaveRecords.forEach((r) => uniqueCos.add(r.companyId));
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
      totalLeaveRequests: lvReqs,
      totalApprovedLeaveRequests: appLvReqs,
      totalApprovedLeaveDays: Math.round(appLvDays * 10) / 10,
      totalPendingLeaveRequests: pendLvReqs,
      activeCompaniesCount: uniqueCos.size,
      totalCompaniesCount: data.companiesList.length,
      topOtEmployee: topEmp,
      topOtCompany: data.kpis.topOtCompany,
    };
  }, [data, hasActiveFilter, filteredOtRecords, filteredLeaveRecords, filteredEmployeeSummaries]);

  // Dynamic Filtered Company Summaries
  const filteredCompanySummaries = useMemo<CompanyLeaveOtSummary[]>(() => {
    if (!data?.companySummaries) return [];
    if (!hasActiveFilter) return data.companySummaries;

    // Filter to selected companies if company filter is active
    if (filters.companyIds && filters.companyIds.length > 0) {
      return data.companySummaries.filter((c) =>
        filters.companyIds.includes(String(c.companyId))
      );
    }

    return data.companySummaries;
  }, [data?.companySummaries, hasActiveFilter, filters.companyIds]);

  // Dynamic Filtered Status Distribution
  const filteredStatusDistribution = useMemo<StatusDistributionSegment[]>(() => {
    if (!data?.statusDistribution) return [];
    if (!hasActiveFilter) return data.statusDistribution;
    if (!filteredKpis) return data.statusDistribution;

    const total = filteredKpis.totalOtRequests + filteredKpis.totalLeaveRequests;
    const approved = filteredKpis.totalApprovedOtRequests + filteredKpis.totalApprovedLeaveRequests;
    const pending = filteredKpis.totalPendingOtRequests + filteredKpis.totalPendingLeaveRequests;
    const rejected = Math.max(0, total - approved - pending);

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
        color: "#ef4444",
      },
    ];
  }, [data?.statusDistribution, hasActiveFilter, filteredKpis]);

  // Dynamic Filtered Daily Trends
  const filteredDailyTrends = useMemo<DailyOtTrendPoint[]>(() => {
    if (!data?.dailyTrends) return [];
    if (!hasActiveFilter) return data.dailyTrends;

    const tMap = new Map<
      string,
      { totalOtMinutes: number; approvedOtMinutes: number; otCount: number; leaveCount: number }
    >();

    (data.dates || []).forEach((d) => {
      tMap.set(d, { totalOtMinutes: 0, approvedOtMinutes: 0, otCount: 0, leaveCount: 0 });
    });

    filteredOtRecords.forEach((ot) => {
      const cur = tMap.get(ot.requestDate) || {
        totalOtMinutes: 0,
        approvedOtMinutes: 0,
        otCount: 0,
        leaveCount: 0,
      };
      cur.otCount++;
      cur.totalOtMinutes += ot.durationMinutes;
      if (ot.status === "approved") {
        cur.approvedOtMinutes += ot.durationMinutes;
      }
      tMap.set(ot.requestDate, cur);
    });

    filteredLeaveRecords.forEach((lv) => {
      const cur = tMap.get(lv.leaveStart) || {
        totalOtMinutes: 0,
        approvedOtMinutes: 0,
        otCount: 0,
        leaveCount: 0,
      };
      cur.leaveCount++;
      tMap.set(lv.leaveStart, cur);
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
        leaveRequestsCount: v.leaveCount,
      });
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [data, hasActiveFilter, filteredOtRecords, filteredLeaveRecords]);

  // Top 5 OT Contributors
  const filteredTopEmployees = useMemo(() => {
    return [...filteredEmployeeSummaries]
      .filter((e) => e.totalOtHours > 0 || e.approvedLeaveDays > 0)
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
        case "approvedLeaveDays":
          comparison = a.approvedLeaveDays - b.approvedLeaveDays;
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

  const handleSort = (field: LeaveSortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const handleOpenDetail = (emp: EmployeeLeaveAndOtSummary) => {
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
    filteredLeaveRecords,
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
