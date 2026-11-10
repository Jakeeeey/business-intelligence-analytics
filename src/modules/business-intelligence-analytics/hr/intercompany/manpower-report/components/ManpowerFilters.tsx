"use client";

import React from "react";
import {
  Search,
  Filter,
  RotateCcw,
  RefreshCw,
  Download,
  Building2,
  Calendar,
  Layers,
  Briefcase,
  UserPlus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ManpowerFilters, CompanyFilterOption } from "../types";

interface ManpowerFiltersProps {
  filters: ManpowerFilters;
  setFilters: React.Dispatch<React.SetStateAction<ManpowerFilters>>;
  companies: CompanyFilterOption[];
  departments: string[];
  divisions: string[];
  purposes: string[];
  employmentTypes: string[];
  statuses: string[];
  onReset: () => void;
  onRefresh: () => void;
  onExport: () => void;
  loading: boolean;
  totalFiltered: number;
}

export function ManpowerFiltersBar({
  filters,
  setFilters,
  companies,
  departments,
  divisions,
  purposes,
  employmentTypes,
  statuses,
  onReset,
  onRefresh,
  onExport,
  loading,
  totalFiltered,
}: ManpowerFiltersProps) {
  const handleTextChange = (field: keyof ManpowerFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const hasActiveFilters =
    filters.company !== "ALL" ||
    filters.department !== "ALL" ||
    filters.division !== "ALL" ||
    filters.status !== "ALL" ||
    filters.purpose !== "ALL" ||
    filters.employmentType !== "ALL" ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate) ||
    Boolean(filters.search.trim());

  return (
    <div className="space-y-3 bg-card border border-border p-4 rounded-2xl shadow-xs transition-colors">
      {/* Top row: Search input + Actions */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by request #, position, justification, requestor, replacement..."
            value={filters.search}
            onChange={(e) => handleTextChange("search", e.target.value)}
            className="pl-9 bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary h-9 rounded-xl"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="h-9 px-3 border-dashed border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-9 px-3 border-border hover:bg-muted text-foreground rounded-xl"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin text-primary" : "text-muted-foreground"}`}
            />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={onExport}
            className="h-9 px-3.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium shadow-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV ({totalFiltered})
          </Button>
        </div>
      </div>

      {/* Bottom row: Dropdowns & Date Pickers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 pt-1">
        {/* Company Selector */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
            <Building2 className="h-3 w-3" /> Company
          </label>
          <Select
            value={filters.company}
            onValueChange={(val) => handleTextChange("company", val)}
          >
            <SelectTrigger className="h-8.5 text-xs bg-background border-input rounded-xl">
              <SelectValue placeholder="All Companies" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="ALL">All Companies</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.companyId} value={c.companyCode}>
                  {c.companyName} ({c.companyCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Department Selector */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
            <Layers className="h-3 w-3" /> Department
          </label>
          <Select
            value={filters.department}
            onValueChange={(val) => handleTextChange("department", val)}
          >
            <SelectTrigger className="h-8.5 text-xs bg-background border-input rounded-xl">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="ALL">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Division Selector */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
            <Briefcase className="h-3 w-3" /> Division
          </label>
          <Select
            value={filters.division}
            onValueChange={(val) => handleTextChange("division", val)}
          >
            <SelectTrigger className="h-8.5 text-xs bg-background border-input rounded-xl">
              <SelectValue placeholder="All Divisions" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="ALL">All Divisions</SelectItem>
              {divisions.map((div) => (
                <SelectItem key={div} value={div}>
                  {div}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Purpose */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
            <UserPlus className="h-3 w-3" /> Purpose
          </label>
          <Select
            value={filters.purpose}
            onValueChange={(val) => handleTextChange("purpose", val)}
          >
            <SelectTrigger className="h-8.5 text-xs bg-background border-input rounded-xl">
              <SelectValue placeholder="All Purposes" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="ALL">All Purposes</SelectItem>
              {purposes.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Employment Type */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
            <Briefcase className="h-3 w-3" /> Emp. Type
          </label>
          <Select
            value={filters.employmentType}
            onValueChange={(val) => handleTextChange("employmentType", val)}
          >
            <SelectTrigger className="h-8.5 text-xs bg-background border-input rounded-xl">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="ALL">All Types</SelectItem>
              {employmentTypes.map((et) => (
                <SelectItem key={et} value={et}>
                  {et}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
            <Filter className="h-3 w-3" /> Status
          </label>
          <Select
            value={filters.status}
            onValueChange={(val) => handleTextChange("status", val)}
          >
            <SelectTrigger className="h-8.5 text-xs bg-background border-input rounded-xl">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="ALL">All Statuses</SelectItem>
              {statuses.map((st) => (
                <SelectItem key={st} value={st}>
                  {st}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date From & To */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
            <Calendar className="h-3 w-3" /> Date Filed
          </label>
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleTextChange("startDate", e.target.value)}
              className="h-8.5 text-[11px] bg-background border-input rounded-xl px-2 text-foreground"
            />
            <span className="text-muted-foreground text-xs">-</span>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleTextChange("endDate", e.target.value)}
              className="h-8.5 text-[11px] bg-background border-input rounded-xl px-2 text-foreground"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

