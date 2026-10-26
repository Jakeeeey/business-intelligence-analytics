"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  Building2,
  Filter,
  RefreshCw,
  Download,
  Search,
  X,
  Layers,
  ChevronDown,
  Check,
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
  IntercompanyAttendanceFilters,
} from "../types";

interface AttendanceFiltersProps {
  filters: IntercompanyAttendanceFilters;
  onChange: React.Dispatch<React.SetStateAction<IntercompanyAttendanceFilters>>;
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

export function AttendanceFilters({
  filters,
  onChange,
  companies,
  departments,
  totalRecords,
  loading,
  onRefresh,
  onReset,
  onExport,
}: AttendanceFiltersProps) {
  const todayStr = useMemo(() => formatDateString(new Date()), []);

  // Popover state
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [companyPopoverOpen, setCompanyPopoverOpen] = useState(false);
  const [deptPopoverOpen, setDeptPopoverOpen] = useState(false);

  // Search states
  const [companySearch, setCompanySearch] = useState("");
  const [deptSearch, setDeptSearch] = useState("");

  // Temporary date states for custom range editing
  const [tempStartDate, setTempStartDate] = useState(filters.startDate || filters.date || todayStr);
  const [tempEndDate, setTempEndDate] = useState(filters.endDate || filters.date || todayStr);

  useEffect(() => {
    setTempStartDate(filters.startDate || filters.date || todayStr);
    setTempEndDate(filters.endDate || filters.date || todayStr);
  }, [filters.startDate, filters.endDate, filters.date, todayStr]);

  // Total days in selected range
  const totalDaysSelected = useMemo(() => {
    const s = filters.startDate || filters.date || todayStr;
    const e = filters.endDate || filters.date || todayStr;
    const t1 = new Date(s).getTime();
    const t2 = new Date(e).getTime();
    if (isNaN(t1) || isNaN(t2)) return 1;
    return Math.max(1, Math.round(Math.abs(t2 - t1) / (1000 * 60 * 60 * 24)) + 1);
  }, [filters.startDate, filters.endDate, filters.date, todayStr]);

  // Trigger label for Dates
  const dateTriggerLabel = useMemo(() => {
    const s = filters.startDate || filters.date || todayStr;
    const e = filters.endDate || filters.date || todayStr;
    if (s === e) {
      return s === todayStr ? `Today (${s})` : s;
    }
    return `${s} → ${e}`;
  }, [filters.startDate, filters.endDate, filters.date, todayStr]);

  // Quick Preset Handlers
  const handleApplyPreset = (preset: "today" | "yesterday" | "last3" | "last7" | "last14" | "monthToDate") => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case "today":
        start = now;
        end = now;
        break;
      case "yesterday":
        start = new Date(now.getTime() - 86400000);
        end = start;
        break;
      case "last3":
        start = new Date(now.getTime() - 2 * 86400000);
        end = now;
        break;
      case "last7":
        start = new Date(now.getTime() - 6 * 86400000);
        end = now;
        break;
      case "last14":
        start = new Date(now.getTime() - 13 * 86400000);
        end = now;
        break;
      case "monthToDate":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = now;
        break;
    }

    const sStr = formatDateString(start);
    const eStr = formatDateString(end);

    setTempStartDate(sStr);
    setTempEndDate(eStr);

