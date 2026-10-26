"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  IntercompanyPunctualityData,
  IntercompanyPunctualityFilters,
  IntercompanyPunctualityRecord,
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
