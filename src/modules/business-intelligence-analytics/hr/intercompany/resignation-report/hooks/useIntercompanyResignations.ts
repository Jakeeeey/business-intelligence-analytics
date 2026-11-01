import { useState, useEffect, useMemo, useCallback } from "react";
import {
  IntercompanyResignationData,
  IntercompanyResignationKpis,
  ResignationFilters,
} from "../types";
import { fetchIntercompanyResignationData } from "../providers/fetchProvider";
import { exportResignationsToCsv } from "../utils/exportCsv";

export type SortField =
  | "filingDate"
  | "resignationDate"
  | "noticeDays"
  | "name"
  | "companyName"
  | "department"
  | "status";

export type SortOrder = "asc" | "desc";

export function useIntercompanyResignations() {
  const [data, setData] = useState<IntercompanyResignationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [filters, setFilters] = useState<ResignationFilters>({
    company: "ALL",
    department: "ALL",
    status: "ALL",
    reasonCategory: "ALL",
    noticeCategory: "ALL",
    startDate: "",
    endDate: "",
    search: "",
  });

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("filingDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Load data
  const loadData = useCallback(async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchIntercompanyResignationData(force);
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load resignation data";
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

      // Status filter
      if (filters.status !== "ALL") {
        if (filters.status === "PENDING" && rec.status !== "PENDING") return false;
        if (filters.status === "APPROVED" && rec.status !== "APPROVED") return false;
        if (filters.status === "REJECTED" && rec.status !== "REJECTED") return false;
        if (filters.status === "COMPLETED" && rec.status !== "COMPLETED" && rec.status !== "RECORDED") return false;
      }

      // Reason Category filter
      if (filters.reasonCategory !== "ALL" && rec.reasonCategory !== filters.reasonCategory) {
        return false;
      }

      // Notice Category filter
      if (filters.noticeCategory !== "ALL" && rec.noticeCategory !== filters.noticeCategory) {
        return false;
      }

      // Date range (by filingDate or resignationDate)
      if (filters.startDate) {
        const fileDate = rec.filingDate.slice(0, 10);
        if (fileDate < filters.startDate) return false;
      }
      if (filters.endDate) {
        const fileDate = rec.filingDate.slice(0, 10);
        if (fileDate > filters.endDate) return false;
      }

      // Search term
      if (filters.search.trim()) {
        const term = filters.search.toLowerCase();
        const matchesName = rec.name.toLowerCase().includes(term);
        const matchesPosition = rec.position.toLowerCase().includes(term);
        const matchesDept = rec.department.toLowerCase().includes(term);
        const matchesCompany = rec.companyName.toLowerCase().includes(term) || rec.companyCode.toLowerCase().includes(term);
        const matchesReason = rec.reason.toLowerCase().includes(term);
        const matchesRemarks = rec.hrRemarks ? rec.hrRemarks.toLowerCase().includes(term) : false;
        if (!matchesName && !matchesPosition && !matchesDept && !matchesCompany && !matchesReason && !matchesRemarks) {
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
        case "filingDate":
          valA = new Date(a.filingDate).getTime() || 0;
          valB = new Date(b.filingDate).getTime() || 0;
          break;
        case "resignationDate":
          valA = new Date(a.resignationDate).getTime() || 0;
          valB = new Date(b.resignationDate).getTime() || 0;
          break;
        case "noticeDays":
          valA = a.noticeDays;
          valB = b.noticeDays;
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
        case "status":
          valA = a.status.toLowerCase();
          valB = b.status.toLowerCase();
          break;
        default:
          valA = a.recordId;
          valB = b.recordId;
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
  const dynamicKpis = useMemo<IntercompanyResignationKpis>(() => {
    if (!data) {
      return {
        totalResignations: 0,
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        completedCount: 0,
        avgNoticeDays: 0,
        compliantNoticeRate: 0,
        totalEmployees: 0,
        turnoverRate: 0,
        activeCompaniesCount: 0,
        totalCompaniesCount: 0,
        companiesWithResignationsCount: 0,
        topTurnoverCompany: "None",
        topTurnoverDepartment: "None",
        topResignationReason: "None",
      };
    }

    const count = filteredRecords.length;
    const pending = filteredRecords.filter((r) => r.status === "PENDING").length;
    const approved = filteredRecords.filter((r) => r.status === "APPROVED").length;
    const rejected = filteredRecords.filter((r) => r.status === "REJECTED").length;
    const completed = filteredRecords.filter((r) => r.status === "COMPLETED" || r.status === "RECORDED").length;

    const compliant = filteredRecords.filter((r) => r.noticeDays >= 30).length;
    const compliantRate = count > 0 ? Math.round((compliant / count) * 100) : 100;

    const validNotice = filteredRecords.filter((r) => r.noticeDays > 0);
    const avgNotice =
      validNotice.length > 0 ? Math.round(validNotice.reduce((s, r) => s + r.noticeDays, 0) / validNotice.length) : 30;

    const companiesWithData = new Set(filteredRecords.map((r) => r.companyCode)).size;

    // Reason frequency
    const reasonCounts = new Map<string, number>();
    filteredRecords.forEach((r) => {
      reasonCounts.set(r.reasonCategory, (reasonCounts.get(r.reasonCategory) || 0) + 1);
    });
    let topReason = "None";
    let maxReasonCount = 0;
    reasonCounts.forEach((c, r) => {
      if (c > maxReasonCount) {
        maxReasonCount = c;
        topReason = r;
      }
    });

    // Department frequency
    const deptCounts = new Map<string, number>();
    filteredRecords.forEach((r) => {
      deptCounts.set(r.department, (deptCounts.get(r.department) || 0) + 1);
    });
    let topDept = "None";
    let maxDeptCount = 0;
    deptCounts.forEach((c, d) => {
      if (c > maxDeptCount) {
        maxDeptCount = c;
        topDept = d;
      }
    });

    // Turnover calculation
    const turnover =
      data.kpis.totalEmployees > 0
        ? Number(((count / data.kpis.totalEmployees) * 100).toFixed(1))
        : 0;

    return {
      totalResignations: count,
      pendingCount: pending,
      approvedCount: approved,
      rejectedCount: rejected,
      completedCount: completed,
      avgNoticeDays: avgNotice,
      compliantNoticeRate: compliantRate,
      totalEmployees: data.kpis.totalEmployees,
      turnoverRate: turnover,
      activeCompaniesCount: data.kpis.activeCompaniesCount,
      totalCompaniesCount: data.kpis.totalCompaniesCount,
      companiesWithResignationsCount: companiesWithData,
      topTurnoverCompany: data.kpis.topTurnoverCompany,
      topTurnoverDepartment: topDept !== "None" ? topDept : data.kpis.topTurnoverDepartment,
      topResignationReason: topReason !== "None" ? topReason : data.kpis.topResignationReason,
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
      status: "ALL",
      reasonCategory: "ALL",
      noticeCategory: "ALL",
      startDate: "",
      endDate: "",
      search: "",
    });
    setPage(1);
  };

  const handleExport = () => {
    exportResignationsToCsv(
      filteredRecords,
      `resignation_report_${new Date().toISOString().slice(0, 10)}.csv`
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

