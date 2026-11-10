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
  FileText,
  Clock,
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
import { ResignationFilters, CompanyFilterOption } from "../types";

interface ResignationFiltersProps {
  filters: ResignationFilters;
  setFilters: React.Dispatch<React.SetStateAction<ResignationFilters>>;
  companies: CompanyFilterOption[];
  departments: string[];
  reasonCategories: string[];
  onReset: () => void;
  onRefresh: () => void;
  onExport: () => void;
  loading: boolean;
  totalFiltered: number;
}

export function ResignationFiltersBar({
  filters,
  setFilters,
  companies,
  departments,
  reasonCategories,
  onReset,
  onRefresh,
  onExport,
  loading,
  totalFiltered,
}: ResignationFiltersProps) {
  const handleTextChange = (field: keyof ResignationFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const hasActiveFilters =
    filters.company !== "ALL" ||
    filters.department !== "ALL" ||
    filters.status !== "ALL" ||
    filters.reasonCategory !== "ALL" ||
    filters.noticeCategory !== "ALL" ||
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
            placeholder="Search by employee, position, reason, company, HR remarks..."
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
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

        {/* Status Selector */}
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
              <SelectItem value="PENDING">Pending Review</SelectItem>
              <SelectItem value="APPROVED">Approved / Accepted</SelectItem>
              <SelectItem value="COMPLETED">Completed / Recorded</SelectItem>
              <SelectItem value="REJECTED">Rejected / Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reason Category Selector */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
            <FileText className="h-3 w-3" /> Reason Driver
          </label>
          <Select
            value={filters.reasonCategory}
            onValueChange={(val) => handleTextChange("reasonCategory", val)}
          >
            <SelectTrigger className="h-8.5 text-xs bg-background border-input rounded-xl">
              <SelectValue placeholder="All Reasons" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="ALL">All Reasons</SelectItem>
              {reasonCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notice Period Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
            <Clock className="h-3 w-3" /> Notice Period
          </label>
          <Select
            value={filters.noticeCategory}
            onValueChange={(val) => handleTextChange("noticeCategory", val)}
          >
            <SelectTrigger className="h-8.5 text-xs bg-background border-input rounded-xl">
              <SelectValue placeholder="All Notice Periods" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="ALL">All Notice Periods</SelectItem>
              <SelectItem value="30+ Days (Compliant)">30+ Days (Compliant)</SelectItem>
              <SelectItem value="15-29 Days">15-29 Days</SelectItem>
              <SelectItem value="< 15 Days">&lt; 15 Days</SelectItem>
              <SelectItem value="Immediate / Past">Immediate / Past</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date From & To */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
            <Calendar className="h-3 w-3" /> Filing From / To
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

