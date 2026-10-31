"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  IntercompanyEmployeeMasterlistData,
  IntercompanyEmployeeMasterlistFilters,
  IntercompanyEmployeeMasterlistRecord,
  IntercompanyEmployeeMasterlistKpis,
  CompanyMasterlistSummary,
  DepartmentMasterlistSummary,
  DistributionSegment,
  TenureDistributionPoint,
  EmployeeMasterlistSortField,
  EmployeeMasterlistSortOrder,
} from "../types";
import { fetchIntercompanyEmployeeMasterlistData } from "../providers/fetchProvider";

const DEFAULT_FILTERS: IntercompanyEmployeeMasterlistFilters = {
  companyIds: [],
  departments: [],
  employmentStatus: "ALL",
  rosterStatus: "ACTIVE",
  gender: "ALL",
  search: "",
};

export function useIntercompanyEmployeeMasterlist() {
  const [data, setData] = useState<IntercompanyEmployeeMasterlistData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] =
    useState<IntercompanyEmployeeMasterlistFilters>(DEFAULT_FILTERS);
  const [sortField, setSortField] = useState<EmployeeMasterlistSortField>("name");
  const [sortOrder, setSortOrder] = useState<EmployeeMasterlistSortOrder>("asc");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const [selectedRecord, setSelectedRecord] =
    useState<IntercompanyEmployeeMasterlistRecord | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);

  const loadData = useCallback(async (opts?: { force?: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchIntercompanyEmployeeMasterlistData({
        force: opts?.force,
      });
      setData(res);
    } catch (err: unknown) {
      console.error("[useIntercompanyEmployeeMasterlist Error]", err);
      const msg =
        err instanceof Error ? err.message : "Failed to load employee masterlist";
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
      // 1. Roster Status filter
      if (filters.rosterStatus === "ACTIVE" && rec.rosterStatus !== "Active") {
        return false;
      }
      if (filters.rosterStatus === "SEPARATED" && rec.rosterStatus !== "Separated") {
        return false;
      }

      // 2. Multi-Company filter
      if (filters.companyIds && filters.companyIds.length > 0) {
        if (!filters.companyIds.includes(String(rec.companyId))) {
          return false;
        }
      }

      // 3. Multi-Department filter
      if (filters.departments && filters.departments.length > 0) {
        if (!filters.departments.includes(rec.department)) {
          return false;
        }
      }

      // 4. Employment Status filter
      if (filters.employmentStatus !== "ALL") {
        if (rec.employmentStatus !== filters.employmentStatus) {
          return false;
        }
      }

      // 5. Gender filter
      if (filters.gender !== "ALL") {
        if (rec.gender !== filters.gender) {
          return false;
        }
      }

      // 6. Search query
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const matchName = rec.name.toLowerCase().includes(q);
        const matchEmpId = rec.employeeId.toLowerCase().includes(q);
        const matchBioId = (rec.biometricId || "").toLowerCase().includes(q);
        const matchRfId = (rec.rfId || "").toLowerCase().includes(q);
        const matchCompany =
          rec.companyName.toLowerCase().includes(q) ||
          rec.companyCode.toLowerCase().includes(q);
        const matchDept = rec.department.toLowerCase().includes(q);
        const matchPos = rec.position.toLowerCase().includes(q);
        const matchEmail = (rec.email || "").toLowerCase().includes(q);
        const matchContact = (rec.contact || "").toLowerCase().includes(q);
        const matchLoc =
          (rec.city || "").toLowerCase().includes(q) ||
          (rec.province || "").toLowerCase().includes(q);

        if (
          !matchName &&
          !matchEmpId &&
          !matchBioId &&
          !matchRfId &&
          !matchCompany &&
          !matchDept &&
          !matchPos &&
          !matchEmail &&
          !matchContact &&
          !matchLoc
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
      filters.employmentStatus !== "ALL" ||
      filters.rosterStatus !== "ACTIVE" ||
      filters.gender !== "ALL" ||
      Boolean(filters.search.trim())
    );
  }, [filters]);

  // Dynamic Filtered KPIs
  const filteredKpis = useMemo<IntercompanyEmployeeMasterlistKpis | null>(() => {
    if (!data?.kpis) return null;
    if (!hasActiveFilter) return data.kpis;

    const currentYear = new Date().getFullYear();
    const uniqueCos = new Set<number>();
    const uniqueDepts = new Set<string>();
    const compHeadcount = new Map<string, number>();

    let activeCount = 0;
    let separatedCount = 0;
    let regularCount = 0;
    let probationaryCount = 0;
    let otherStatusCount = 0;
    let newHiresThisYear = 0;
    let deptHeadsCount = 0;
    let tenureMonthsSum = 0;
    let maleCount = 0;
    let femaleCount = 0;

    filteredRecords.forEach((r) => {
      uniqueCos.add(r.companyId);
      uniqueDepts.add(r.department);
      compHeadcount.set(r.companyName, (compHeadcount.get(r.companyName) || 0) + 1);

      if (r.rosterStatus === "Active") {
        activeCount++;
      } else {
        separatedCount++;
      }

      const stLower = r.employmentStatus.toLowerCase();
      if (stLower.includes("regular")) regularCount++;
      else if (stLower.includes("probation")) probationaryCount++;
      else otherStatusCount++;

      if (r.dateOfHire && new Date(r.dateOfHire).getFullYear() === currentYear) {
        newHiresThisYear++;
      }

      if (r.isDepartmentHead) deptHeadsCount++;
      tenureMonthsSum += r.tenureMonths || 0;

      if (r.gender === "Male") maleCount++;
      else if (r.gender === "Female") femaleCount++;
    });

    const total = filteredRecords.length;
    const avgTenureYears =
      total > 0 ? parseFloat((tenureMonthsSum / (total * 12)).toFixed(1)) : 0;

    let largestCompanyName = "N/A";
    let largestCompanyCount = 0;
    compHeadcount.forEach((cnt, cName) => {
      if (cnt > largestCompanyCount) {
        largestCompanyCount = cnt;
        largestCompanyName = cName;
      }
    });

    return {
      totalEmployees: total,
      totalRosterRecords: data.kpis.totalRosterRecords,
      activeEmployeesCount: activeCount,
      separatedEmployeesCount: separatedCount,
      regularCount,
      probationaryCount,
      otherStatusCount,
      newHiresThisYear,
      departmentHeadsCount: deptHeadsCount,
      avgTenureYears,
      maleCount,
      femaleCount,
      activeCompaniesCount: uniqueCos.size,
      totalCompaniesCount: data.kpis.totalCompaniesCount,
      totalDepartmentsCount: uniqueDepts.size,
      largestCompanyName,
      largestCompanyCount,
    };
  }, [data, hasActiveFilter, filteredRecords]);

  // Dynamic Filtered Company Summaries
  const filteredCompanySummaries = useMemo<CompanyMasterlistSummary[]>(() => {
    if (!data?.companySummaries) return [];
    if (!hasActiveFilter) return data.companySummaries;

    const currentYear = new Date().getFullYear();
    const compMap = new Map<
      number,
      {
        companyName: string;
        companyCode: string;
        total: number;
        active: number;
        separated: number;
        regular: number;
        probationary: number;
        other: number;
        newHires: number;
        depts: Set<string>;
        tenureMonths: number;
        male: number;
        female: number;
      }
    >();

    filteredRecords.forEach((r) => {
      const cur = compMap.get(r.companyId) || {
        companyName: r.companyName,
        companyCode: r.companyCode,
        total: 0,
        active: 0,
        separated: 0,
        regular: 0,
        probationary: 0,
        other: 0,
        newHires: 0,
        depts: new Set<string>(),
        tenureMonths: 0,
        male: 0,
        female: 0,
      };

      cur.total++;
      if (r.rosterStatus === "Active") cur.active++;
      else cur.separated++;

      const stLower = r.employmentStatus.toLowerCase();
      if (stLower.includes("regular")) cur.regular++;
      else if (stLower.includes("probation")) cur.probationary++;
      else cur.other++;

      if (r.dateOfHire && new Date(r.dateOfHire).getFullYear() === currentYear) {
        cur.newHires++;
      }

      cur.depts.add(r.department);
      cur.tenureMonths += r.tenureMonths || 0;
      if (r.gender === "Male") cur.male++;
      else if (r.gender === "Female") cur.female++;

      compMap.set(r.companyId, cur);
    });

    const totalFiltered = filteredRecords.length;
    const result: CompanyMasterlistSummary[] = [];

    compMap.forEach((c, cid) => {
      result.push({
        companyId: cid,
        companyName: c.companyName,
        companyCode: c.companyCode,
        status: "ACTIVE",
        totalEmployees: c.total,
        activeCount: c.active,
        separatedCount: c.separated,
        regularCount: c.regular,
        probationaryCount: c.probationary,
        otherStatusCount: c.other,
        newHiresThisYear: c.newHires,
        departmentCount: c.depts.size,
        avgTenureYears:
          c.total > 0 ? parseFloat((c.tenureMonths / (c.total * 12)).toFixed(1)) : 0,
        maleCount: c.male,
        femaleCount: c.female,
        headcountSharePct:
          totalFiltered > 0 ? Math.round((c.total / totalFiltered) * 100) : 0,
      });
    });

    return result.sort((a, b) => b.totalEmployees - a.totalEmployees);
  }, [data?.companySummaries, hasActiveFilter, filteredRecords]);

  // Dynamic Filtered Department Summaries
  const filteredDepartmentSummaries = useMemo<DepartmentMasterlistSummary[]>(() => {
    if (!data?.departmentSummaries) return [];
    if (!hasActiveFilter) return data.departmentSummaries;

    const deptMap = new Map<
      string,
      { total: number; regular: number; probationary: number; cos: Set<number> }
    >();

    filteredRecords.forEach((r) => {
      const cur = deptMap.get(r.department) || {
        total: 0,
        regular: 0,
        probationary: 0,
        cos: new Set<number>(),
      };
      cur.total++;
      const stLower = r.employmentStatus.toLowerCase();
      if (stLower.includes("regular")) cur.regular++;
      else if (stLower.includes("probation")) cur.probationary++;
      cur.cos.add(r.companyId);
      deptMap.set(r.department, cur);
    });

    const total = filteredRecords.length;
    const result: DepartmentMasterlistSummary[] = [];
    deptMap.forEach((v, dept) => {
      result.push({
        department: dept,
        totalEmployees: v.total,
        regularCount: v.regular,
        probationaryCount: v.probationary,
        companiesCount: v.cos.size,
        percentage: total > 0 ? Math.round((v.total / total) * 100) : 0,
      });
    });

    return result.sort((a, b) => b.totalEmployees - a.totalEmployees);
  }, [data?.departmentSummaries, hasActiveFilter, filteredRecords]);

  // Dynamic Filtered Gender Distribution
  const filteredGenderDistribution = useMemo<DistributionSegment[]>(() => {
    if (!data?.genderDistribution) return [];
    if (!hasActiveFilter) return data.genderDistribution;

    const gMap = new Map<string, number>();
    filteredRecords.forEach((r) => {
      gMap.set(r.gender, (gMap.get(r.gender) || 0) + 1);
    });

    const total = filteredRecords.length;
    const genderColorMap: Record<string, string> = {
      Male: "#3b82f6",
      Female: "#ec4899",
      Other: "#8b5cf6",
    };

    return Array.from(gMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: genderColorMap[name] || "#06b6d4",
      }))
      .sort((a, b) => b.count - a.count);
  }, [data?.genderDistribution, hasActiveFilter, filteredRecords]);

  // Dynamic Filtered Status Distribution
  const filteredStatusDistribution = useMemo<DistributionSegment[]>(() => {
    if (!data?.statusDistribution) return [];
    if (!hasActiveFilter) return data.statusDistribution;

    const sMap = new Map<string, number>();
    filteredRecords.forEach((r) => {
      sMap.set(r.employmentStatus, (sMap.get(r.employmentStatus) || 0) + 1);
    });

    const total = filteredRecords.length;
    const statusPalette = ["#10b981", "#f59e0b", "#06b6d4", "#8b5cf6", "#f97316", "#ec4899"];

    return Array.from(sMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], idx) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: statusPalette[idx % statusPalette.length],
      }));
  }, [data?.statusDistribution, hasActiveFilter, filteredRecords]);

  // Dynamic Filtered Tenure Distribution
  const filteredTenureDistribution = useMemo<TenureDistributionPoint[]>(() => {
    if (!data?.tenureDistribution) return [];
    if (!hasActiveFilter) return data.tenureDistribution;

    const brackets = [
      { range: "< 1 Year", min: 0, max: 1, count: 0 },
      { range: "1 - 2 Years", min: 1, max: 3, count: 0 },
      { range: "3 - 5 Years", min: 3, max: 6, count: 0 },
      { range: "> 5 Years", min: 6, max: 999, count: 0 },
    ];

    filteredRecords.forEach((r) => {
      const y = r.tenureYears;
      const b =
        brackets.find((br) => y >= br.min && y < br.max) ||
        brackets[brackets.length - 1];
      b.count++;
    });

    const total = filteredRecords.length;
    return brackets.map((b) => ({
      range: b.range,
      count: b.count,
      percentage: total > 0 ? Math.round((b.count / total) * 100) : 0,
    }));
  }, [data?.tenureDistribution, hasActiveFilter, filteredRecords]);

  // Client-side sorting
  const sortedRecords = useMemo(() => {
    const list = [...filteredRecords];

    list.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "employeeId":
          comparison = a.employeeId.localeCompare(b.employeeId);
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
        case "position":
          comparison = a.position.localeCompare(b.position);
          break;
        case "employmentStatus":
          comparison = a.employmentStatus.localeCompare(b.employmentStatus);
          break;
        case "dateOfHire":
          comparison = (a.dateOfHire || "9999-99-99").localeCompare(
            b.dateOfHire || "9999-99-99"
          );
          break;
        case "tenureYears":
          comparison = a.tenureYears - b.tenureYears;
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

  const handleSort = (field: EmployeeMasterlistSortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder(field === "tenureYears" ? "desc" : "asc");
    }
    setPage(1);
  };

  const handleOpenDetail = (record: IntercompanyEmployeeMasterlistRecord) => {
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
    filteredGenderDistribution,
    filteredStatusDistribution,
    filteredTenureDistribution,
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

