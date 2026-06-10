// src/modules/business-intelligence-analytics/scm/consolidator-audit/components/Filters.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, RotateCcw, Loader2, RefreshCw, Printer } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ConsolidatorAuditFilters } from "../types";
import { getManilaDateRange } from "../hooks/useConsolidatorAudit";

type FiltersProps = {
  filters: ConsolidatorAuditFilters;
  onChange: React.Dispatch<React.SetStateAction<ConsolidatorAuditFilters>>;
  uniqueStatuses: {
    pdp: string[];
    consolidator: string[];
    dp: string[];
  };
  onSearch: () => void;
  onClear: () => void;
  onPrint?: () => void;
  loading: boolean;
};

export function Filters({
  filters,
  onChange,
  uniqueStatuses,
  onSearch,
  onClear,
  onPrint,
  loading,
}: FiltersProps) {
  const [searchVal, setSearchVal] = React.useState(() => {
    return filters.pdpNo || filters.consolidatorNo || filters.dpNo || "";
  });

  // Sync parent clear to local state
  React.useEffect(() => {
    if (!filters.pdpNo && !filters.consolidatorNo && !filters.dpNo) {
      setSearchVal("");
    }
  }, [filters.pdpNo, filters.consolidatorNo, filters.dpNo]);

  const handleSearchValChange = (val: string) => {
    setSearchVal(val);
    const trimmed = val.trim();
    onChange((prev) => {
      const next = { ...prev, pdpNo: "", consolidatorNo: "", dpNo: "" };
      if (!trimmed) return next;
      
      if (/^pdp/i.test(trimmed)) {
        next.pdpNo = trimmed;
      } else if (/^cld/i.test(trimmed) || /^consol/i.test(trimmed)) {
        next.consolidatorNo = trimmed;
      } else if (/^dp/i.test(trimmed)) {
        next.dpNo = trimmed;
      } else {
        next.pdpNo = trimmed;
        next.consolidatorNo = trimmed;
        next.dpNo = trimmed;
      }
      return next;
    });
  };

  // Dynamic unique statuses from dataset + defaults + active selection so options never disappear
  const pdpOptions = React.useMemo(() => {
    const set = new Set<string>();
    set.add("Dispatched");
    uniqueStatuses.pdp.forEach((s) => { if (s) set.add(s); });
    if (filters.pdpStatus) set.add(filters.pdpStatus);
    return Array.from(set);
  }, [uniqueStatuses.pdp, filters.pdpStatus]);

  const consolidatorOptions = React.useMemo(() => {
    const set = new Set<string>();
    set.add("Audited");
    uniqueStatuses.consolidator.forEach((s) => { if (s) set.add(s); });
    if (filters.consolidatorStatus) set.add(filters.consolidatorStatus);
    return Array.from(set);
  }, [uniqueStatuses.consolidator, filters.consolidatorStatus]);

  const dpOptions = React.useMemo(() => {
    const set = new Set<string>();
    set.add("Posted");
    set.add("For Clearance");
    uniqueStatuses.dp.forEach((s) => { if (s) set.add(s); });
    if (filters.dpStatus) set.add(filters.dpStatus);
    return Array.from(set);
  }, [uniqueStatuses.dp, filters.dpStatus]);

  return (
    <Card className="dark:border-zinc-700">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          
          {/* Row 1: Searchbar + Time Range selection + Conditional Dates */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {/* Search Bar */}
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="searchVal" className="text-xs font-medium">
                Search Document No.
              </Label>
              <Input
                id="searchVal"
                placeholder="Search PDP, Consolidator, or DP No..."
                value={searchVal}
                onChange={(e) => handleSearchValChange(e.target.value)}
                className="h-9 dark:border-zinc-700"
                disabled={loading}
              />
            </div>

            {/* Time Range Choice */}
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs font-medium">Time Range</Label>
              <Select
                value={filters.dateRangeType || "month"}
                onValueChange={(val: "today" | "week" | "month" | "year" | "custom") => {
                  const dates = getManilaDateRange(val, filters.startDate, filters.endDate);
                  onChange((prev) => ({
                    ...prev,
                    dateRangeType: val,
                    startDate: dates.startDate,
                    endDate: dates.endDate,
                  }));
                }}
                disabled={loading}
              >
                <SelectTrigger className="h-9 dark:border-zinc-700">
                  <SelectValue placeholder="Select Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Dates Row */}
            {filters.dateRangeType === "custom" && (
              <>
                {/* Start Date */}
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="startDate" className="text-xs font-medium">
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      onChange((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                    className="h-9 dark:border-zinc-700"
                    disabled={loading}
                  />
                </div>

                {/* End Date */}
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="endDate" className="text-xs font-medium">
                    End Date
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      onChange((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                    className="h-9 dark:border-zinc-700"
                    disabled={loading}
                  />
                </div>
              </>
            )}
          </div>

          {/* Row 2: PDP Status + Consolidator Status + DP Status + Actions */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 items-end">
            {/* PDP Status */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">PDP Status</Label>
              <Select
                value={filters.pdpStatus || "ALL"}
                onValueChange={(val) =>
                  onChange((prev) => ({
                    ...prev,
                    pdpStatus: val === "ALL" ? "" : val,
                  }))
                }
                disabled={loading}
              >
                <SelectTrigger className="h-9 dark:border-zinc-700">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {pdpOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Consolidator Status */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Consolidator Status</Label>
              <Select
                value={filters.consolidatorStatus || "ALL"}
                onValueChange={(val) =>
                  onChange((prev) => ({
                    ...prev,
                    consolidatorStatus: val === "ALL" ? "" : val,
                  }))
                }
                disabled={loading}
              >
                <SelectTrigger className="h-9 dark:border-zinc-700">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {consolidatorOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* DP Status */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">DP Status</Label>
              <Select
                value={filters.dpStatus || "ALL"}
                onValueChange={(val) =>
                  onChange((prev) => ({
                    ...prev,
                    dpStatus: val === "ALL" ? "" : val,
                  }))
                }
                disabled={loading}
              >
                <SelectTrigger className="h-9 dark:border-zinc-700">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {dpOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions: Refresh, Clear, Apply */}
            <div className="flex items-center gap-2 justify-end w-full">
              {/* Refresh */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSearch}
                disabled={loading}
                className="gap-1.5 h-9 dark:border-zinc-700"
                title="Refresh Data"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>

              {/* Clear */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClear}
                disabled={loading}
                className="gap-1.5 h-9 dark:border-zinc-700"
                title="Reset Filters"
              >
                <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Reset</span>
              </Button>

              {/* Apply */}
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={onSearch}
                disabled={loading}
                className="gap-1.5 h-9 min-w-[90px]"
                title="Apply Filters"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Search className="h-3.5 w-3.5" />
                )}
                {loading ? "Searching..." : "Search"}
              </Button>

              {/* Print */}
              {onPrint && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onPrint}
                  disabled={loading}
                  className="gap-1.5 h-9 dark:border-zinc-700 text-blue-600 dark:text-blue-400 font-bold"
                  title="Print Report"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
