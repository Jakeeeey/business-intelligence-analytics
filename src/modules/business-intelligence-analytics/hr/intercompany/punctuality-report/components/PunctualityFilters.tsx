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
  IntercompanyPunctualityFilters,
} from "../types";

interface PunctualityFiltersProps {
  filters: IntercompanyPunctualityFilters;
  onChange: React.Dispatch<React.SetStateAction<IntercompanyPunctualityFilters>>;
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

export function PunctualityFilters({
  filters,
  onChange,
  companies,
  departments,
  totalRecords,
  loading,
  onRefresh,
  onReset,
  onExport,
}: PunctualityFiltersProps) {
  const todayStr = useMemo(() => formatDateString(new Date()), []);

  // Popover open state
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [companyPopoverOpen, setCompanyPopoverOpen] = useState(false);
  const [deptPopoverOpen, setDeptPopoverOpen] = useState(false);

  // Search states within popovers
  const [companySearch, setCompanySearch] = useState("");
  const [deptSearch, setDeptSearch] = useState("");

  // Temporary date states for custom range editing
  const [tempStartDate, setTempStartDate] = useState(filters.startDate || filters.date || todayStr);
  const [tempEndDate, setTempEndDate] = useState(filters.endDate || filters.date || todayStr);

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
        start = new Date(now);
        end = new Date(now);
        break;
      case "yesterday": {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        start = y;
        end = y;
        break;
      }
      case "last3": {
        const s = new Date(now);
        s.setDate(s.getDate() - 2);
        start = s;
        end = new Date(now);
        break;
      }
      case "last7": {
        const s = new Date(now);
        s.setDate(s.getDate() - 6);
        start = s;
        end = new Date(now);
        break;
      }
      case "last14": {
        const s = new Date(now);
        s.setDate(s.getDate() - 13);
        start = s;
        end = new Date(now);
        break;
      }
      case "monthToDate": {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now);
        break;
      }
    }

    const sStr = formatDateString(start);
    const eStr = formatDateString(end);

    setTempStartDate(sStr);
    setTempEndDate(eStr);

    onChange((prev) => ({
      ...prev,
      startDate: sStr,
      endDate: eStr,
      date: sStr,
      dates: undefined,
    }));
    setDatePopoverOpen(false);
  };

  const handleApplyCustomDateRange = () => {
    if (!tempStartDate || !tempEndDate) return;
    let s = tempStartDate;
    let e = tempEndDate;
    if (s > e) {
      const t = s;
      s = e;
      e = t;
    }
    onChange((prev) => ({
      ...prev,
      startDate: s,
      endDate: e,
      date: s,
      dates: undefined,
    }));
    setDatePopoverOpen(false);
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

  const selectedCompanyIds = useMemo(() => filters.companyIds || [], [filters.companyIds]);
  const selectedDepartments = useMemo(() => filters.departments || [], [filters.departments]);

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
      };
    });
  };

  const handleSelectAllCompanies = () => {
    const allIds = companies.map((c) => String(c.companyId));
    onChange((prev) => ({
      ...prev,
      companyIds: allIds,
    }));
  };

  const handleClearCompanies = () => {
    onChange((prev) => ({
      ...prev,
      companyIds: [],
    }));
  };

  const handleToggleDepartment = (deptName: string) => {
    onChange((prev) => {
      const current = prev.departments || [];
      const exists = current.includes(deptName);
      const updated = exists
        ? current.filter((d) => d !== deptName)
        : [...current, deptName];
      return {
        ...prev,
        departments: updated,
      };
    });
  };

  const handleSelectAllDepartments = () => {
    onChange((prev) => ({
      ...prev,
      departments: [...departments],
    }));
  };

  const handleClearDepartments = () => {
    onChange((prev) => ({
      ...prev,
      departments: [],
    }));
  };

  const isDateFiltered =
    (filters.startDate && filters.startDate !== todayStr) ||
    (filters.endDate && filters.endDate !== todayStr);

  const isFiltered =
    isDateFiltered ||
    selectedCompanyIds.length > 0 ||
    selectedDepartments.length > 0 ||
    filters.punctualityStatus !== "ALL" ||
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
        {/* Top Header Row */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                  Intercompany Punctuality Analytics
                </h2>
                <Badge
                  variant="outline"
                  className="bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 text-[10px] font-semibold"
                >
                  Live Multi-Company Feed
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monitoring arrival punctuality, grace periods, delay minutes, and severe lates
              </p>
            </div>
          </div>

          {/* Action Buttons */}
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
          {/* 1. Date Range Picker Popover */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-cyan-500" />
                <span>Punctuality Dates</span>
              </span>
              {totalDaysSelected > 1 && (
                <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  {totalDaysSelected} days
                </span>
              )}
            </label>
            <Popover
              open={datePopoverOpen}
              onOpenChange={(open) => {
                setDatePopoverOpen(open);
                if (open) {
                  setTempStartDate(filters.startDate || filters.date || todayStr);
                  setTempEndDate(filters.endDate || filters.date || todayStr);
                }
              }}
            >
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
              <PopoverContent className="w-80 p-3 bg-popover border-border shadow-xl rounded-2xl" align="start">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-xs font-bold text-foreground">Date Range Selection</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Max 62 Days
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
                        className="h-7 text-[11px] border-border bg-background hover:bg-muted"
                      >
                        Today
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyPreset("yesterday")}
                        className="h-7 text-[11px] border-border bg-background hover:bg-muted"
                      >
                        Yesterday
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyPreset("last3")}
                        className="h-7 text-[11px] border-border bg-background hover:bg-muted"
                      >
                        Last 3d
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyPreset("last7")}
                        className="h-7 text-[11px] border-border bg-background hover:bg-muted"
                      >
                        Last 7d
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyPreset("last14")}
                        className="h-7 text-[11px] border-border bg-background hover:bg-muted"
                      >
                        Last 14d
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyPreset("monthToDate")}
                        className="h-7 text-[11px] border-border bg-background hover:bg-muted"
                      >
                        This Month
                      </Button>
                    </div>
                  </div>

                  {/* Custom Date Inputs */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Custom Range
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Start Date</label>
                        <Input
                          type="date"
                          value={tempStartDate}
                          onChange={(e) => setTempStartDate(e.target.value)}
                          className="h-8 text-xs bg-background border-border"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">End Date</label>
                        <Input
                          type="date"
                          value={tempEndDate}
                          onChange={(e) => setTempEndDate(e.target.value)}
                          className="h-8 text-xs bg-background border-border"
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleApplyCustomDateRange}
                      className="w-full h-8 text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                      Apply Custom Range
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* 2. Multi-Company Selector Popover */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3 w-3 text-cyan-500" />
                <span>Companies</span>
              </span>
              {selectedCompanyIds.length > 0 && (
                <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  {selectedCompanyIds.length} of {companies.length}
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
                    {selectedCompanyIds.length > 0 && (
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
              <PopoverContent className="w-72 p-2 bg-popover border-border shadow-xl rounded-2xl" align="start">
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search companies..."
                      value={companySearch}
                      onChange={(e) => setCompanySearch(e.target.value)}
                      className="h-8 pl-8 text-xs bg-background border-border"
                    />
                  </div>

                  <div className="flex items-center justify-between px-1 py-1 text-xs border-b border-border/70">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAllCompanies}
                      className="h-6 px-2 text-[11px] text-cyan-600 dark:text-cyan-400 hover:text-cyan-700"
                    >
                      Select All ({companies.length})
                    </Button>
                    {selectedCompanyIds.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearCompanies}
                        className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>

                  <ScrollArea className="h-56 pr-2">
                    <div className="space-y-1">
                      {filteredCompanies.map((c) => {
                        const idStr = String(c.companyId);
                        const isChecked = selectedCompanyIds.includes(idStr);
                        return (
                          <label
                            key={c.companyId}
                            className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                              isChecked
                                ? "bg-cyan-500/10 text-foreground font-medium"
                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => handleToggleCompany(idStr)}
                              className="border-border data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                            />
                            <span className="font-mono text-[10px] px-1 py-0.5 rounded bg-muted text-foreground font-bold">
                              {c.companyCode}
                            </span>
                            <span className="truncate flex-1">{c.companyName}</span>
                          </label>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* 3. Multi-Department Selector Popover */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="h-3 w-3 text-cyan-500" />
                <span>Departments</span>
              </span>
              {selectedDepartments.length > 0 && (
                <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  {selectedDepartments.length} of {departments.length}
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
                    {selectedDepartments.length > 0 && (
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
              <PopoverContent className="w-72 p-2 bg-popover border-border shadow-xl rounded-2xl" align="start">
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search departments..."
                      value={deptSearch}
                      onChange={(e) => setDeptSearch(e.target.value)}
                      className="h-8 pl-8 text-xs bg-background border-border"
                    />
                  </div>

                  <div className="flex items-center justify-between px-1 py-1 text-xs border-b border-border/70">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAllDepartments}
                      className="h-6 px-2 text-[11px] text-cyan-600 dark:text-cyan-400 hover:text-cyan-700"
                    >
                      Select All ({departments.length})
                    </Button>
                    {selectedDepartments.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearDepartments}
                        className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>

                  <ScrollArea className="h-56 pr-2">
                    <div className="space-y-1">
                      {filteredDepartments.map((d) => {
                        const isChecked = selectedDepartments.includes(d);
                        return (
                          <label
                            key={d}
                            className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                              isChecked
                                ? "bg-cyan-500/10 text-foreground font-medium"
                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => handleToggleDepartment(d)}
                              className="border-border data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                            />
                            <span className="truncate flex-1">{d}</span>
                          </label>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* 4. Punctuality Status Select */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="h-3 w-3 text-cyan-500" />
              <span>Arrival Status</span>
            </label>
            <Select
              value={filters.punctualityStatus}
              onValueChange={(val) =>
                onChange((prev) => ({
                  ...prev,
                  punctualityStatus: val,
                }))
              }
            >
              <SelectTrigger className="h-9 text-xs bg-background border-border">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="On Time">On Time (≤ 08:00 AM)</SelectItem>
                <SelectItem value="Grace Period">Grace Period (1-15m)</SelectItem>
                <SelectItem value="Moderate Late">Moderate Late (16-30m)</SelectItem>
                <SelectItem value="Severe Late">Severe Late (&gt; 30m)</SelectItem>
                <SelectItem value="Undertime">Undertime / Early Out</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
                <SelectItem value="Absent">Absent / No Log</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 5. Live Search Input */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-4 xl:col-span-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Search className="h-3 w-3 text-cyan-500" />
              <span>Search Records</span>
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Employee name, ID, position..."
                value={filters.search}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    search: e.target.value,
                  }))
                }
                className="h-9 pl-8 pr-7 text-xs bg-background border-border"
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => onChange((prev) => ({ ...prev, search: "" }))}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
