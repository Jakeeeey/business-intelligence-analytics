"use client";

import React, { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw, Filter } from "lucide-react";
import { BranchLookup } from "../types";
import { MultiSelectDropdown, MultiSelectOption } from "./MultiSelectDropdown";

interface Props {
  selectedYear: number;
  onYearChange: (year: number) => void;
  selectedMonth: number;
  onMonthChange: (month: number) => void;
  selectedBranchIds: string[];
  onBranchIdsChange: (branchIds: string[]) => void;
  selectedStatuses: string[];
  onStatusesChange: (statuses: string[]) => void;
  branches: BranchLookup[];
  onRefresh: () => void;
  loading: boolean;
}

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const STATUS_OPTIONS: MultiSelectOption[] = [
  { value: "committed", label: "Committed" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
];

export const SchedulingFilters: React.FC<Props> = ({
  selectedYear,
  onYearChange,
  selectedMonth,
  onMonthChange,
  selectedBranchIds,
  onBranchIdsChange,
  selectedStatuses,
  onStatusesChange,
  branches,
  onRefresh,
  loading,
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 3 + i);

  const selectedMonthName = useMemo(() => {
    return MONTHS.find((m) => m.value === selectedMonth)?.label || "January";
  }, [selectedMonth]);

  const branchOptions: MultiSelectOption[] = useMemo(() => {
    return branches.map((b) => ({
      value: String(b.id),
      label: b.code ? `${b.code} - ${b.name}` : b.name,
    }));
  }, [branches]);

  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
      {/* Title & Subtitle Section */}
      <div className="space-y-0.5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Physical Inventory Scheduling Van {selectedYear}
        </h1>
        <p className="text-xs text-muted-foreground">
          Monthly branch van schedule and physical inventory commit tracking for {selectedMonthName}
        </p>
      </div>

      {/* Filters & Actions Bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1.5 p-1 rounded-lg border bg-muted/20">
          <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1.5 mr-0.5" />

          {/* Year Dropdown */}
          <div className="w-[85px]">
            <Select
              value={String(selectedYear)}
              onValueChange={(val) => onYearChange(Number(val))}
            >
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)} className="text-xs">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Month Dropdown */}
          <div className="w-[120px]">
            <Select
              value={String(selectedMonth)}
              onValueChange={(val) => onMonthChange(Number(val))}
            >
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)} className="text-xs">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Searchable Multiselect Branch Dropdown */}
          <MultiSelectDropdown
            placeholder="Branches"
            allLabel="All Branches"
            options={branchOptions}
            selectedValues={selectedBranchIds}
            onChange={onBranchIdsChange}
            className="min-w-[130px] max-w-[180px]"
          />

          {/* Searchable Multiselect Status Dropdown */}
          <MultiSelectDropdown
            placeholder="Status"
            allLabel="All Status"
            options={STATUS_OPTIONS}
            selectedValues={selectedStatuses}
            onChange={onStatusesChange}
            className="min-w-[110px] max-w-[150px]"
          />
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 px-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-600" />
            <span className="text-muted-foreground text-[11px]">Committed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-sky-200 border border-sky-300 dark:bg-sky-900 dark:border-sky-700" />
            <span className="text-muted-foreground text-[11px]">Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-rose-200 border border-rose-300 dark:bg-rose-900 dark:border-rose-700" />
            <span className="text-muted-foreground text-[11px]">Cancelled</span>
          </div>
        </div>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="h-8 gap-1.5 text-xs bg-background"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>
    </div>
  );
};

