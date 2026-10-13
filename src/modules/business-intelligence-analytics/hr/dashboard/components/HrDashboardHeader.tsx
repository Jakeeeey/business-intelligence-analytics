"use client";

import React from "react";
import {
  Users,
  Building,
  RotateCcw,
  RefreshCw,
  Download,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HrDashboardFilters } from "../types";

interface HrDashboardHeaderProps {
  filters: HrDashboardFilters;
  onChange: React.Dispatch<React.SetStateAction<HrDashboardFilters>>;
  departments: string[];
  statuses: string[];
  totalEmployees: number;
  onReset: () => void;
  onReload: () => void;
  onExport: () => void;
  loading: boolean;
}

export function HrDashboardHeader({
  filters,
  onChange,
  departments,
  statuses,
  totalEmployees,
  onReset,
  onReload,
  onExport,
  loading,
}: HrDashboardHeaderProps) {
  const hasActiveFilters =
    filters.department !== "ALL" ||
    filters.status !== "ALL" ||
    filters.gender !== "ALL";

  return (
    <div className="space-y-4 pt-1">
      {/* Hero Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-xs border border-cyan-500/20">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Human Resource Dashboard
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live personnel analytics, departmental staffing, employment statuses, and employee roster
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-1.5 shadow-2xs text-xs font-semibold text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-foreground">{totalEmployees.toLocaleString()}</span>
            <span>Active Employees</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onReload}
            disabled={loading}
            className="h-8 gap-1.5 text-xs border-border hover:bg-muted font-medium"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={loading || totalEmployees === 0}
            className="h-8 gap-1.5 text-xs border-border hover:bg-muted font-medium"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Building className="h-3.5 w-3.5 text-primary" />
              Department:
            </span>
            <Select
              value={filters.department}
              onValueChange={(val) =>
                onChange((prev) => ({ ...prev, department: val }))
              }
            >
              <SelectTrigger className="h-8 text-xs w-48 bg-background border-border">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="ALL" className="text-xs">
                  All Departments
                </SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept} className="text-xs">
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Employment Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5 text-primary" />
              Status:
            </span>
            <Select
              value={filters.status}
              onValueChange={(val) =>
                onChange((prev) => ({ ...prev, status: val }))
              }
            >
              <SelectTrigger className="h-8 text-xs w-40 bg-background border-border">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="ALL" className="text-xs">
                  All Statuses
                </SelectItem>
                {statuses.map((st) => (
                  <SelectItem key={st} value={st} className="text-xs">
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Gender Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">
              Gender:
            </span>
            <Select
              value={filters.gender}
              onValueChange={(val) =>
                onChange((prev) => ({ ...prev, gender: val }))
              }
            >
              <SelectTrigger className="h-8 text-xs w-32 bg-background border-border">
                <SelectValue placeholder="All Genders" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="ALL" className="text-xs">
                  All Genders
                </SelectItem>
                <SelectItem value="Male" className="text-xs">
                  Male
                </SelectItem>
                <SelectItem value="Female" className="text-xs">
                  Female
                </SelectItem>
                <SelectItem value="Other" className="text-xs">
                  Other / Unspecified
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={loading}
            className="h-8 gap-1 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </Button>
        )}
      </div>
    </div>
  );
}
