"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  IntercompanyPunctualityData,
  IntercompanyPunctualityFilters,
  IntercompanyPunctualityRecord,
  IntercompanyPunctualityKpis,
  CompanyPunctualitySummary,
  DailyPunctualityTrendPoint,
  PunctualityDistributionSegment,
  PunctualityLeaderboardItem,
  PunctualitySortField,
  PunctualitySortOrder,
} from "../types";
import { fetchIntercompanyPunctualityData } from "../providers/fetchProvider";

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const todayStr = getTodayString();
const DEFAULT_FILTERS: IntercompanyPunctualityFilters = {
  date: todayStr,
  startDate: todayStr,
  endDate: todayStr,
  dates: [todayStr],
  companyIds: [],
  departments: [],
  punctualityStatus: "ALL",
  search: "",
};

export function useIntercompanyPunctuality() {
  const [data, setData] = useState<IntercompanyPunctualityData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<IntercompanyPunctualityFilters>(DEFAULT_FILTERS);
  const [sortField, setSortField] = useState<PunctualitySortField>("delayMinutes");
  const [sortOrder, setSortOrder] = useState<PunctualitySortOrder>("desc");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const [selectedRecord, setSelectedRecord] = useState<IntercompanyPunctualityRecord | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);

  const loadData = useCallback(async (opts?: { force?: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchIntercompanyPunctualityData({
        date: filters.date,
        startDate: filters.startDate,
        endDate: filters.endDate,
        dates: filters.dates,
        force: opts?.force,
      });
      setData(res);
    } catch (err: unknown) {
      console.error("[useIntercompanyPunctuality Error]", err);
      const msg = err instanceof Error ? err.message : "Failed to load punctuality report";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [filters.date, filters.startDate, filters.endDate, filters.dates]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side filtering across companies, departments, statuses, search
  const filteredRecords = useMemo(() => {
    if (!data?.records) return [];

    return data.records.filter((rec) => {
      // 1. Multi-Company filter
      if (filters.companyIds && filters.companyIds.length > 0) {
        if (!filters.companyIds.includes(String(rec.companyId))) {
          return false;
        }
      }

      // 2. Multi-Department filter
      if (filters.departments && filters.departments.length > 0) {
        if (!filters.departments.includes(rec.department)) {
          return false;
        }
      }

      // 3. Status filter
      if (filters.punctualityStatus !== "ALL") {
        if (rec.punctualityStatus !== filters.punctualityStatus) {
          return false;
        }
      }

      // 4. Search query
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const matchName = rec.name.toLowerCase().includes(q);
        const matchEmpId = rec.employeeId.toLowerCase().includes(q);
        const matchCompany =
          rec.companyName.toLowerCase().includes(q) ||
          rec.companyCode.toLowerCase().includes(q);
        const matchDept = rec.department.toLowerCase().includes(q);
        const matchPos = rec.position.toLowerCase().includes(q);

        if (!matchName && !matchEmpId && !matchCompany && !matchDept && !matchPos) {
          return false;
        }
      }

      return true;
    });
  }, [data?.records, filters]);

  // Check if any client-side filter is currently active
  const hasActiveFilter = useMemo(() => {
    return (
      (filters.companyIds && filters.companyIds.length > 0) ||
      (filters.departments && filters.departments.length > 0) ||
      filters.punctualityStatus !== "ALL" ||
      Boolean(filters.search.trim())
    );
  }, [filters]);

  // 1. Dynamic Filtered KPIs
  const filteredKpis = useMemo<IntercompanyPunctualityKpis | null>(() => {
    if (!data?.kpis) return null;
    if (!hasActiveFilter) return data.kpis;

    const uniqueStaff = new Set<string>();
    const uniqueCos = new Set<number>();
    const deptOnTime = new Map<string, { onTime: number; total: number }>();
    const compOnTime = new Map<string, { onTime: number; total: number }>();

    let presentLogs = 0;
    let onTime = 0;
    let grace = 0;
    let moderate = 0;
    let severe = 0;
    let undertime = 0;
    let delayMins = 0;

    filteredRecords.forEach((r) => {
      uniqueStaff.add(`${r.companyId}_${r.userId}`);
      uniqueCos.add(r.companyId);

      const isPresent = r.punctualityStatus !== "Absent" && r.punctualityStatus !== "On Leave";
      if (isPresent) {
        presentLogs++;
        delayMins += r.delayMinutes || 0;

        if (r.punctualityStatus === "On Time") {
          onTime++;
        } else if (r.punctualityStatus === "Grace Period") {
          grace++;
        } else if (r.punctualityStatus === "Moderate Late") {
          moderate++;
        } else if (r.punctualityStatus === "Severe Late") {
          severe++;
        } else if (r.punctualityStatus === "Undertime") {
          undertime++;
        }

        // Department mapping
        const dStat = deptOnTime.get(r.department) || { onTime: 0, total: 0 };
        dStat.total++;
        if (r.punctualityStatus === "On Time") dStat.onTime++;
        deptOnTime.set(r.department, dStat);

        // Company mapping
        const cStat = compOnTime.get(r.companyName) || { onTime: 0, total: 0 };
        cStat.total++;
        if (r.punctualityStatus === "On Time") cStat.onTime++;
        compOnTime.set(r.companyName, cStat);
      }
    });

    const totalLate = grace + moderate + severe;
    const overallRate = presentLogs > 0 ? Math.round((onTime / presentLogs) * 100) : 0;
    const avgDelay = totalLate > 0 ? Math.round(delayMins / totalLate) : 0;

    let bestComp = "N/A";
    let bestCompRate = -1;
    compOnTime.forEach((v, c) => {
      const r = v.total > 0 ? Math.round((v.onTime / v.total) * 100) : 0;
      if (r > bestCompRate) {
        bestCompRate = r;
        bestComp = c;
      }
    });

    let bestDept = "N/A";
    let bestDeptRate = -1;
    deptOnTime.forEach((v, d) => {
      const r = v.total > 0 ? Math.round((v.onTime / v.total) * 100) : 0;
      if (r > bestDeptRate) {
        bestDeptRate = r;
        bestDept = d;
      }
    });

    return {
      totalStaff: uniqueStaff.size,
      totalPresentLogs: presentLogs,
      onTimeCount: onTime,
      totalLateCount: totalLate,
      gracePeriodCount: grace,
      moderateLateCount: moderate,
      severeLateCount: severe,
      undertimeCount: undertime,
      overallPunctualityRate: overallRate,
      averageDelayMinutes: avgDelay,
      totalDelayMinutes: delayMins,
      activeCompaniesCount: uniqueCos.size,
      totalCompaniesCount: data.companiesList.length,
      totalDays: data.kpis.totalDays || 1,
      mostPunctualCompany: bestComp,
      mostPunctualDepartment: bestDept,
    };
  }, [data, hasActiveFilter, filteredRecords]);

  // 2. Dynamic Filtered Company Summaries
  const filteredCompanySummaries = useMemo<CompanyPunctualitySummary[]>(() => {
    if (!data?.companySummaries) return [];
    if (!hasActiveFilter) return data.companySummaries;

    const compMap = new Map<
      number,
      {
        companyName: string;
        companyCode: string;
        staff: Set<number>;
        logs: number;
        onTime: number;
        grace: number;
        moderate: number;
        severe: number;
        undertime: number;
        delay: number;
      }
    >();

    filteredRecords.forEach((r) => {
      const isPresent = r.punctualityStatus !== "Absent" && r.punctualityStatus !== "On Leave";
      const cur = compMap.get(r.companyId) || {
        companyName: r.companyName,
        companyCode: r.companyCode,
        staff: new Set<number>(),
        logs: 0,
        onTime: 0,
        grace: 0,
        moderate: 0,
        severe: 0,
        undertime: 0,
        delay: 0,
      };

      cur.staff.add(r.userId);

      if (isPresent) {
        cur.logs++;
        cur.delay += r.delayMinutes || 0;
        if (r.punctualityStatus === "On Time") cur.onTime++;
        else if (r.punctualityStatus === "Grace Period") cur.grace++;
        else if (r.punctualityStatus === "Moderate Late") cur.moderate++;
        else if (r.punctualityStatus === "Severe Late") cur.severe++;
        else if (r.punctualityStatus === "Undertime") cur.undertime++;
      }

      compMap.set(r.companyId, cur);
    });

    const result: CompanyPunctualitySummary[] = [];
    compMap.forEach((c, cid) => {
      const totalLate = c.grace + c.moderate + c.severe;
      const rate = c.logs > 0 ? Math.round((c.onTime / c.logs) * 100) : 0;
      const avgD = totalLate > 0 ? Math.round(c.delay / totalLate) : 0;

      result.push({
        companyId: cid,
        companyName: c.companyName,
        companyCode: c.companyCode,
        status: "ACTIVE",
        totalEmployees: c.staff.size,
        totalLogs: c.logs,
        onTimeCount: c.onTime,
        gracePeriodCount: c.grace,
        moderateLateCount: c.moderate,
        severeLateCount: c.severe,
        totalLateCount: totalLate,
        undertimeCount: c.undertime,
        punctualityRate: rate,
        avgDelayMinutes: avgD,
      });
    });

    return result.sort((a, b) => b.punctualityRate - a.punctualityRate);
  }, [data?.companySummaries, hasActiveFilter, filteredRecords]);

  // 3. Dynamic Filtered Distribution
  const filteredDistribution = useMemo<PunctualityDistributionSegment[]>(() => {
    if (!data?.distribution) return [];
    if (!hasActiveFilter) return data.distribution;
    if (!filteredKpis) return data.distribution;

    const total = filteredKpis.totalPresentLogs;
    return [
      {
        name: "On Time",
        count: filteredKpis.onTimeCount,
        percentage: total > 0 ? Math.round((filteredKpis.onTimeCount / total) * 100) : 0,
        color: "#10b981",
      },
      {
        name: "Grace (1-15m)",
        count: filteredKpis.gracePeriodCount,
        percentage: total > 0 ? Math.round((filteredKpis.gracePeriodCount / total) * 100) : 0,
        color: "#f59e0b",
      },
      {
        name: "Moderate (16-30m)",
        count: filteredKpis.moderateLateCount,
        percentage: total > 0 ? Math.round((filteredKpis.moderateLateCount / total) * 100) : 0,
        color: "#f97316",
      },
      {
        name: "Severe (>30m)",
        count: filteredKpis.severeLateCount,
        percentage: total > 0 ? Math.round((filteredKpis.severeLateCount / total) * 100) : 0,
        color: "#ef4444",
      },
      {
        name: "Undertime",
        count: filteredKpis.undertimeCount,
        percentage: total > 0 ? Math.round((filteredKpis.undertimeCount / total) * 100) : 0,
        color: "#8b5cf6",
      },
    ];
  }, [data?.distribution, hasActiveFilter, filteredKpis]);

  // 4. Dynamic Filtered Daily Trends
  const filteredDailyTrends = useMemo<DailyPunctualityTrendPoint[]>(() => {
    if (!data?.dailyTrends) return [];
    if (!hasActiveFilter) return data.dailyTrends;

    const trendMap = new Map<
      string,
      { totalLogs: number; onTimeCount: number; lateCount: number; delayMinutes: number }
    >();

    (data.dates || []).forEach((d) => {
      trendMap.set(d, { totalLogs: 0, onTimeCount: 0, lateCount: 0, delayMinutes: 0 });
    });

    filteredRecords.forEach((r) => {
      const isPresent = r.punctualityStatus !== "Absent" && r.punctualityStatus !== "On Leave";
      if (!isPresent) return;

      const cur = trendMap.get(r.logDate) || {
        totalLogs: 0,
        onTimeCount: 0,
        lateCount: 0,
        delayMinutes: 0,
      };

      cur.totalLogs++;
      cur.delayMinutes += r.delayMinutes || 0;
      if (r.punctualityStatus === "On Time") cur.onTimeCount++;
      else if (
        r.punctualityStatus === "Grace Period" ||
        r.punctualityStatus === "Moderate Late" ||
        r.punctualityStatus === "Severe Late"
      ) {
        cur.lateCount++;
      }
      trendMap.set(r.logDate, cur);
    });

    const result: DailyPunctualityTrendPoint[] = [];
    trendMap.forEach((v, d) => {
      const rate = v.totalLogs > 0 ? Math.round((v.onTimeCount / v.totalLogs) * 100) : 0;
      const avgD = v.lateCount > 0 ? Math.round(v.delayMinutes / v.lateCount) : 0;
      result.push({
        date: d,
        displayDate: d.slice(5),
        totalLogs: v.totalLogs,
        onTimeCount: v.onTimeCount,
        lateCount: v.lateCount,
        punctualityRate: rate,
        avgDelayMinutes: avgD,
      });
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [data, hasActiveFilter, filteredRecords]);

  // 5. Dynamic Filtered Leaderboards
  const { filteredTopPunctual, filteredFrequentLate } = useMemo<{
    filteredTopPunctual: PunctualityLeaderboardItem[];
    filteredFrequentLate: PunctualityLeaderboardItem[];
  }>(() => {
    if (!data?.topPunctual || !data?.frequentLate) {
      return { filteredTopPunctual: [], filteredFrequentLate: [] };
    }
    if (!hasActiveFilter) {
      return {
        filteredTopPunctual: data.topPunctual,
        filteredFrequentLate: data.frequentLate,
      };
    }

    const parseTimeToMins = (raw: string | null | undefined): number | null => {
      if (!raw) return null;
      const s = raw.trim();
      const timePart = s.includes("T") ? s.split("T")[1] : s;
      const match = timePart.match(/(\d{1,2}):(\d{2})/);
      if (!match) return null;
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      if (isNaN(h) || isNaN(m)) return null;
      const upper = s.toUpperCase();
      if (upper.includes("PM") && h < 12) h += 12;
      else if (upper.includes("AM") && h === 12) h = 0;
      return h * 60 + m;
    };

    const userMap = new Map<
      string,
      {
        userId: number;
        employeeId: string;
        name: string;
        companyCode: string;
        companyName: string;
        department: string;
        position: string;
        avatar: string | null;
        totalDays: number;
        onTimeDays: number;
        lateDays: number;
        totalDelayMinutes: number;
        totalEarlyMinutes: number;
        maxEarlyMinutes: number;
        earliestArrivalMinutes: number | null;
        earliestArrival?: string | null;
      }
    >();

    filteredRecords.forEach((r) => {
      const isPresent = r.punctualityStatus !== "Absent" && r.punctualityStatus !== "On Leave";
      if (!isPresent) return;

      const key = `${r.companyId}_${r.userId}`;
      const cur = userMap.get(key) || {
        userId: r.userId,
        employeeId: r.employeeId,
        name: r.name,
        companyCode: r.companyCode,
        companyName: r.companyName,
        department: r.department,
        position: r.position,
        avatar: r.avatar,
        totalDays: 0,
        onTimeDays: 0,
        lateDays: 0,
        totalDelayMinutes: 0,
        totalEarlyMinutes: 0,
        maxEarlyMinutes: 0,
        earliestArrivalMinutes: null,
        earliestArrival: null,
      };

      cur.totalDays++;
      if (r.punctualityStatus === "On Time") {
        cur.onTimeDays++;
        const arrMins = r.arrivalMinutes ?? parseTimeToMins(r.rawTimeIn || r.timeIn);
        const earlyMins =
          r.earlyMinutes ?? (arrMins !== null && arrMins <= 480 ? 480 - arrMins : 0);
        cur.totalEarlyMinutes += earlyMins;
        if (earlyMins > cur.maxEarlyMinutes) {
          cur.maxEarlyMinutes = earlyMins;
        }
        if (
          arrMins !== null &&
          (cur.earliestArrivalMinutes === null || arrMins < cur.earliestArrivalMinutes)
        ) {
          cur.earliestArrivalMinutes = arrMins;
          cur.earliestArrival = r.timeIn;
        }
      } else if ((r.delayMinutes || 0) > 0) {
        cur.lateDays++;
        cur.totalDelayMinutes += r.delayMinutes || 0;
      }

      userMap.set(key, cur);
    });

    const userList: PunctualityLeaderboardItem[] = [];
    userMap.forEach((u) => {
      const rate = u.totalDays > 0 ? Math.round((u.onTimeDays / u.totalDays) * 100) : 0;
      const avgD = u.lateDays > 0 ? Math.round(u.totalDelayMinutes / u.lateDays) : 0;
      const avgEarly = u.onTimeDays > 0 ? Math.round(u.totalEarlyMinutes / u.onTimeDays) : 0;
      userList.push({
        ...u,
        punctualityRate: rate,
        avgDelayMinutes: avgD,
        avgEarlyMinutes: avgEarly,
      });
    });

    const topPunctual = [...userList]
      .filter((u) => u.onTimeDays > 0 && u.earliestArrivalMinutes !== null)
      .sort(
        (a, b) =>
          (a.earliestArrivalMinutes ?? 9999) - (b.earliestArrivalMinutes ?? 9999) ||
          (b.avgEarlyMinutes ?? 0) - (a.avgEarlyMinutes ?? 0) ||
          a.avgDelayMinutes - b.avgDelayMinutes
      )
      .slice(0, 8);

    const frequentLate = [...userList]
      .filter((u) => u.lateDays > 0)
      .sort((a, b) => b.lateDays - a.lateDays || b.avgDelayMinutes - a.avgDelayMinutes)
      .slice(0, 8);

    return { filteredTopPunctual: topPunctual, filteredFrequentLate: frequentLate };
  }, [data, hasActiveFilter, filteredRecords]);

  // Client-side sorting
  const sortedRecords = useMemo(() => {
    const list = [...filteredRecords];

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
        case "logDate":
          comparison = (a.logDate || "").localeCompare(b.logDate || "");
          break;
        case "timeIn":
          comparison = (a.timeIn || "ZZZ").localeCompare(b.timeIn || "ZZZ");
          break;
        case "punctualityStatus":
          comparison = a.punctualityStatus.localeCompare(b.punctualityStatus);
          break;
        case "delayMinutes":
          comparison = a.delayMinutes - b.delayMinutes;
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

  const handleSort = (field: PunctualitySortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder(field === "delayMinutes" ? "desc" : "asc");
    }
    setPage(1);
  };

  const handleOpenDetail = (record: IntercompanyPunctualityRecord) => {
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
    filteredDistribution,
    filteredDailyTrends,
    filteredTopPunctual,
    filteredFrequentLate,
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
