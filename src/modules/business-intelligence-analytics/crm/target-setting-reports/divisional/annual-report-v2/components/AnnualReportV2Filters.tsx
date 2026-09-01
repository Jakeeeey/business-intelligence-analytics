"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/modules/business-intelligence-analytics/crm/sales-report/salesman-performance/components/MultiSelect";
import { Filter } from "lucide-react";
import { useAnnualReportV2Filters } from "../providers/AnnualReportV2FilterProvider";

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2000, i, 1).toLocaleString("default", { month: "short" }),
}));

const YEAR_OPTIONS = Array.from({ length: 7 }, (_, i) =>
  String(new Date().getFullYear() - 2 + i),
);

interface AnnualReportV2FiltersProps {
  suppliers: string[];
  categories: string[];
  uoms: string[];
}

export function AnnualReportV2Filters({
  suppliers,
  categories = [],
  uoms = [],
}: AnnualReportV2FiltersProps) {
  const { filters, setFilter, resetFilters } = useAnnualReportV2Filters();

  const hasActiveFilters = filters.customerName || filters.supplierName || filters.categoryName || filters.month || filters.unitName;
  const activeCount = [filters.customerName, filters.supplierName, filters.categoryName, filters.month, filters.unitName].filter(Boolean).length;


  const supplierOptions = React.useMemo(
    () => suppliers.map((s) => ({ label: s, value: s })),
    [suppliers],
  );
  const categoryOptions = React.useMemo(
    () => categories.map((c) => ({ label: c, value: c })),
    [categories],
  );
  const uomOptions = React.useMemo(
    () => uoms
      .filter((u) => {
        const lower = u.toLowerCase();
        return lower === "pieces" || lower === "box";
      })
      .map((u) => ({ label: u, value: u })),
    [uoms],
  );

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border bg-card">
      <div className="flex items-center gap-1.5 pr-2 border-r">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {activeCount > 0 && (
          <span className="flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none">
            {activeCount}
          </span>
        )}
      </div>

      <Select
        value={filters.year}
        onValueChange={(v) => setFilter("year", v)}
      >
        <SelectTrigger className="w-24 h-8 text-xs">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          {YEAR_OPTIONS.map((y) => (
            <SelectItem key={y} value={y}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <MultiSelect
        mode="multi"
        placeholder="Select months"
        options={MONTH_OPTIONS}
        value={
          filters.month === "NONE"
            ? []
            : filters.month
            ? filters.month.split(",")
            : MONTH_OPTIONS.map((o) => o.value)
        }
        onChange={(next) => {
          if (next.length === 0) {
            setFilter("month", "NONE");
          } else if (next.length === 12) {
            setFilter("month", "");
          } else {
            setFilter("month", next.join(","));
          }
        }}
        className="w-40 h-8 text-xs"
      />

      {/* Customer filter hidden temporarily */}
      {/* <MultiSelect
        mode="single"
        placeholder="Customer"
        options={customerOptions}
        value={filters.customerName ? [filters.customerName] : []}
        onChange={(next) =>
          setFilter("customerName", next.length > 0 ? next[0] : "")
        }
        className="w-40 h-8 text-xs"
      /> */}

      <MultiSelect
        mode="multi"
        placeholder="Supplier"
        options={supplierOptions}
        value={
          filters.supplierName === "NONE"
            ? []
            : filters.supplierName
            ? filters.supplierName.split("|")
            : suppliers
        }
        onChange={(next) => {
          if (next.length === 0) {
            setFilter("supplierName", "NONE");
          } else if (next.length === suppliers.length) {
            setFilter("supplierName", "");
          } else {
            setFilter("supplierName", next.join("|"));
          }
        }}
        className="w-40 h-8 text-xs"
      />

      <MultiSelect
        mode="multi"
        placeholder="Category"
        options={categoryOptions}
        value={
          filters.categoryName === "NONE"
            ? []
            : filters.categoryName
            ? filters.categoryName.split("|")
            : categories
        }
        onChange={(next) => {
          if (next.length === 0) {
            setFilter("categoryName", "NONE");
          } else if (next.length === categories.length) {
            setFilter("categoryName", "");
          } else {
            setFilter("categoryName", next.join("|"));
          }
        }}
        className="w-40 h-8 text-xs"
      />

      <MultiSelect
        mode="single"
        placeholder="UOM"
        options={uomOptions}
        value={filters.unitName ? [filters.unitName] : []}
        onChange={(next) =>
          setFilter("unitName", next.length > 0 ? next[0] : "")
        }
        className="w-40 h-8 text-xs"
      />

      <Select
        value={filters.amountType}
        onValueChange={(v) => setFilter("amountType", v)}
      >
        <SelectTrigger className="w-32 h-8 text-xs">
          <SelectValue placeholder="Amount Type" />
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          <SelectItem value="grossAmount">Gross Amount</SelectItem>
          <SelectItem value="netAmount">Net Amount</SelectItem>
          <SelectItem value="netOfReturns">Net of Returns</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="destructive"
        size="sm"
        onClick={resetFilters}
        disabled={!hasActiveFilters}
        className="h-8 text-xs px-3 font-medium"
      >
        Reset Filters
      </Button>
    </div>
  );
}