    onChange((prev) => ({
      ...prev,
      date: sStr,
      startDate: sStr,
      endDate: eStr,
      dates: undefined,
    }));
    setDatePopoverOpen(false);
  };

  const handleApplyCustomRange = () => {
    let s = tempStartDate || todayStr;
    let e = tempEndDate || todayStr;
    if (s > e) {
      const temp = s;
      s = e;
      e = temp;
    }
    onChange((prev) => ({
      ...prev,
      date: s,
      startDate: s,
      endDate: e,
      dates: undefined,
    }));
    setDatePopoverOpen(false);
  };

  const handleResetDateToToday = () => {
    handleApplyPreset("today");
  };

  // Filtered list of companies for search within popover
  const filteredCompanies = useMemo(() => {
    if (!companySearch.trim()) return companies;
    const q = companySearch.toLowerCase().trim();
    return companies.filter(
      (c) =>
        c.companyName.toLowerCase().includes(q) ||
        c.companyCode.toLowerCase().includes(q)
    );
  }, [companies, companySearch]);

  // Filtered list of departments for search within popover
  const filteredDepartments = useMemo(() => {
    if (!deptSearch.trim()) return departments;
    const q = deptSearch.toLowerCase().trim();
    return departments.filter((d) => d.toLowerCase().includes(q));
  }, [departments, deptSearch]);

  const selectedCompanyIds = filters.companyIds || [];
  const selectedDepartments = filters.departments || [];

  const handleToggleCompany = (companyIdStr: string) => {
    onChange((prev) => {
      const current = prev.companyIds || [];
      const exists = current.includes(companyIdStr);
      const updated = exists
        ? current.filter((id) => id !== companyIdStr)
        : [...current, companyIdStr];
      return {
        ...prev,
        companyIds: updated,
        companyId: updated.length === 1 ? updated[0] : "ALL",
      };
    });
  };

  const handleSelectAllCompanies = () => {
    const allIds = companies.map((c) => String(c.companyId));
    onChange((prev) => ({
      ...prev,
      companyIds: allIds,
      companyId: "ALL",
    }));
  };

  const handleClearCompanies = () => {
    onChange((prev) => ({
      ...prev,
      companyIds: [],
      companyId: "ALL",
    }));
  };

  const handleToggleDepartment = (dept: string) => {
    onChange((prev) => {
      const current = prev.departments || [];
      const exists = current.includes(dept);
      const updated = exists
        ? current.filter((d) => d !== dept)
        : [...current, dept];
      return {
        ...prev,
        departments: updated,
        department: updated.length === 1 ? updated[0] : "ALL",
      };
    });
  };

  const handleSelectAllDepartments = () => {
    onChange((prev) => ({
      ...prev,
      departments: [...departments],
      department: "ALL",
    }));
  };

  const handleClearDepartments = () => {
    onChange((prev) => ({
      ...prev,
      departments: [],
      department: "ALL",
    }));
  };

  const isDateFiltered =
    (filters.startDate && filters.startDate !== todayStr) ||
    (filters.endDate && filters.endDate !== todayStr);

  const isFiltered =
    isDateFiltered ||
    selectedCompanyIds.length > 0 ||
    selectedDepartments.length > 0 ||
    filters.attendanceStatus !== "ALL" ||
    filters.search.trim().length > 0;

  // Trigger label for Companies
  const companyTriggerLabel = useMemo(() => {
    if (selectedCompanyIds.length === 0) return "All Companies";
    if (selectedCompanyIds.length === 1) {
      const found = companies.find((c) => String(c.companyId) === selectedCompanyIds[0]);
      return found ? `[${found.companyCode}] ${found.companyName}` : "1 Company";
    }
    return `${selectedCompanyIds.length} Companies Selected`;
  }, [selectedCompanyIds, companies]);

  // Trigger label for Departments
  const deptTriggerLabel = useMemo(() => {
    if (selectedDepartments.length === 0) return "All Departments";
    if (selectedDepartments.length === 1) return selectedDepartments[0];
    return `${selectedDepartments.length} Departments Selected`;
  }, [selectedDepartments]);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs transition-colors">
      <div className="flex flex-col gap-4">
        {/* Top Row: Date, Company, Department, Status, Actions */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Left Title / Badge */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Intercompany Attendance Filter
                </h2>
                <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  {totalRecords.toLocaleString()} Records
                </span>
                {totalDaysSelected > 1 && (
                  <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    {totalDaysSelected} Log Dates
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Consolidated multi-company, multi-department & multi-date workforce monitoring
              </p>
            </div>
          </div>

          {/* Action Buttons: Refresh & Export */}
          <div className="flex items-center gap-2 self-start xl:self-auto">
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="h-9 gap-1.5 text-xs border-border bg-background hover:bg-muted font-medium"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-cyan-500" : ""}`} />
              <span>Sync</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={onExport}
              disabled={loading || totalRecords === 0}
              className="h-9 gap-1.5 text-xs font-semibold shadow-xs bg-cyan-600 hover:bg-cyan-700 text-white dark:bg-cyan-600 dark:hover:bg-cyan-500"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 pt-2 border-t border-border/60">
          {/* 1. Multi-Date / Date Range Picker Popover */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-cyan-500" />
                <span>Attendance Dates</span>
              </span>
              {totalDaysSelected > 1 && (
                <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  {totalDaysSelected} days
                </span>
              )}
            </label>
            <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="h-9 w-full justify-between text-xs font-normal bg-background border-border hover:bg-muted/50 px-2.5"
                >
                  <span className="truncate max-w-[170px] text-foreground text-left">
                    {dateTriggerLabel}
                  </span>
                  <div className="flex items-center gap-1 ml-1 shrink-0">
                    {totalDaysSelected > 1 && (
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-[10px] font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-0"
                      >
                        {totalDaysSelected}d
                      </Badge>
                    )}
                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 p-3 bg-popover text-popover-foreground border-border shadow-xl rounded-xl space-y-3"
                align="start"
              >
                <div className="flex items-center justify-between border-b border-border/70 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Calendar className="h-4 w-4 text-cyan-500" />
                    <span>Select Date Range / Days</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                    {totalDaysSelected} {totalDaysSelected === 1 ? "day" : "days"}
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Quick Presets
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyPreset("today")}
                      className="h-7 text-[11px] hover:bg-cyan-500/10 hover:text-cyan-600 border-border"
                    >
                      Today
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyPreset("yesterday")}
                      className="h-7 text-[11px] hover:bg-cyan-500/10 hover:text-cyan-600 border-border"
                    >
                      Yesterday
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyPreset("last3")}
                      className="h-7 text-[11px] hover:bg-cyan-500/10 hover:text-cyan-600 border-border"
                    >
                      Last 3 Days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyPreset("last7")}
                      className="h-7 text-[11px] hover:bg-cyan-500/10 hover:text-cyan-600 border-border"
                    >
                      Last 7 Days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyPreset("last14")}
                      className="h-7 text-[11px] hover:bg-cyan-500/10 hover:text-cyan-600 border-border"
                    >
                      Last 14 Days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyPreset("monthToDate")}
                      className="h-7 text-[11px] hover:bg-cyan-500/10 hover:text-cyan-600 border-border"
                    >
                      This Month
                    </Button>
                  </div>
                </div>

                {/* Custom Date Range Inputs */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Custom Date Range
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground font-medium">From Date</span>
                      <Input
                        type="date"
                        value={tempStartDate}
                        onChange={(e) => setTempStartDate(e.target.value)}
                        className="h-8 text-xs bg-background border-border"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground font-medium">To Date</span>
                      <Input
                        type="date"
                        value={tempEndDate}
                        onChange={(e) => setTempEndDate(e.target.value)}
                        className="h-8 text-xs bg-background border-border"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <button
                    type="button"
                    onClick={handleResetDateToToday}
                    className="text-xs text-muted-foreground hover:text-foreground font-medium cursor-pointer"
                  >
                    Reset to Today
                  </button>
                  <Button
                    size="sm"
                    onClick={handleApplyCustomRange}
                    className="h-7 text-xs bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
                  >
                    Apply Dates
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* 2. Multi-Select Company Popover */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3 w-3 text-cyan-500" />
                <span>Companies</span>
              </span>
              {selectedCompanyIds.length > 0 && (
                <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  {selectedCompanyIds.length}/{companies.length}
                </span>
              )}
            </label>
            <Popover open={companyPopoverOpen} onOpenChange={setCompanyPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="h-9 w-full justify-between text-xs font-normal bg-background border-border hover:bg-muted/50 px-2.5"
                >
                  <span className="truncate max-w-[170px] text-foreground text-left">
                    {companyTriggerLabel}
                  </span>
                  <div className="flex items-center gap-1 ml-1 shrink-0">
                    {selectedCompanyIds.length > 1 && (
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-[10px] font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-0"
                      >
                        {selectedCompanyIds.length}
                      </Badge>
                    )}
                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-72 sm:w-80 p-0 bg-popover text-popover-foreground border-border shadow-lg"
                align="start"
              >
                {/* Search Bar */}
                <div className="p-2 border-b border-border/70">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search company code or name..."
                      value={companySearch}
                      onChange={(e) => setCompanySearch(e.target.value)}
                      className="h-8 pl-8 pr-2 text-xs bg-background border-border"
                    />
                  </div>
                </div>

                {/* Quick Selection Actions */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/60 bg-muted/30 text-[11px]">
                  <button
                    type="button"
                    onClick={handleSelectAllCompanies}
                    className="font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    Select All ({companies.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleClearCompanies}
                    disabled={selectedCompanyIds.length === 0}
                    className="font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
                  >
                    Clear All
                  </button>
                </div>

                {/* Company Checkbox List */}
                <ScrollArea className="h-60 p-1">
                  {filteredCompanies.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      No companies found
                    </div>
                  ) : (
                    <div className="space-y-0.5 p-1">
                      {filteredCompanies.map((c) => {
                        const idStr = String(c.companyId);
                        const isChecked = selectedCompanyIds.includes(idStr);
                        return (
                          <div
                            key={c.companyId}
                            onClick={() => handleToggleCompany(idStr)}
                            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-muted/70 cursor-pointer select-none text-xs transition-colors"
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => handleToggleCompany(idStr)}
                              onClick={(e) => e.stopPropagation()}
                              className="data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                            />
                            <span className="inline-flex items-center rounded px-1.5 py-0.2 text-[10px] font-bold font-mono bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shrink-0">
                              {c.companyCode}
                            </span>
                            <span className="truncate flex-1 text-foreground" title={c.companyName}>
                              {c.companyName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          {/* 3. Multi-Select Department Popover */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="h-3 w-3 text-cyan-500" />
                <span>Departments</span>
              </span>
              {selectedDepartments.length > 0 && (
                <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  {selectedDepartments.length}/{departments.length}
                </span>
              )}
            </label>
            <Popover open={deptPopoverOpen} onOpenChange={setDeptPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="h-9 w-full justify-between text-xs font-normal bg-background border-border hover:bg-muted/50 px-2.5"
                >
                  <span className="truncate max-w-[170px] text-foreground text-left">
                    {deptTriggerLabel}
                  </span>
                  <div className="flex items-center gap-1 ml-1 shrink-0">
                    {selectedDepartments.length > 1 && (
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-[10px] font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-0"
                      >
                        {selectedDepartments.length}
                      </Badge>
                    )}
                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-72 sm:w-80 p-0 bg-popover text-popover-foreground border-border shadow-lg"
                align="start"
              >
                {/* Search Bar */}
                <div className="p-2 border-b border-border/70">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search department..."
                      value={deptSearch}
                      onChange={(e) => setDeptSearch(e.target.value)}
                      className="h-8 pl-8 pr-2 text-xs bg-background border-border"
                    />
                  </div>
                </div>

                {/* Quick Selection Actions */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/60 bg-muted/30 text-[11px]">
                  <button
                    type="button"
                    onClick={handleSelectAllDepartments}
                    className="font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    Select All ({departments.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleClearDepartments}
                    disabled={selectedDepartments.length === 0}
                    className="font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
                  >
                    Clear All
                  </button>
                </div>

                {/* Department Checkbox List */}
                <ScrollArea className="h-60 p-1">
                  {filteredDepartments.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      No departments found
                    </div>
                  ) : (
                    <div className="space-y-0.5 p-1">
                      {filteredDepartments.map((dept) => {
                        const isChecked = selectedDepartments.includes(dept);
                        return (
                          <div
                            key={dept}
                            onClick={() => handleToggleDepartment(dept)}
                            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-muted/70 cursor-pointer select-none text-xs transition-colors"
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => handleToggleDepartment(dept)}
                              onClick={(e) => e.stopPropagation()}
                              className="data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                            />
                            <span className="truncate flex-1 text-foreground" title={dept}>
                              {dept}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          {/* 4. Attendance Status Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="h-3 w-3 text-cyan-500" />
              <span>Attendance Status</span>
            </label>
            <Select
              value={filters.attendanceStatus}
              onValueChange={(val) =>
                onChange((prev) => ({ ...prev, attendanceStatus: val }))
              }
            >
              <SelectTrigger className="h-9 text-xs bg-background border-border text-foreground">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border-border">
                <SelectItem value="ALL" className="text-xs font-medium">
                  All Records
                </SelectItem>
                <SelectItem value="Present" className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ Present (On Time & Late)
                </SelectItem>
                <SelectItem value="On Time" className="text-xs text-emerald-600 dark:text-emerald-400">
                  ● On Time
                </SelectItem>
                <SelectItem value="Late" className="text-xs text-amber-600 dark:text-amber-400">
                  ▲ Late
                </SelectItem>
                <SelectItem value="Absent" className="text-xs text-rose-600 dark:text-rose-400">
                  ✕ Absent
                </SelectItem>
                <SelectItem value="Filed Leave" className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                  ✈ Filed for Leave (All)
                </SelectItem>
                <SelectItem value="On Leave" className="text-xs text-purple-600 dark:text-purple-400">
                  ✓ Approved Leave
                </SelectItem>
                <SelectItem value="Leave Pending" className="text-xs text-amber-600 dark:text-amber-400">
                  ⏱ Pending Leave
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 5. Live Search Input */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-4 xl:col-span-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Search className="h-3 w-3 text-cyan-500" />
              <span>Search Personnel</span>
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Name, ID, Role, Company..."
                value={filters.search}
                onChange={(e) =>
                  onChange((prev) => ({ ...prev, search: e.target.value }))
                }
                className="h-9 pl-8 pr-7 text-xs bg-background border-border text-foreground focus-visible:ring-cyan-500/20"
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => onChange((prev) => ({ ...prev, search: "" }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Selected Active Filter Chips (Tags) */}
        {(isDateFiltered || selectedCompanyIds.length > 0 || selectedDepartments.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/40 text-xs">
            <span className="text-[11px] font-semibold text-muted-foreground mr-1">
              Active Filters:
            </span>

            {/* Date Range Chip */}
            {isDateFiltered && (
              <Badge
                variant="secondary"
                className="gap-1 text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 py-0.5 px-2 rounded-md"
              >
                <Calendar className="h-3 w-3 shrink-0" />
                <span>
                  {filters.startDate === filters.endDate
                    ? filters.startDate
                    : `${filters.startDate} to ${filters.endDate} (${totalDaysSelected}d)`}
                </span>
                <button
                  type="button"
                  onClick={handleResetDateToToday}
                  className="hover:text-destructive transition-colors ml-0.5"
                  title="Reset date to today"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {/* Company Chips */}
            {selectedCompanyIds.map((id) => {
              const comp = companies.find((c) => String(c.companyId) === id);
              return (
                <Badge
                  key={id}
                  variant="secondary"
                  className="gap-1 text-[11px] font-medium bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 py-0.5 px-2 rounded-md"
                >
                  <Building2 className="h-3 w-3 shrink-0" />
                  <span>{comp ? `[${comp.companyCode}] ${comp.companyName}` : `Company #${id}`}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleCompany(id)}
                    className="hover:text-destructive transition-colors ml-0.5"
                    title="Remove filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}

            {/* Department Chips */}
            {selectedDepartments.map((dept) => (
              <Badge
                key={dept}
                variant="secondary"
                className="gap-1 text-[11px] font-medium bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30 hover:bg-blue-500/20 py-0.5 px-2 rounded-md"
              >
                <Layers className="h-3 w-3 shrink-0" />
                <span>{dept}</span>
                <button
                  type="button"
                  onClick={() => handleToggleDepartment(dept)}
                  className="hover:text-destructive transition-colors ml-0.5"
                  title="Remove filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}

            <button
              type="button"
              onClick={() => {
                handleResetDateToToday();
                handleClearCompanies();
                handleClearDepartments();
              }}
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground underline ml-2 cursor-pointer"
            >
              Clear selections
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
