"use client";

import React from "react";
import {
  Calendar,
  Building2,
  Filter,
  RefreshCw,
  Download,
  Search,
  X,
  Layers,
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
  const isFiltered =
    filters.companyId !== "ALL" ||
    filters.department !== "ALL" ||
    filters.attendanceStatus !== "ALL" ||
    filters.search.trim().length > 0;

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
                  {totalRecords.toLocaleString()} Personnel
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Consolidated active workforce monitoring (excluding inactive, separated, resigned, and non-employee accounts)
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
          {/* 1. Date Picker */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-cyan-500" />
              <span>Log Date</span>
            </label>
            <div className="relative">
              <Input
                type="date"
                value={filters.date}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    date: e.target.value || prev.date,
                  }))
                }
                className="h-9 text-xs bg-background border-border text-foreground focus-visible:ring-cyan-500/20"
              />
            </div>
          </div>

          {/* 2. Company Select */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="h-3 w-3 text-cyan-500" />
              <span>Company Entity</span>
            </label>
            <Select
              value={filters.companyId}
              onValueChange={(val) =>
                onChange((prev) => ({ ...prev, companyId: val }))
              }
            >
              <SelectTrigger className="h-9 text-xs bg-background border-border text-foreground">
                <SelectValue placeholder="All Companies" />
              </SelectTrigger>
              <SelectContent className="max-h-60 bg-popover text-popover-foreground border-border">
                <SelectItem value="ALL" className="text-xs font-medium">
                  🏢 All Companies ({companies.length})
                </SelectItem>
                {companies.map((c) => (
                  <SelectItem
                    key={c.companyId}
                    value={String(c.companyId)}
                    className="text-xs"
                  >
                    <span className="font-semibold text-cyan-600 dark:text-cyan-400 mr-1.5">
                      [{c.companyCode}]
                    </span>
                    <span>{c.companyName}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 3. Department Select */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-3 w-3 text-cyan-500" />
              <span>Department</span>
            </label>
            <Select
              value={filters.department}
              onValueChange={(val) =>
                onChange((prev) => ({ ...prev, department: val }))
              }
            >
              <SelectTrigger className="h-9 text-xs bg-background border-border text-foreground">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent className="max-h-60 bg-popover text-popover-foreground border-border">
                <SelectItem value="ALL" className="text-xs font-medium">
                  All Departments ({departments.length})
                </SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept} className="text-xs">
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
      </div>
    </div>
  );
}
