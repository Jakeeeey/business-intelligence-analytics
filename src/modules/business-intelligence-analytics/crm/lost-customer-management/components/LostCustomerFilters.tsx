"use client";

import React from "react";
import {
  Search,
  RotateCcw,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Tag,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LostCustomerFilters as FiltersType } from "../types";

interface LostCustomerFiltersProps {
  filters: FiltersType;
  onChange: React.Dispatch<React.SetStateAction<FiltersType>>;
  uniqueTaggings: string[];
  onReset: () => void;
  onReload: () => void;
  onExport: () => void;
  loading: boolean;
  totalCount: number;
}

const MIN_DAYS_PRESETS = [
  { label: "Any Inactivity", value: "" },
  { label: "30+ Days", value: "30" },
  { label: "60+ Days", value: "60" },
  { label: "90+ Days", value: "90" },
  { label: "120+ Days", value: "120" },
  { label: "180+ Days", value: "180" },
  { label: "365+ Days", value: "365" },
];

export function LostCustomerFilters({
  filters,
  onChange,
  uniqueTaggings,
  onReset,
  onReload,
  onExport,
  loading,
  totalCount,
}: LostCustomerFiltersProps) {
  const activeFiltersCount = [
    Boolean(filters.customerCode),
    Boolean(filters.customerName),
    filters.tagging !== "ALL",
    Boolean(filters.minDaysNoSales),
  ].filter(Boolean).length;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3.5">
      {/* Top action row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Filter className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                Filter & Segment Accounts
              </span>
              {activeFiltersCount > 0 && (
                <Badge
                  variant="secondary"
                  className="h-5 px-1.5 text-[10px] font-semibold bg-primary/15 text-primary border-transparent"
                >
                  {activeFiltersCount} Active
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Showing {totalCount.toLocaleString()} matched customer records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
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
            disabled={loading || totalCount === 0}
            className="h-8 gap-1.5 text-xs border-border hover:bg-muted font-medium"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Main Filter Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Customer Code Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-primary" />
            <span>Customer Code</span>
          </label>
          <div className="relative">
            <Input
              placeholder="Search code (e.g. CUST-01)..."
              value={filters.customerCode}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, customerCode: e.target.value }))
              }
              className="h-8.5 text-xs bg-background border-border pr-7"
            />
            {filters.customerCode && (
              <button
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, customerCode: "" }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Customer Name Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-primary" />
            <span>Customer Name</span>
          </label>
          <div className="relative">
            <Input
              placeholder="Search company or store..."
              value={filters.customerName}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, customerName: e.target.value }))
              }
              className="h-8.5 text-xs bg-background border-border pr-7"
            />
            {filters.customerName && (
              <button
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, customerName: "" }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Tagging Dropdown Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-primary" />
            <span>Account Tagging</span>
          </label>
          <Select
            value={filters.tagging}
            onValueChange={(val) =>
              onChange((prev) => ({ ...prev, tagging: val }))
            }
          >
            <SelectTrigger className="h-8.5 text-xs bg-background border-border">
              <SelectValue placeholder="All Taggings" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="ALL" className="text-xs">
                All Taggings
              </SelectItem>
              {uniqueTaggings.map((tag) => (
                <SelectItem key={tag} value={tag} className="text-xs">
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Min Days with No Sales */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>Inactivity Threshold</span>
          </label>
          <Select
            value={filters.minDaysNoSales || "ALL_DAYS"}
            onValueChange={(val) =>
              onChange((prev) => ({
                ...prev,
                minDaysNoSales: val === "ALL_DAYS" ? "" : val,
              }))
            }
          >
            <SelectTrigger className="h-8.5 text-xs bg-background border-border">
              <SelectValue placeholder="Any Inactivity" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {MIN_DAYS_PRESETS.map((p) => (
                <SelectItem
                  key={p.value || "all"}
                  value={p.value || "ALL_DAYS"}
                  className="text-xs"
                >
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Triage Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 mr-1">
          <Sparkles className="h-3 w-3 text-amber-500" />
          Quick Triage:
        </span>

        <button
          type="button"
          onClick={() => onChange((prev) => ({ ...prev, minDaysNoSales: "", tagging: "ALL" }))}
          className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${
            !filters.minDaysNoSales && filters.tagging === "ALL"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border-border"
          }`}
        >
          All
        </button>

        <button
          type="button"
          onClick={() => onChange((prev) => ({ ...prev, minDaysNoSales: "180" }))}
          className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${
            filters.minDaysNoSales === "180"
              ? "bg-red-500 text-white border-red-500"
              : "bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30"
          }`}
        >
          🚨 Critical (&gt; 180 Days)
        </button>

        <button
          type="button"
          onClick={() => onChange((prev) => ({ ...prev, minDaysNoSales: "90" }))}
          className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${
            filters.minDaysNoSales === "90"
              ? "bg-orange-500 text-white border-orange-500"
              : "bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30"
          }`}
        >
          ⚠️ Severe (&gt; 90 Days)
        </button>

        <button
          type="button"
          onClick={() => onChange((prev) => ({ ...prev, minDaysNoSales: "30" }))}
          className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${
            filters.minDaysNoSales === "30"
              ? "bg-amber-500 text-white border-amber-500"
              : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30"
          }`}
        >
          ⏱️ Early At-Risk (&gt; 30 Days)
        </button>
      </div>
    </div>
  );
}
