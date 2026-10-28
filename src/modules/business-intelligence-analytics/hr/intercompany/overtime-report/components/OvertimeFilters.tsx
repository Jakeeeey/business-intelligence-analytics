"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  Building2,
  RefreshCw,
  Download,
  Search,
  X,
  Layers,
  ChevronDown,
  Filter,
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
  IntercompanyOvertimeFilters,
} from "../types";

interface OvertimeFiltersProps {
  filters: IntercompanyOvertimeFilters;
  onChange: React.Dispatch<React.SetStateAction<IntercompanyOvertimeFilters>>;
  companies: CompanyFilterOption[];
  departments: string[];
  totalRecords: number;
  loading: boolean;
  onRefresh: () => void;
  onReset: () => void;
  onExport: () => void;
}

function formatDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function OvertimeFilters({
  filters,
  onChange,
  companies,
  departments,
  totalRecords,
  loading,
  onRefresh,
  onReset,
  onExport,
}: OvertimeFiltersProps) {
  const todayStr = useMemo(() => formatDateString(new Date()), []);

  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [companyPopoverOpen, setCompanyPopoverOpen] = useState(false);
  const [deptPopoverOpen, setDeptPopoverOpen] = useState(false);

  // Temporary date draft state
  const [tempStartDate, setTempStartDate] = useState(filters.startDate);
  const [tempEndDate, setTempEndDate] = useState(filters.endDate);
  const [selectedMultiDates, setSelectedMultiDates] = useState<string[]>(
    filters.dates || []
  );
  const [isMultiDateMode, setIsMultiDateMode] = useState<boolean>(
    Boolean(filters.dates && filters.dates.length > 0)
  );

  // Search input inside popovers
  const [companySearch, setCompanySearch] = useState("");
  const [deptSearch, setDeptSearch] = useState("");

  const filteredCompanyList = useMemo(() => {
    if (!companySearch.trim()) return companies;
    const q = companySearch.toLowerCase();
    return companies.filter(
      (c) =>
        c.companyName.toLowerCase().includes(q) ||
        c.companyCode.toLowerCase().includes(q)
    );
  }, [companies, companySearch]);

  const filteredDeptList = useMemo(() => {
    if (!deptSearch.trim()) return departments;
    const q = deptSearch.toLowerCase();
    return departments.filter((d) => d.toLowerCase().includes(q));
  }, [departments, deptSearch]);

  const handleApplyDates = () => {
    if (isMultiDateMode && selectedMultiDates.length > 0) {
      const sorted = [...selectedMultiDates].sort();
      onChange((prev) => ({
        ...prev,
        startDate: sorted[0],
        endDate: sorted[sorted.length - 1],
        dates: sorted,
      }));
    } else {
      onChange((prev) => ({
        ...prev,
        startDate: tempStartDate,
        endDate: tempEndDate,
        dates: undefined,
      }));
    }
    setDatePopoverOpen(false);
  };

  const handleSelectPreset = (preset: "today" | "yesterday" | "last7" | "thisMonth" | "lastMonth") => {
    const now = new Date();
    setIsMultiDateMode(false);
    setSelectedMultiDates([]);

    if (preset === "today") {
      setTempStartDate(todayStr);
      setTempEndDate(todayStr);
    } else if (preset === "yesterday") {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = formatDateString(y);
      setTempStartDate(yStr);
      setTempEndDate(yStr);
    } else if (preset === "last7") {
      const past = new Date();
      past.setDate(past.getDate() - 6);
      setTempStartDate(formatDateString(past));
      setTempEndDate(todayStr);
    } else if (preset === "thisMonth") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setTempStartDate(formatDateString(start));
      setTempEndDate(todayStr);
    } else if (preset === "lastMonth") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setTempStartDate(formatDateString(start));
      setTempEndDate(formatDateString(end));
    }
  };

  const toggleMultiDate = (dStr: string) => {
    setSelectedMultiDates((prev) => {
      if (prev.includes(dStr)) {
        return prev.filter((d) => d !== dStr);
      }
      return [...prev, dStr].sort();
    });
  };

  const handleToggleCompany = (companyIdStr: string) => {
    onChange((prev) => {
      const current = prev.companyIds || [];
      const updated = current.includes(companyIdStr)
        ? current.filter((id) => id !== companyIdStr)
        : [...current, companyIdStr];
      return { ...prev, companyIds: updated };
    });
  };

  const handleSelectAllCompanies = () => {
    onChange((prev) => ({
      ...prev,
      companyIds: companies.map((c) => String(c.companyId)),
    }));
  };

  const handleClearCompanies = () => {
    onChange((prev) => ({
      ...prev,
      companyIds: [],
    }));
  };

  const handleToggleDept = (dept: string) => {
    onChange((prev) => {
      const current = prev.departments || [];
      const updated = current.includes(dept)
        ? current.filter((d) => d !== dept)
        : [...current, dept];
      return { ...prev, departments: updated };
    });
  };

  const handleSelectAllDepts = () => {
    onChange((prev) => ({
      ...prev,
      departments: [...departments],
    }));
  };

  const handleClearDepts = () => {
    onChange((prev) => ({
      ...prev,
      departments: [],
    }));
  };

  const hasActiveFilters = Boolean(
    (filters.companyIds && filters.companyIds.length > 0) ||
      (filters.departments && filters.departments.length > 0) ||
      filters.status !== "ALL" ||
      filters.search.trim()
  );

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm space-y-4">
      {/* Top row: search & primary filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search employee, ID, reason, position..."
            value={filters.search}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, search: e.target.value }))
            }
            className="pl-9 pr-8 h-9 text-xs rounded-xl bg-muted/40 border-border/80 focus:bg-background"
          />
          {filters.search && (
            <button
              onClick={() => onChange((prev) => ({ ...prev, search: "" }))}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-9 text-xs text-muted-foreground hover:text-foreground rounded-xl"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Reset Filters
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-9 text-xs rounded-xl border-border/80"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="h-9 text-xs rounded-xl border-border/80 hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter controls row */}
      <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-border/50 text-xs">
        {/* 1. Date Range & Multi-Date Filter */}
        <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs rounded-xl border-border/80 font-normal bg-background hover:bg-muted/50"
            >
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
              {filters.dates && filters.dates.length > 0
                ? `${filters.dates.length} Dates Selected`
                : filters.startDate === filters.endDate
                ? filters.startDate
                : `${filters.startDate} → ${filters.endDate}`}
              <ChevronDown className="h-3 w-3 ml-1.5 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 rounded-2xl shadow-xl space-y-3" align="start">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="font-semibold text-xs text-foreground">
                Date Selection
              </span>
              <button
                type="button"
                onClick={() => setIsMultiDateMode((prev) => !prev)}
                className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                  isMultiDateMode
                    ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isMultiDateMode ? "✓ Multiple Dates" : "+ Multiple Dates"}
              </button>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleSelectPreset("today")}
                className="px-2 py-1 text-[11px] rounded-lg border border-border/60 hover:bg-muted font-medium text-left"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset("yesterday")}
                className="px-2 py-1 text-[11px] rounded-lg border border-border/60 hover:bg-muted font-medium text-left"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset("last7")}
                className="px-2 py-1 text-[11px] rounded-lg border border-border/60 hover:bg-muted font-medium text-left"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset("thisMonth")}
                className="px-2 py-1 text-[11px] rounded-lg border border-border/60 hover:bg-muted font-medium text-left col-span-2"
              >
                This Month (MTD)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset("lastMonth")}
                className="px-2 py-1 text-[11px] rounded-lg border border-border/60 hover:bg-muted font-medium text-left"
              >
                Last Month
              </button>
            </div>

            {/* Inputs based on mode */}
            {!isMultiDateMode ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-1">
                    Start Date
                  </span>
                  <Input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="h-8 text-xs rounded-lg"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-1">
                    End Date
                  </span>
                  <Input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    className="h-8 text-xs rounded-lg"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] text-muted-foreground block">
                  Click dates to toggle selection:
                </span>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-1 border rounded-lg bg-muted/20">
                  {selectedMultiDates.length === 0 ? (
                    <span className="text-[11px] text-muted-foreground p-2">
                      No multiple dates selected yet.
                    </span>
                  ) : (
                    selectedMultiDates.map((d) => (
                      <span
                        key={d}
                        onClick={() => toggleMultiDate(d)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 cursor-pointer font-mono"
                      >
                        {d}
                        <X className="h-2.5 w-2.5" />
                      </span>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    id="datePickerInput"
                    onChange={(e) => {
                      if (e.target.value) toggleMultiDate(e.target.value);
                    }}
                    className="h-8 text-xs rounded-lg flex-1"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDatePopoverOpen(false)}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApplyDates}
                className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Apply Range
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* 2. Multi-Company Popover */}
        <Popover open={companyPopoverOpen} onOpenChange={setCompanyPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs rounded-xl border-border/80 font-normal bg-background hover:bg-muted/50"
            >
              <Building2 className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
              Subsidiaries
              {filters.companyIds && filters.companyIds.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1.5 h-4 px-1.5 text-[10px] bg-blue-500/15 text-blue-700 dark:text-blue-300 font-mono"
                >
                  {filters.companyIds.length}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 ml-1.5 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3 rounded-2xl shadow-xl space-y-2.5" align="start">
            <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
              <span className="font-semibold text-xs text-foreground">
                Filter Subsidiaries
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSelectAllCompanies}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
                >
                  All
                </button>
                <span className="text-muted-foreground text-[10px]">•</span>
                <button
                  type="button"
                  onClick={handleClearCompanies}
                  className="text-[10px] text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
            </div>

            <Input
              type="text"
              placeholder="Search subsidiary..."
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              className="h-7 text-xs rounded-lg"
            />

            <ScrollArea className="h-44 pr-1">
              <div className="space-y-1">
                {filteredCompanyList.map((c) => {
                  const isChecked = filters.companyIds.includes(String(c.companyId));
                  return (
                    <div
                      key={c.companyId}
                      onClick={() => handleToggleCompany(String(c.companyId))}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 cursor-pointer text-xs"
                    >
                      <Checkbox checked={isChecked} />
                      <span className="font-mono font-bold text-[11px] text-foreground">
                        {c.companyCode}
                      </span>
                      <span className="text-muted-foreground truncate text-[11px]">
                        {c.companyName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* 3. Multi-Department Popover */}
        <Popover open={deptPopoverOpen} onOpenChange={setDeptPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs rounded-xl border-border/80 font-normal bg-background hover:bg-muted/50"
            >
              <Layers className="h-3.5 w-3.5 mr-1.5 text-purple-500" />
              Departments
              {filters.departments && filters.departments.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1.5 h-4 px-1.5 text-[10px] bg-purple-500/15 text-purple-700 dark:text-purple-300 font-mono"
                >
                  {filters.departments.length}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 ml-1.5 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3 rounded-2xl shadow-xl space-y-2.5" align="start">
            <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
              <span className="font-semibold text-xs text-foreground">
                Filter Departments
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSelectAllDepts}
                  className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline"
                >
                  All
                </button>
                <span className="text-muted-foreground text-[10px]">•</span>
                <button
                  type="button"
                  onClick={handleClearDepts}
                  className="text-[10px] text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
            </div>

            <Input
              type="text"
              placeholder="Search department..."
              value={deptSearch}
              onChange={(e) => setDeptSearch(e.target.value)}
              className="h-7 text-xs rounded-lg"
            />

            <ScrollArea className="h-44 pr-1">
              <div className="space-y-1">
                {filteredDeptList.map((d) => {
                  const isChecked = filters.departments.includes(d);
                  return (
                    <div
                      key={d}
                      onClick={() => handleToggleDept(d)}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 cursor-pointer text-xs"
                    >
                      <Checkbox checked={isChecked} />
                      <span className="text-foreground truncate text-[11px]">{d}</span>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* 4. Request Status Filter */}
        <Select
          value={filters.status}
          onValueChange={(val) =>
            onChange((prev) => ({ ...prev, status: val }))
          }
        >
          <SelectTrigger className="h-8 text-xs w-[130px] rounded-xl border-border/80 bg-background font-normal">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl text-xs">
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="approved">Approved Only</SelectItem>
            <SelectItem value="pending">Pending Only</SelectItem>
            <SelectItem value="rejected">Rejected Only</SelectItem>
          </SelectContent>
        </Select>

        {/* Active Filters Summary Tag */}
        <div className="ml-auto text-xs text-muted-foreground flex items-center gap-1.5">
          <Filter className="h-3 w-3 text-indigo-500" />
          <span>
            {totalRecords} matching employee{totalRecords === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </div>
  );
}
