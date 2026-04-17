// src/modules/business-intelligence-analytics/scm/stock-out-monitoring/allocated-vs-ordered/components/Filters.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AllocationFilters, DateRangePreset } from "../types";
// import { exportToExcel } from "../utils/exportCsv";

type FiltersProps = {
  filters: AllocationFilters;
  onChange: (filters: AllocationFilters) => void;
  uniqueSuppliers: string[];
  uniqueBrands: string[];
  uniqueCategories: string[];
  uniqueStatuses: string[];
  supplierCounts?: Record<string, number>;
  brandCounts?: Record<string, number>;
  categoryCounts?: Record<string, number>;
  statusCounts?: Record<string, number>;
};

export function Filters({
  filters,
  onChange,
  uniqueSuppliers,
  uniqueBrands,
  uniqueCategories,
  uniqueStatuses,
  supplierCounts,
  brandCounts,
  categoryCounts,
  statusCounts,
}: FiltersProps) {
  // Search states
  const [supplierSearch, setSupplierSearch] = React.useState("");
  const [brandSearch, setBrandSearch] = React.useState("");
  const [categorySearch, setCategorySearch] = React.useState("");
  const [statusSearch, setStatusSearch] = React.useState("");

  const handleMultiSelectChange = (
    field: keyof Pick<
      AllocationFilters,
      "suppliers" | "brands" | "categories" | "statuses"
    >,
    value: string,
    checked: boolean,
  ) => {
    const current = (filters[field] as string[]) || [];
    const next = checked ? [...current, value] : current.filter((v) => v !== value);
    onChange({ ...filters, [field]: next });
  };

  const clearFilter = (
    field: keyof Pick<
      AllocationFilters,
      "suppliers" | "brands" | "categories" | "statuses"
    >,
  ) => {
    onChange({ ...filters, [field]: [] });
  };

  const filteredSuppliers = supplierSearch
    ? uniqueSuppliers.filter((s) => s.toLowerCase().includes(supplierSearch.toLowerCase()))
    : uniqueSuppliers;

  const filteredBrands = brandSearch
    ? uniqueBrands.filter((b) => b.toLowerCase().includes(brandSearch.toLowerCase()))
    : uniqueBrands;

  const filteredCategories = categorySearch
    ? uniqueCategories.filter((c) => c.toLowerCase().includes(categorySearch.toLowerCase()))
    : uniqueCategories;

  const STATUS_ORDER = [
    "For Approval",
    "For Consolidation",
    "For Picking",
    "For Invoicing",
    "For Loading",
    "For Shipping",
    "En Route",
    "Delivered",
    "On Hold",
    "Cancelled",
    "Not Fulfilled",
  ];
  const sortedStatuses = [...uniqueStatuses].sort((a, b) => {
    const ai = STATUS_ORDER.indexOf(a);
    const bi = STATUS_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const filteredStatuses = statusSearch
    ? sortedStatuses.filter((s) => s.toLowerCase().includes(statusSearch.toLowerCase()))
    : sortedStatuses;

  // Module-relevant default statuses for Allocated vs Ordered
  const DEFAULT_MODULE_STATUSES = [
    "For Approval",
    "For Consolidation",
    "For Picking",
    "For Loading",
    "For Shipping",
    "En Route",
    "Delivered",
    "On Hold",
    "Cancelled",
    "Not Fulfilled",
  ];

  const [showAllStatuses] = React.useState(false);

  const displayedStatuses = showAllStatuses
    ? filteredStatuses
    : filteredStatuses.filter((s) => DEFAULT_MODULE_STATUSES.includes(s));

  const hasActiveFilters =
    filters.suppliers.length > 0 ||
    filters.brands.length > 0 ||
    filters.categories.length > 0 ||
    filters.statuses.length > 0;

  // Helper: format display ranges for presets (used in menu labels)
  const formatShort = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const startOfWeekMonday = (d: Date) => {
    const day = d.getDay();
    const daysFromMonday = (day + 6) % 7;
    const s = new Date(d);
    s.setDate(d.getDate() - daysFromMonday);
    s.setHours(0, 0, 0, 0);
    return s;
  };

  const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
  const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const startOfQuarter = (d: Date) => new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
  const endOfQuarter = (d: Date) => {
    const s = startOfQuarter(d);
    return new Date(s.getFullYear(), s.getMonth() + 3, 0);
  };
  const startOfYear = (d: Date) => new Date(d.getFullYear(), 0, 1);
  const endOfYear = (d: Date) => new Date(d.getFullYear(), 11, 31);

  const addDays = (d: Date, n: number) => {
    const r = new Date(d);
    r.setDate(d.getDate() + n);
    r.setHours(0, 0, 0, 0);
    return r;
  };

  const addMonths = (d: Date, n: number) => {
    const r = new Date(d);
    r.setMonth(d.getMonth() + n);
    r.setHours(0, 0, 0, 0);
    return r;
  };

  const getDisplayRange = (preset: DateRangePreset) => {
    const now = new Date();
    let from: Date = new Date(now);
    let to: Date = new Date(now);
    switch (preset) {
      case "this-week":
        from = startOfWeekMonday(now);
        to = addDays(from, 6);
        break;
      case "last-week": {
        const thisWs = startOfWeekMonday(now);
        from = addDays(thisWs, -7);
        to = addDays(from, 6);
        break;
      }
      case "last-7-days":
        from = addDays(now, -6);
        to = now;
        break;
      case "last-2-weeks":
        from = addDays(now, -14);
        to = now;
        break;
      case "this-month":
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case "last-month":
        from = startOfMonth(addMonths(now, -1));
        to = endOfMonth(addMonths(now, -1));
        break;
      case "last-30-days":
        from = addDays(now, -29);
        to = now;
        break;
      case "last-2-months":
        from = addDays(now, -59);
        to = now;
        break;
      case "this-quarter":
        from = startOfQuarter(now);
        to = endOfQuarter(now);
        break;
      case "last-quarter": {
        const qs = startOfQuarter(now);
        from = addMonths(qs, -3);
        to = endOfQuarter(addMonths(now, -3));
        break;
      }
      case "last-3-months":
        from = addDays(now, -90);
        to = now;
        break;
      case "last-2-quarters": {
        const qs = startOfQuarter(now);
        const lastQStart = addMonths(qs, -3);
        from = addMonths(lastQStart, -3);
        to = endOfQuarter(addMonths(now, -3));
        break;
      }
      case "this-year":
        from = startOfYear(now);
        to = endOfYear(now);
        break;
      case "today":
        from = now;
        to = now;
        break;
      case "yesterday":
        from = addDays(now, -1);
        to = from;
        break;
      case "day-before-yesterday":
        from = addDays(now, -2);
        to = from;
        break;
      case "last-year":
        from = new Date(now.getFullYear() - 1, 0, 1);
        to = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        return "";
    }
    const f = formatShort(from);
    const t = formatShort(to);
    return f === t ? f : `${f} – ${t}`;
  };

  const formatIso = (iso: string) => {
    try {
      return formatShort(new Date(iso));
    } catch {
      return iso;
    }
  };
  const labelForPreset = (preset: DateRangePreset) => {
    switch (preset) {
      case "today":
        return "Today";
      case "yesterday":
        return "Yesterday";
      case "day-before-yesterday":
        return "Day Before Yesterday";
      case "this-week":
        return "This Week";
      case "last-week":
        return "Last Week";
      case "last-7-days":
        return "Last 7 Days";
      case "last-2-weeks":
        return "Last 2 Weeks";
      case "this-month":
        return "This Month";
      case "last-month":
        return "Last Month";
      case "last-30-days":
        return "Last 30 Days";
      case "last-2-months":
        return "Last 2 Months";
      case "this-quarter":
        return "This Quarter";
      case "last-quarter":
        return "Last Quarter";
      case "last-3-months":
        return "Last 3 Months";
      case "last-2-quarters":
        return "Last 2 Quarters";
      case "this-year":
        return "This Year";
      case "last-year":
        return "Last Year";
      default:
        return String(preset);
    }
  };

  const getActivePresetDisplay = () => {
    const p = filters.dateRangePreset as DateRangePreset;
    if (!p) return "";
    if (p === "custom") {
      if (filters.dateFrom && filters.dateTo) {
        const f = formatIso(filters.dateFrom);
        const t = formatIso(filters.dateTo);
        return f === t ? `Custom — ${f}` : `Custom — ${f} – ${t}`;
      }
      return "Custom";
    }
    const label = labelForPreset(p);
    const range = getDisplayRange(p as DateRangePreset);
    return range ? `${label} — ${range}` : label;
  };

  return (
    <Card className="">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Allocated vs Ordered Dashboard</h2>
              <p className="text-sm text-muted-foreground">
                Monitor inventory allocation shortages vs ordered quantities
              </p>
            </div>
          </div>

          {/* Date Range Presets — grouped dropdowns */}
          <div className="space-y-3">
            <Label>Date Range</Label>
            <div className="flex flex-wrap gap-2 items-center">
              {/* Daily */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">Daily ▾</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {([0, 1, 2, 3, 4, 5, 6] as number[]).map((offset) => {
                    const d = new Date();
                    d.setDate(d.getDate() - offset);
                    const label =
                      offset === 0
                        ? "Today"
                        : `${offset} Day${offset > 1 ? "s" : ""} Ago`;
                    const dateKey = `${d.getFullYear()}-${String(
                      d.getMonth() + 1,
                    ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                    const display = d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                    const isActive =
                      filters.dateFrom === dateKey && filters.dateTo === dateKey;
                    return (
                      <DropdownMenuItem
                        key={offset}
                        className={isActive ? "bg-primary text-primary-foreground" : ""}
                        onClick={() => {
                          if (offset === 0)
                            onChange({ ...filters, dateRangePreset: "today" });
                          else if (offset === 1)
                            onChange({ ...filters, dateRangePreset: "yesterday" });
                          else if (offset === 2)
                            onChange({
                              ...filters,
                              dateRangePreset: "day-before-yesterday",
                            });
                          else
                            onChange({
                              ...filters,
                              dateRangePreset: "custom",
                              dateFrom: dateKey,
                              dateTo: dateKey,
                            });
                        }}
                      >
                        {label} ({display})
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Weekly */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">Weekly ▾</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {[
                    { key: "this-week", label: "This Week" },
                    { key: "last-week", label: "Last Week" },
                    { key: "last-7-days", label: "Last 7 Days" },
                    { key: "last-2-weeks", label: "Last 2 Weeks" },
                  ].map(({ key, label }) => (
                    <DropdownMenuItem
                      key={key}
                      className={
                        filters.dateRangePreset === key
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }
                      onClick={() =>
                        onChange({ ...filters, dateRangePreset: key as DateRangePreset })
                      }
                    >
                      {label} ({getDisplayRange(key as DateRangePreset)})
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Monthly */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">Monthly ▾</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {[
                    { key: "this-month", label: "This Month" },
                    { key: "last-month", label: "Last Month" },
                    { key: "last-30-days", label: "Last 30 Days" },
                    { key: "last-2-months", label: "Last 2 Months" },
                  ].map(({ key, label }) => (
                    <DropdownMenuItem
                      key={key}
                      className={
                        filters.dateRangePreset === key
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }
                      onClick={() =>
                        onChange({ ...filters, dateRangePreset: key as DateRangePreset })
                      }
                    >
                      {label} ({getDisplayRange(key as DateRangePreset)})
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Quarterly */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">Quarterly ▾</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {[
                    { key: "this-quarter", label: "This Quarter" },
                    { key: "last-quarter", label: "Last Quarter" },
                    { key: "last-3-months", label: "Last 3 Months" },
                    { key: "last-2-quarters", label: "Last 2 Quarters" },
                  ].map(({ key, label }) => (
                    <DropdownMenuItem
                      key={key}
                      className={
                        filters.dateRangePreset === key
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }
                      onClick={() =>
                        onChange({ ...filters, dateRangePreset: key as DateRangePreset })
                      }
                    >
                      {label} ({getDisplayRange(key as DateRangePreset)})
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Yearly */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">Yearly ▾</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {[
                    { key: "this-year", label: "This Year" },
                    { key: "last-year", label: "Last Year" },
                  ].map(({ key, label }) => (
                    <DropdownMenuItem
                      key={key}
                      className={
                        filters.dateRangePreset === key
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }
                      onClick={() =>
                        onChange({ ...filters, dateRangePreset: key as DateRangePreset })
                      }
                    >
                      {label} ({getDisplayRange(key as DateRangePreset)})
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Custom */}
              <Button
                variant={
                  filters.dateRangePreset === "custom" ? "default" : "outline"
                }
                size="sm"
                onClick={() => onChange({ ...filters, dateRangePreset: "custom" })}
              >
                Custom
              </Button>
              <Badge variant="secondary" className="ml-2">
                Current Date Filter: <span className="font-bold">{getActivePresetDisplay()}</span>
              </Badge>
            </div>

            {/* Custom Date Inputs */}
            {filters.dateRangePreset === "custom" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="avo-dateFrom">Date From</Label>
                  <Input
                    id="avo-dateFrom"
                    type="date"
                    className=""
                    value={filters.dateFrom}
                    onChange={(e) =>
                      onChange({ ...filters, dateFrom: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avo-dateTo">Date To</Label>
                  <Input
                    id="avo-dateTo"
                    type="date"
                    className=""
                    value={filters.dateTo}
                    onChange={(e) =>
                      onChange({ ...filters, dateTo: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Filter Dropdowns — 4-column grid matching PSP style */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Supplier */}
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between ">
                    {filters.suppliers.length > 0
                      ? `${filters.suppliers.length} selected`
                      : "All Suppliers"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 " align="start">
                  <div className="p-2 border-b ">
                    <Input
                      placeholder="Search suppliers..."
                      value={supplierSearch}
                      onChange={(e) => setSupplierSearch(e.target.value)}
                      className="h-8 "
                    />
                  </div>
                  <ScrollArea className="h-64">
                    <div className="p-2 space-y-1 ">
                      {filteredSuppliers.map((supplier) => (
                        <div
                          key={supplier}
                          className="flex items-center justify-between px-2 py-1 hover:bg-muted rounded gap-2 w-75"
                          >
                          <div className="flex items-center space-x-2 min-w-0 flex-1 overflow-hidden">
                            <Checkbox
                              className=" shrink-0"
                              id={`avo-supplier-${supplier}`}
                              checked={filters.suppliers.includes(supplier)}
                              onCheckedChange={(checked) =>
                                handleMultiSelectChange(
                                  "suppliers",
                                  supplier,
                                  !!checked,
                                )
                              }
                            />
                            <label
                              htmlFor={`avo-supplier-${supplier}`}
                              className="text-sm leading-none cursor-pointer truncate"
                            >
                              {supplier}
                            </label>
                          </div>
                          <span className="text-xs tabular-nums font-medium text-muted-foreground shrink-0">
                            {supplierCounts?.[supplier] ?? 0}
                          </span>
                        </div>
                      ))}
                      {filteredSuppliers.length === 0 && (
                        <p className="text-xs text-muted-foreground py-2 text-center">
                          No options found
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {filters.suppliers.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter("suppliers")}
                  className="h-6 px-2 text-xs"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Brand */}
            <div className="space-y-2">
              <Label>Brand</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between ">
                    {filters.brands.length > 0
                      ? `${filters.brands.length} selected`
                      : "All Brands"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 max-w-[20rem] p-0  overflow-hidden" align="start">
                  <div className="p-2 border-b ">
                    <Input
                      placeholder="Search brands..."
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="h-8 "
                    />
                  </div>
                  <ScrollArea className="h-64  ">
                    <div className="p-2 space-y-1 ">
                      {filteredBrands.map((brand) => (
                        <div
                          key={brand}
                          className="flex items-center justify-between px-2 py-1 hover-bg-muted rounded gap-2 w-full"
                        >
                          <div className="flex items-center space-x-2 min-w-0 flex-1 overflow-hidden">
                            <Checkbox
                              className=" shrink-0"
                              id={`avo-brand-${brand}`}
                              checked={filters.brands.includes(brand)}
                              onCheckedChange={(checked) =>
                                handleMultiSelectChange(
                                  "brands",
                                  brand,
                                  !!checked,
                                )
                              }
                            />
                            <label
                              htmlFor={`avo-brand-${brand}`}
                              className="text-sm leading-none cursor-pointer truncate"
                            >
                              {brand}
                            </label>
                          </div>
                          <span className="text-xs tabular-nums font-medium text-muted-foreground shrink-0">
                            {brandCounts?.[brand] ?? 0}
                          </span>
                        </div>
                      ))}
                      {filteredBrands.length === 0 && (
                        <p className="text-xs text-muted-foreground py-2 text-center">
                          No options found
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {filters.brands.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter("brands")}
                  className="h-6 px-2 text-xs"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between ">
                    {filters.categories.length > 0
                      ? `${filters.categories.length} selected`
                      : "All Categories"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 max-w-[20rem] p-0  overflow-hidden" align="start">
                  <div className="p-2 border-b ">
                    <Input
                      placeholder="Search categories..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="h-8 "
                    />
                  </div>
                  <ScrollArea className="h-64 w-full">
                    <div className="p-2 space-y-1 ">
                      {filteredCategories.map((category) => (
                        <div
                          key={category}
                          className="flex items-center justify-between px-2 py-1 hover:bg-muted rounded gap-2 w-full"
                        >
                          <div className="flex items-center space-x-2 min-w-0 flex-1 overflow-hidden">
                            <Checkbox
                              className=" shrink-0"
                              id={`avo-category-${category}`}
                              checked={filters.categories.includes(category)}
                              onCheckedChange={(checked) =>
                                handleMultiSelectChange(
                                  "categories",
                                  category,
                                  !!checked,
                                )
                              }
                            />
                            <label
                              htmlFor={`avo-category-${category}`}
                              className="text-sm leading-none cursor-pointer truncate"
                            >
                              {category}
                            </label>
                          </div>
                          <span className="text-xs tabular-nums font-medium text-muted-foreground shrink-0">
                            {categoryCounts?.[category] ?? 0}
                          </span>
                        </div>
                      ))}
                      {filteredCategories.length === 0 && (
                        <p className="text-xs text-muted-foreground py-2 text-center">
                          No options found
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {filters.categories.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter("categories")}
                  className="h-6 px-2 text-xs"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between ">
                    {filters.statuses.length > 0
                      ? `${filters.statuses.length} selected`
                      : "All Statuses"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 max-w-[20rem] p-0  overflow-hidden" align="start">
                  <div className="p-2 border-b ">
                    <Input
                      placeholder="Search statuses..."
                      value={statusSearch}
                      onChange={(e) => setStatusSearch(e.target.value)}
                      className="h-8 "
                    />
                    {/* <div className="flex items-center gap-2 pt-2">
                      <Checkbox
                        id="avo-show-all-statuses"
                        checked={showAllStatuses}
                        onCheckedChange={(v) => setShowAllStatuses(!!v)}
                      />
                      <label htmlFor="avo-show-all-statuses" className="text-xs">
                        Show all statuses
                      </label>
                    </div> */}
                  </div>
                  <ScrollArea className="h-64 w-full">
                    <div className="p-2 space-y-1 ">
                      {displayedStatuses.map((status) => (
                        <div
                          key={status}
                          className="flex items-center justify-between px-2 py-1 hover:bg-muted rounded gap-2 w-full"
                        >
                          <div className="flex items-center space-x-2 min-w-0 flex-1 overflow-hidden">
                            <Checkbox
                              className=" shrink-0"
                              id={`avo-status-${status}`}
                              checked={filters.statuses.includes(status)}
                              onCheckedChange={(checked) =>
                                handleMultiSelectChange(
                                  "statuses",
                                  status,
                                  !!checked,
                                )
                              }
                            />
                            <label
                              htmlFor={`avo-status-${status}`}
                              className="text-sm leading-none cursor-pointer truncate"
                            >
                              {status}
                            </label>
                          </div>
                          <span className="text-xs tabular-nums font-medium text-muted-foreground shrink-0">
                            {statusCounts?.[status] ?? 0}
                          </span>
                        </div>
                      ))}
                      {filteredStatuses.length === 0 && (
                        <p className="text-xs text-muted-foreground py-2 text-center">
                          No options found
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {filters.statuses.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter("statuses")}
                  className="h-6 px-2 text-xs"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Active filter badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {filters.suppliers.map((s) => (
                <Badge key={`sup-${s}`} variant="secondary">
                  Supplier: {s}
                  <button
                    onClick={() =>
                      onChange({
                        ...filters,
                        suppliers: filters.suppliers.filter((x) => x !== s),
                      })
                    }
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.brands.map((b) => (
                <Badge key={`brd-${b}`} variant="secondary">
                  Brand: {b}
                  <button
                    onClick={() =>
                      onChange({
                        ...filters,
                        brands: filters.brands.filter((x) => x !== b),
                      })
                    }
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.categories.map((c) => (
                <Badge key={`cat-${c}`} variant="secondary">
                  Category: {c}
                  <button
                    onClick={() =>
                      onChange({
                        ...filters,
                        categories: filters.categories.filter((x) => x !== c),
                      })
                    }
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.statuses.map((st) => (
                <Badge key={`sta-${st}`} variant="secondary">
                  Status: {st}
                  <button
                    onClick={() =>
                      onChange({
                        ...filters,
                        statuses: filters.statuses.filter((x) => x !== st),
                      })
                    }
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
