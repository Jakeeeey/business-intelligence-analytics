"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  IntercompanyAttendanceData,
  IntercompanyAttendanceFilters,
  IntercompanyEmployeeRecord,
  SortField,
  SortOrder,
} from "../types";
import { fetchIntercompanyAttendanceData } from "../providers/fetchProvider";

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const DEFAULT_FILTERS: IntercompanyAttendanceFilters = {
  date: getTodayString(),
  companyId: "ALL",
  department: "ALL",
  attendanceStatus: "ALL",
  search: "",
};

export function useIntercompanyAttendance() {
  const [filters, setFilters] = useState<IntercompanyAttendanceFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<IntercompanyAttendanceData | null>(null);

  // Pagination & Sorting state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [sortField, setSortField] = useState<SortField>("companyName");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const loadData = useCallback(
    async (force = false) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchIntercompanyAttendanceData({
          date: filters.date,
          force,
        });
        setReportData(data);
      } catch (err) {
        console.error("[useIntercompanyAttendance] loadData error:", err);
        setError(err instanceof Error ? err.message : "Failed to load intercompany attendance");
      } finally {
        setLoading(false);
      }
    },
    [filters.date]
  );

  // Reload data when the selected target date changes
  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchIntercompanyAttendanceData(
          { date: filters.date },
          controller.signal
        );
        if (active) {
          setReportData(data);
        }
      } catch (err: unknown) {
        if (active && (err as { name?: string })?.name !== "AbortError") {
          console.error("[useIntercompanyAttendance] Fetch error:", err);
          setError(err instanceof Error ? err.message : "Failed to load attendance report");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchData();

    return () => {
      active = false;
      controller.abort();
    };
  }, [filters.date]);

  // Reset pagination when filter criteria change
  useEffect(() => {
    setPage(1);
  }, [filters.companyId, filters.department, filters.attendanceStatus, filters.search]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    if (!reportData) return [];

    return reportData.records.filter((rec) => {
      // Company Filter
      if (filters.companyId !== "ALL" && String(rec.companyId) !== filters.companyId) {
        return false;
      }

      // Department Filter
      if (filters.department !== "ALL" && rec.department !== filters.department) {
        return false;
      }

      // Status Filter
      if (filters.attendanceStatus !== "ALL") {
        if (filters.attendanceStatus === "Present") {
          if (rec.attendanceStatus !== "On Time" && rec.attendanceStatus !== "Late") return false;
        } else if (filters.attendanceStatus === "Filed Leave") {
          if (!rec.hasFiledLeave) return false;
        } else if (filters.attendanceStatus === "Leave Pending") {
          if (!rec.hasFiledLeave || rec.leaveStatus !== "pending") return false;
        } else if (filters.attendanceStatus === "On Leave") {
          if (rec.attendanceStatus !== "On Leave" && (!rec.hasFiledLeave || rec.leaveStatus !== "approved")) {
            return false;
          }
        } else if (rec.attendanceStatus !== filters.attendanceStatus) {
          return false;
        }
      }

      // Search Query
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const matchesName = rec.name.toLowerCase().includes(q);
        const matchesEmpId = rec.employeeId.toLowerCase().includes(q);
        const matchesCompany =
          rec.companyName.toLowerCase().includes(q) || rec.companyCode.toLowerCase().includes(q);
        const matchesDept = rec.department.toLowerCase().includes(q);
        const matchesPosition = rec.position.toLowerCase().includes(q);
        const matchesEmail = rec.email.toLowerCase().includes(q);

        if (
          !matchesName &&
          !matchesEmpId &&
          !matchesCompany &&
          !matchesDept &&
          !matchesPosition &&
          !matchesEmail
        ) {
          return false;
        }
      }

      return true;
    });
  }, [reportData, filters]);

  // Sorted records
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

      switch (sortField) {
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
        case "position":
          valA = a.position.toLowerCase();
          valB = b.position.toLowerCase();
          break;
        case "attendanceStatus":
          valA = a.attendanceStatus;
          valB = b.attendanceStatus;
          break;
        case "timeIn":
          valA = a.timeIn || "ZZZ";
          valB = b.timeIn || "ZZZ";
          break;
        case "timeOut":
          valA = a.timeOut || "ZZZ";
          valB = b.timeOut || "ZZZ";
          break;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRecords, sortField, sortOrder]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, page, pageSize]);

  // Dynamic filtered KPIs based on current view
  const currentKpis = useMemo(() => {
    if (!reportData) return null;

    if (
      filters.companyId === "ALL" &&
      filters.department === "ALL" &&
      filters.attendanceStatus === "ALL" &&
      !filters.search.trim()
    ) {
      return reportData.kpis;
    }

    const total = filteredRecords.length;
    let present = 0;
    let late = 0;
    let absent = 0;
    let leave = 0;
    let filedLeave = 0;
    let pendingLeave = 0;

    filteredRecords.forEach((r) => {
      if (r.attendanceStatus === "On Time") present++;
      else if (r.attendanceStatus === "Late") {
        present++;
        late++;
      } else if (r.attendanceStatus === "Absent") absent++;
      else if (r.attendanceStatus === "On Leave") leave++;

      if (r.hasFiledLeave) {
        filedLeave++;
        if (r.leaveStatus === "pending") {
          pendingLeave++;
        }
      }
    });

    const attRate = total > 0 ? Math.round((present / total) * 100) : 0;
    const punctRate = present > 0 ? Math.round(((present - late) / present) * 100) : 0;

    const uniqueCompIds = new Set(filteredRecords.map((r) => r.companyId));

    return {
      totalWorkforce: total,
      totalPresent: present,
      totalLate: late,
      totalAbsent: absent,
      totalOnLeave: leave,
      totalFiledLeave: filedLeave,
      totalPendingLeave: pendingLeave,
      overallAttendanceRate: attRate,
      overallPunctualityRate: punctRate,
      activeCompaniesCount: uniqueCompIds.size,
      totalCompaniesCount: reportData.kpis.totalCompaniesCount,
    };
  }, [reportData, filteredRecords, filters]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const resetFilters = () => {
    setFilters({
      date: getTodayString(),
      companyId: "ALL",
      department: "ALL",
      attendanceStatus: "ALL",
      search: "",
    });
  };

  return {
    filters,
    setFilters,
    loading,
    error,
    reportData,
    filteredRecords,
    sortedRecords,
    paginatedRecords,
    currentKpis,
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
