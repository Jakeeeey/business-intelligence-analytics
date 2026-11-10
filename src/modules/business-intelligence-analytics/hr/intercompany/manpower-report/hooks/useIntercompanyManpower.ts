import { useState, useEffect, useMemo, useCallback } from "react";
import {
  IntercompanyManpowerData,
  IntercompanyManpowerKpis,
  ManpowerFilters,
} from "../types";
import { fetchIntercompanyManpowerData } from "../providers/fetchProvider";
import { exportManpowerToCsv } from "../utils/exportCsv";

export type SortField =
  | "createdAt"
  | "requestNo"
  | "position"
  | "companyName"
  | "department"
  | "division"
  | "noManpowerNeeded"
  | "rate"
  | "status"
  | "fulfillmentRate";

export type SortOrder = "asc" | "desc";

export function useIntercompanyManpower() {
  const [data, setData] = useState<IntercompanyManpowerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [filters, setFilters] = useState<ManpowerFilters>({
    company: "ALL",
    department: "ALL",
    division: "ALL",
    status: "ALL",
    purpose: "ALL",
    employmentType: "ALL",
    startDate: "",
    endDate: "",
    search: "",
  });

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Load data
  const loadData = useCallback(async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchIntercompanyManpowerData(force);
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load manpower data";
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

      // Division filter
      if (filters.division !== "ALL" && rec.division !== filters.division) {
        return false;
      }

      // Status filter
      if (filters.status !== "ALL" && rec.status !== filters.status) {
        return false;
      }

      // Purpose filter
      if (filters.purpose !== "ALL" && rec.purpose !== filters.purpose) {
        return false;
      }

      // Employment Type filter
      if (filters.employmentType !== "ALL" && rec.employmentType !== filters.employmentType) {
        return false;
      }

      // Date range filter
      if (filters.startDate) {
        const reqDate = rec.createdAt.slice(0, 10);
        if (reqDate < filters.startDate) return false;
      }
      if (filters.endDate) {
        const reqDate = rec.createdAt.slice(0, 10);
        if (reqDate > filters.endDate) return false;
      }

      // Search term
      if (filters.search.trim()) {
        const term = filters.search.toLowerCase();
        const matchesNo = rec.requestNo.toLowerCase().includes(term);
        const matchesPosition = rec.position.toLowerCase().includes(term);
        const matchesDept = rec.department.toLowerCase().includes(term);
        const matchesDiv = rec.division.toLowerCase().includes(term);
        const matchesCompany = rec.companyName.toLowerCase().includes(term) || rec.companyCode.toLowerCase().includes(term);
        const matchesJustification = rec.reasonJustification ? rec.reasonJustification.toLowerCase().includes(term) : false;
        const matchesRequestor = rec.requestedByName ? rec.requestedByName.toLowerCase().includes(term) : false;
        const matchesReplacement = rec.replacementName ? rec.replacementName.toLowerCase().includes(term) : false;

        if (
          !matchesNo &&
          !matchesPosition &&
          !matchesDept &&
          !matchesDiv &&
          !matchesCompany &&
          !matchesJustification &&
          !matchesRequestor &&
          !matchesReplacement
        ) {
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
        case "createdAt":
          valA = new Date(a.createdAt).getTime() || 0;
          valB = new Date(b.createdAt).getTime() || 0;
          break;
        case "requestNo":
          valA = a.requestNo.toLowerCase();
          valB = b.requestNo.toLowerCase();
          break;
        case "position":
          valA = a.position.toLowerCase();
          valB = b.position.toLowerCase();
          break;
        case "companyName":
          valA = a.companyName.toLowerCase();
          valB = b.companyName.toLowerCase();
          break;
        case "department":
          valA = a.department.toLowerCase();
          valB = b.department.toLowerCase();
          break;
        case "division":
          valA = a.division.toLowerCase();
          valB = b.division.toLowerCase();
          break;
        case "noManpowerNeeded":
          valA = a.noManpowerNeeded;
          valB = b.noManpowerNeeded;
          break;
        case "rate":
          valA = a.rate;
          valB = b.rate;
          break;
        case "fulfillmentRate":
          valA = a.fulfillmentRate;
          valB = b.fulfillmentRate;
          break;
        case "status":
          valA = a.status.toLowerCase();
          valB = b.status.toLowerCase();
          break;
        default:
          valA = a.requestId;
          valB = b.requestId;
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
  const dynamicKpis = useMemo<IntercompanyManpowerKpis>(() => {
    if (!data) {
      return {
        totalRequests: 0,
        totalHeadcountNeeded: 0,
        totalHeadcountHired: 0,
        approvedCount: 0,
        draftCount: 0,
        rejectedCount: 0,
        overallApprovalRate: 0,
        overallFulfillmentRate: 0,
        totalBudgetCost: 0,
        activeCompaniesCount: 0,
        totalCompaniesCount: 0,
        companiesWithRequestsCount: 0,
        topRequestingDepartment: "None",
        topRequestingCompany: "None",
        predominantPurpose: "None",
      };
    }

    const count = filteredRecords.length;
    const approved = filteredRecords.filter((r) => r.status === "Approved").length;
    const draft = filteredRecords.filter((r) => r.status === "Draft").length;
    const rejected = filteredRecords.filter((r) => r.status === "Rejected").length;

    const needed = filteredRecords.reduce((sum, r) => sum + r.noManpowerNeeded, 0);
    const hired = filteredRecords.reduce((sum, r) => sum + r.hiredCount, 0);
    const budget = filteredRecords.reduce((sum, r) => sum + r.totalEstimatedBudget, 0);

    const approvalRate = count > 0 ? Math.round((approved / count) * 100) : 0;
    const fulfillmentRate = needed > 0 ? Math.round((hired / needed) * 100) : 0;

    const companiesWithData = new Set(filteredRecords.map((r) => r.companyCode)).size;

    // Predominant purpose
    const purposeCounts = new Map<string, number>();
    filteredRecords.forEach((r) => {
      purposeCounts.set(r.purpose, (purposeCounts.get(r.purpose) || 0) + 1);
    });
    let topPurpose = "None";
    let maxPurpose = 0;
    purposeCounts.forEach((c, p) => {
      if (c > maxPurpose) {
        maxPurpose = c;
        topPurpose = p;
      }
    });

    // Top requesting department
    const deptHeadcounts = new Map<string, number>();
    filteredRecords.forEach((r) => {
      deptHeadcounts.set(r.department, (deptHeadcounts.get(r.department) || 0) + r.noManpowerNeeded);
    });
    let topDept = "None";
    let maxDeptHeadcount = 0;
    deptHeadcounts.forEach((hc, d) => {
      if (hc > maxDeptHeadcount) {
        maxDeptHeadcount = hc;
        topDept = d;
      }
    });

    return {
      totalRequests: count,
      totalHeadcountNeeded: needed,
      totalHeadcountHired: hired,
      approvedCount: approved,
      draftCount: draft,
      rejectedCount: rejected,
      overallApprovalRate: approvalRate,
      overallFulfillmentRate: fulfillmentRate,
      totalBudgetCost: budget,
      activeCompaniesCount: data.kpis.activeCompaniesCount,
      totalCompaniesCount: data.kpis.totalCompaniesCount,
      companiesWithRequestsCount: companiesWithData,
      topRequestingDepartment: topDept !== "None" ? topDept : data.kpis.topRequestingDepartment,
      topRequestingCompany: data.kpis.topRequestingCompany,
      predominantPurpose: topPurpose !== "None" ? topPurpose : data.kpis.predominantPurpose,
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
      division: "ALL",
      status: "ALL",
      purpose: "ALL",
      employmentType: "ALL",
      startDate: "",
      endDate: "",
      search: "",
    });
    setPage(1);
  };

  const handleExport = () => {
    exportManpowerToCsv(
      filteredRecords,
      `manpower_report_${new Date().toISOString().slice(0, 10)}.csv`
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

