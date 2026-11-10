"use client";

import React, { useState, useMemo } from "react";
import {
  Building2,
  RefreshCw,
  Download,
  Search,
  X,
  Layers,
  ChevronDown,
  Filter,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  CompanyFilterOption,
  IntercompanyEmployeeMasterlistFilters,
} from "../types";

interface EmployeeMasterlistFiltersProps {
  filters: IntercompanyEmployeeMasterlistFilters;
  onChange: React.Dispatch<React.SetStateAction<IntercompanyEmployeeMasterlistFilters>>;
  companies: CompanyFilterOption[];
  departments: string[];
  statuses: string[];
  totalRecords: number;
  loading: boolean;
  onRefresh: () => void;
  onReset: () => void;
  onExport: () => void;
}

export function EmployeeMasterlistFilters({
  filters,
  onChange,
  companies,
  departments,
  statuses,
  totalRecords,
  loading,
  onRefresh,
  onReset,
  onExport,
}: EmployeeMasterlistFiltersProps) {
  const [companyPopoverOpen, setCompanyPopoverOpen] = useState(false);
  const [deptPopoverOpen, setDeptPopoverOpen] = useState(false);

  const [companySearch, setCompanySearch] = useState("");
  const [deptSearch, setDeptSearch] = useState("");

  const filteredCompanies = useMemo(() => {
    if (!companySearch.trim()) return companies;
    const q = companySearch.toLowerCase();
    return companies.filter(
      (c) =>
        c.companyName.toLowerCase().includes(q) ||
        c.companyCode.toLowerCase().includes(q)
    );
  }, [companies, companySearch]);

  const filteredDepartments = useMemo(() => {
    if (!deptSearch.trim()) return departments;
    const q = deptSearch.toLowerCase();
    return departments.filter((d) => d.toLowerCase().includes(q));
  }, [departments, deptSearch]);

  const toggleCompany = (idStr: string) => {
    onChange((prev) => {
      const exists = prev.companyIds.includes(idStr);
      const next = exists
        ? prev.companyIds.filter((i) => i !== idStr)
        : [...prev.companyIds, idStr];
      return { ...prev, companyIds: next };
    });
  };

  const toggleDepartment = (dept: string) => {
    onChange((prev) => {
      const exists = prev.departments.includes(dept);
      const next = exists
        ? prev.departments.filter((d) => d !== dept)
        : [...prev.departments, dept];
      return { ...prev, departments: next };
    });
  };

  const hasActiveFilter =
    filters.companyIds.length > 0 ||
    filters.departments.length > 0 ||
    filters.employmentStatus !== "ALL" ||
    filters.rosterStatus !== "ACTIVE" ||
    filters.gender !== "ALL" ||
    Boolean(filters.search.trim());

  const companyTriggerLabel = useMemo(() => {
    if (filters.companyIds.length === 0) return "All Companies";
    if (filters.companyIds.length === 1) {
      const found = companies.find((c) => String(c.companyId) === filters.companyIds[0]);
      return found ? `${found.companyCode} - ${found.companyName}` : "1 Company";
    }
    return `${filters.companyIds.length} Companies Selected`;
  }, [filters.companyIds, companies]);

  const deptTriggerLabel = useMemo(() => {
    if (filters.departments.length === 0) return "All Departments";
    if (filters.departments.length === 1) return filters.departments[0];
    return `${filters.departments.length} Departments Selected`;
  }, [filters.departments]);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xs p-4 space-y-3.5 transition-colors">
      {/* Top Row: Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <Users className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                Intercompany Employee Masterlist
              </h2>
              <Badge
                variant="secondary"
                className="text-[10px] font-mono bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20"
              >
                {totalRecords.toLocaleString()} Employees
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Consolidated workforce directory, employment status, and tenure across all operating entities
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasActiveFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <X className="h-3.5 w-3.5" />
              Reset Filters
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-8 text-xs gap-1.5 border-border bg-background hover:bg-muted"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-cyan-500" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={onExport}
            disabled={loading || totalRecords === 0}
            className="h-8 text-xs gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white dark:bg-cyan-600 dark:hover:bg-cyan-500"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Filter Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
        {/* 1. Search Input */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search name, ID, biometric, position, email, city..."
            value={filters.search}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, search: e.target.value }))
            }
            className="h-9 pl-8 pr-8 text-xs bg-background border-border"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, search: "" }))}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* 2. Multi-Company Selector */}
        <Popover open={companyPopoverOpen} onOpenChange={setCompanyPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-full justify-between text-xs font-normal border-border bg-background hover:bg-muted px-3"
            >
              <span className="flex items-center gap-1.5 truncate">
                <Building2 className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
                <span className="truncate">{companyTriggerLabel}</span>
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2.5 bg-popover border-border shadow-xl rounded-xl" align="start">
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-foreground">Filter by Company</span>
                {filters.companyIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onChange((prev) => ({ ...prev, companyIds: [] }))}
                    className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    Clear ({filters.companyIds.length})
                  </button>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Search company..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="h-7 pl-7 text-xs bg-background border-border"
                />
              </div>

              <ScrollArea className="h-48 pr-2">
                <div className="space-y-1">
                  {filteredCompanies.map((c) => {
                    const idStr = String(c.companyId);
                    const checked = filters.companyIds.includes(idStr);
                    return (
                      <label
                        key={c.companyId}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-muted transition-colors"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleCompany(idStr)}
                        />
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                          {c.companyCode}
                        </span>
                        <span className="truncate text-foreground">{c.companyName}</span>
                      </label>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </PopoverContent>
        </Popover>

        {/* 3. Multi-Department Selector */}
        <Popover open={deptPopoverOpen} onOpenChange={setDeptPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-full justify-between text-xs font-normal border-border bg-background hover:bg-muted px-3"
            >
              <span className="flex items-center gap-1.5 truncate">
                <Layers className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                <span className="truncate">{deptTriggerLabel}</span>
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2.5 bg-popover border-border shadow-xl rounded-xl" align="start">
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-foreground">Filter by Department</span>
                {filters.departments.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onChange((prev) => ({ ...prev, departments: [] }))}
                    className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    Clear ({filters.departments.length})
                  </button>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Search department..."
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  className="h-7 pl-7 text-xs bg-background border-border"
                />
              </div>

              <ScrollArea className="h-48 pr-2">
                <div className="space-y-1">
                  {filteredDepartments.map((dept) => {
                    const checked = filters.departments.includes(dept);
                    return (
                      <label
                        key={dept}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-muted transition-colors"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleDepartment(dept)}
                        />
                        <span className="truncate text-foreground">{dept}</span>
                      </label>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </PopoverContent>
        </Popover>

        {/* 4. Employment Status Filter */}
        <Select
          value={filters.employmentStatus}
          onValueChange={(val) =>
            onChange((prev) => ({ ...prev, employmentStatus: val }))
          }
        >
          <SelectTrigger className="h-9 text-xs bg-background border-border">
            <div className="flex items-center gap-1.5 truncate">
              <Filter className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <SelectValue placeholder="All Employment Statuses" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="ALL" className="text-xs">
              All Employment Statuses
            </SelectItem>
            {statuses.map((st) => (
              <SelectItem key={st} value={st} className="text-xs">
                {st}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 5. Roster Status Filter (Active / Separated / All) */}
        <Select
          value={filters.rosterStatus}
          onValueChange={(val) =>
            onChange((prev) => ({
              ...prev,
              rosterStatus: val as "ACTIVE" | "SEPARATED" | "ALL",
            }))
          }
        >
          <SelectTrigger className="h-9 text-xs bg-background border-border">
            <SelectValue placeholder="Roster Status" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="ACTIVE" className="text-xs">
              Active Employees Only
            </SelectItem>
            <SelectItem value="ALL" className="text-xs">
              All Employees (Incl. Separated)
            </SelectItem>
            <SelectItem value="SEPARATED" className="text-xs">
              Separated / Inactive Only
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

