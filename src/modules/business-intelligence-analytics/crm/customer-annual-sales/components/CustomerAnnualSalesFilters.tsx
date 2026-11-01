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
import { Filter, RotateCcw } from "lucide-react";
import { useCustomerAnnualSalesFilters } from "../providers/CustomerAnnualSalesFilterProvider";
import { SalesmanOption, CustomerOption } from "../types/customer-annual-sales.schema";

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2000, i, 1).toLocaleString("default", { month: "short" }),
}));

const YEAR_OPTIONS = Array.from({ length: 7 }, (_, i) =>
  String(new Date().getFullYear() - 3 + i)
);

interface CustomerAnnualSalesFiltersProps {
  suppliers: string[];
  salesmen: SalesmanOption[];
  customers: CustomerOption[];
  categories: string[];
  uoms?: string[];
  priceTypes: string[];
  isLoadingOptions?: boolean;
}

export function CustomerAnnualSalesFilters({
  suppliers = [],
  salesmen = [],
  customers = [],
  categories = [],
  priceTypes = [],
  isLoadingOptions = false,
}: CustomerAnnualSalesFiltersProps) {
  const { filters, setFilter, resetFilters } = useCustomerAnnualSalesFilters();

  // Active filters count
  const activeCount = [
    filters.customerName?.trim() ? true : false,
    filters.salesmanId && filters.salesmanId !== "NONE" ? true : false,
    filters.supplierName && filters.supplierName !== "NONE" ? true : false,
    filters.categoryName && filters.categoryName !== "NONE" ? true : false,
    filters.month && filters.month !== "NONE" ? true : false,
    filters.unitName ? true : false,
    filters.priceType && filters.priceType !== "NONE" ? true : false,
    filters.amountType !== "netAmount" ? true : false,
  ].filter(Boolean).length;

  const hasActiveFilters = activeCount > 0;

  const salesmanOptions = React.useMemo(
    () => salesmen.map((s) => ({ label: s.name, value: String(s.id) })),
    [salesmen]
  );

  const customerOptions = React.useMemo(
    () =>
      customers.map((c) => ({
        label: c.code ? `${c.name} (${c.code})` : c.name,
        value: c.name,
      })),
    [customers]
  );

  const supplierOptions = React.useMemo(
    () => suppliers.map((s) => ({ label: s, value: s })),
    [suppliers]
  );

  const categoryOptions = React.useMemo(
    () => categories.map((c) => ({ label: c, value: c })),
    [categories]
  );

  const uomOptions = React.useMemo(
    () => [
      { label: "Pieces", value: "Pieces" },
      { label: "Box", value: "Box" },
    ],
    []
  );

  const priceTypeOptions = React.useMemo(
    () => priceTypes.map((p) => ({ label: p, value: p })),
    [priceTypes]
  );

  const isQuantityMode =
    filters.unitName?.toLowerCase() === "pieces" ||
    filters.unitName?.toLowerCase() === "box";

  return (
    <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center gap-1.5 pr-2.5 border-r border-border">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {activeCount > 0 && (
          <span className="flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none">
            {activeCount}
          </span>
        )}
      </div>

      {/* Year Filter */}
      <Select
        value={filters.year}
        onValueChange={(v) => setFilter("year", v)}
      >
        <SelectTrigger className="w-24 h-8 text-xs bg-background">
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

      {/* Month MultiSelect */}
      <MultiSelect
        mode="multi"
        placeholder="Month"
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
        className="w-36 h-8 text-xs bg-background"
      />

      {/* Salesman MultiSelect (Multiple Selection - Image 2) */}
      <MultiSelect
        mode="multi"
        placeholder="Salesman"
        options={salesmanOptions}
        value={
          filters.salesmanId === "NONE"
            ? []
            : filters.salesmanId
            ? filters.salesmanId.split("|")
            : salesmanOptions.map((s) => s.value)
        }
        onChange={(next) => {
          if (next.length === 0) {
            setFilter("salesmanId", "NONE");
          } else if (next.length === salesmanOptions.length) {
            setFilter("salesmanId", "");
          } else {
            setFilter("salesmanId", next.join("|"));
          }
        }}
        className="w-44 h-8 text-xs bg-background"
      />

      {/* Customer Single Selection Dropdown (Selection not multiple - Image 1) */}
      <MultiSelect
        mode="single"
        placeholder={isLoadingOptions ? "Loading customers..." : "Select customer..."}
        options={customerOptions}
        value={filters.customerName ? [filters.customerName] : []}
        onChange={(next) =>
          setFilter("customerName", next.length > 0 ? next[0] : "")
        }
        className="w-52 h-8 text-xs bg-background font-medium"
      />

      {/* Supplier MultiSelect */}
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
        className="w-40 h-8 text-xs bg-background"
      />

      {/* Category MultiSelect */}
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
        className="w-36 h-8 text-xs bg-background"
      />

      {/* UOM Filter */}
      <MultiSelect
        mode="single"
        placeholder="UOM"
        options={uomOptions}
        value={filters.unitName ? [filters.unitName] : []}
        onChange={(next) =>
          setFilter("unitName", next.length > 0 ? next[0] : "")
        }
        className="w-28 h-8 text-xs bg-background"
      />

      {/* Price Type MultiSelect */}
      <MultiSelect
        mode="multi"
        placeholder="Price Type"
        options={priceTypeOptions}
        value={
          filters.priceType === "NONE"
            ? []
            : filters.priceType
            ? filters.priceType.split("|")
            : priceTypes
        }
        onChange={(next) => {
          if (next.length === 0) {
            setFilter("priceType", "NONE");
          } else if (next.length === priceTypes.length) {
            setFilter("priceType", "");
          } else {
            setFilter("priceType", next.join("|"));
          }
        }}
        className="w-32 h-8 text-xs bg-background"
      />

      {/* Amount Metric Toggle */}
      <Select
        value={filters.amountType}
        disabled={isQuantityMode}
        onValueChange={(v) =>
          setFilter("amountType", v as "netAmount" | "soldAmount" | "returnedAmount")
        }
      >
        <SelectTrigger
          className={`w-36 h-8 text-xs bg-background ${
            isQuantityMode ? "opacity-60 cursor-not-allowed" : ""
          }`}
          title={isQuantityMode ? "Disabled in Quantity mode" : undefined}
        >
          <SelectValue
            placeholder={isQuantityMode ? "Quantity Mode" : "Metric Type"}
          />
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          <SelectItem value="soldAmount">Gross Amount</SelectItem>
          <SelectItem value="netAmount">Net Amount</SelectItem>
        </SelectContent>
      </Select>

      {/* Reset Filter Button */}
      <Button
        variant="destructive"
        size="sm"
        onClick={resetFilters}
        disabled={!hasActiveFilters}
        className="h-8 text-xs px-3 font-medium flex items-center gap-1.5"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset
      </Button>
    </div>
  );
}
