// src/modules/business-intelligence-analytics/scm/stock-out-monitoring/orders-vs-consolidated/components/Filters.tsx
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { OrdersFilters } from "../types";
// import { exportToExcel } from "../utils/exportCsv";

type FiltersProps = {
  filters: OrdersFilters;
  onChange: (filters: OrdersFilters) => void;
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
      OrdersFilters,
      "suppliers" | "brands" | "categories" | "statuses"
    >,
    value: string,
    checked: boolean,
  ) => {
    const current = (filters[field] as string[]) || [];
    const next = checked
      ? [...current, value]
      : current.filter((v) => v !== value);
    onChange({ ...filters, [field]: next });
  };

  const clearFilter = (
    field: keyof Pick<
      OrdersFilters,
      "suppliers" | "brands" | "categories" | "statuses"
    >,
  ) => {
    onChange({ ...filters, [field]: [] });
  };

  const filteredSuppliers = supplierSearch
    ? uniqueSuppliers.filter((s) =>
        s.toLowerCase().includes(supplierSearch.toLowerCase()),
      )
    : uniqueSuppliers;

  const filteredBrands = brandSearch
    ? uniqueBrands.filter((b) =>
        b.toLowerCase().includes(brandSearch.toLowerCase()),
      )
    : uniqueBrands;

  const filteredCategories = categorySearch
    ? uniqueCategories.filter((c) =>
        c.toLowerCase().includes(categorySearch.toLowerCase()),
      )
    : uniqueCategories;

  const filteredStatuses = statusSearch
    ? uniqueStatuses.filter((s) =>
        s.toLowerCase().includes(statusSearch.toLowerCase()),
      )
    : uniqueStatuses;

  const hasActiveFilters =
    filters.suppliers.length > 0 ||
    filters.brands.length > 0 ||
    filters.categories.length > 0 ||
    filters.statuses.length > 0;

  return (
    <Card className="dark:border-zinc-700 dark:bg-white/13">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Orders vs Consolidated Dashboard
              </h2>
              <p className="text-sm text-muted-foreground">
                Track order consolidation status and identify processing
                backlogs
              </p>
            </div>
          </div>

          {/* Date Range Presets */}
          <div className="space-y-3">
            <Label>Date Range</Label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  "yesterday",
                  "this-week",
                  "this-month",
                  "this-year",
                  "custom",
                ] as const
              ).map((preset) => (
                <Button
                  key={preset}
                  className="dark:border-zinc-700"
                  variant={
                    filters.dateRangePreset === preset ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    onChange({ ...filters, dateRangePreset: preset })
                  }
                >
                  {preset === "yesterday"
                    ? "Yesterday"
                    : preset === "this-week"
                      ? "This Week"
                      : preset === "this-month"
                        ? "This Month"
                        : preset === "this-year"
                          ? "This Year"
                          : "Custom"}
                </Button>
              ))}
            </div>

            {/* Custom Date Inputs */}
            {filters.dateRangePreset === "custom" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="ovc-dateFrom">Date From</Label>
                  <Input
                    id="ovc-dateFrom"
                    type="date"
                    className="dark:border-zinc-700"
                    value={filters.dateFrom}
                    onChange={(e) =>
                      onChange({ ...filters, dateFrom: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ovc-dateTo">Date To</Label>
                  <Input
                    id="ovc-dateTo"
                    type="date"
                    className="dark:border-zinc-700"
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
                  <Button
                    variant="outline"
                    className="w-full justify-between dark:border-zinc-700"
                  >
                    {filters.suppliers.length > 0
                      ? `${filters.suppliers.length} selected`
                      : "All Suppliers"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 max-w-[20rem] p-0 dark:border-zinc-700 overflow-hidden"
                  align="start"
                >
                  <div className="p-2 border-b dark:border-zinc-700 dark:bg-white/13">
                    <Input
                      placeholder="Search suppliers..."
                      value={supplierSearch}
                      onChange={(e) => setSupplierSearch(e.target.value)}
                      className="h-8 dark:border-zinc-700"
                    />
                  </div>
                  <ScrollArea className="h-64  ">
                    <div className="p-2 space-y-1 dark:bg-white/13">
                      {filteredSuppliers.map((supplier) => (
                        <div
                          key={supplier}
                          className="flex items-center justify-between px-2 py-1 hover:bg-muted rounded gap-2 w-75"
                        >
                          <div className="flex items-center space-x-2 min-w-0 flex-1 overflow-hidden">
                            <Checkbox
                              className="dark:border-zinc-700 shrink-0"
                              id={`ovc-supplier-${supplier}`}
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
                              htmlFor={`ovc-supplier-${supplier}`}
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
                  <Button
                    variant="outline"
                    className="w-full justify-between dark:border-zinc-700"
                  >
                    {filters.brands.length > 0
                      ? `${filters.brands.length} selected`
                      : "All Brands"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 max-w-[20rem] p-0 dark:border-zinc-700 overflow-hidden"
                  align="start"
                >
                  <div className="p-2 border-b dark:border-zinc-700 dark:bg-white/13">
                    <Input
                      placeholder="Search brands..."
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="h-8 dark:border-zinc-700"
                    />
                  </div>
                  <ScrollArea className="h-64 w-full">
                    <div className="p-2 space-y-1 dark:bg-white/13">
                      {filteredBrands.map((brand) => (
                        <div
                          key={brand}
                          className="flex items-center justify-between px-2 py-1 hover:bg-muted rounded gap-2 w-full"
                        >
                          <div className="flex items-center space-x-2 min-w-0 flex-1 overflow-hidden">
                            <Checkbox
                              className="dark:border-zinc-700 shrink-0"
                              id={`ovc-brand-${brand}`}
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
                              htmlFor={`ovc-brand-${brand}`}
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
                  <Button
                    variant="outline"
                    className="w-full justify-between dark:border-zinc-700"
                  >
                    {filters.categories.length > 0
                      ? `${filters.categories.length} selected`
                      : "All Categories"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 max-w-[20rem] p-0 dark:border-zinc-700 overflow-hidden"
                  align="start"
                >
                  <div className="p-2 border-b dark:border-zinc-700 dark:bg-white/13">
                    <Input
                      placeholder="Search categories..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="h-8 dark:border-zinc-700"
                    />
                  </div>
                  <ScrollArea className="h-64 w-full">
                    <div className="p-2 space-y-1 dark:bg-white/13">
                      {filteredCategories.map((category) => (
                        <div
                          key={category}
                          className="flex items-center justify-between px-2 py-1 hover:bg-muted rounded gap-2 w-full"
                        >
                          <div className="flex items-center space-x-2 min-w-0 flex-1 overflow-hidden">
                            <Checkbox
                              className="dark:border-zinc-700 shrink-0"
                              id={`ovc-category-${category}`}
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
                              htmlFor={`ovc-category-${category}`}
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
                  <Button
                    variant="outline"
                    className="w-full justify-between dark:border-zinc-700"
                  >
                    {filters.statuses.length > 0
                      ? `${filters.statuses.length} selected`
                      : "All Statuses"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 max-w-[20rem] p-0 dark:border-zinc-700 overflow-hidden"
                  align="start"
                >
                  <div className="p-2 border-b dark:border-zinc-700 dark:bg-white/13">
                    <Input
                      placeholder="Search statuses..."
                      value={statusSearch}
                      onChange={(e) => setStatusSearch(e.target.value)}
                      className="h-8 dark:border-zinc-700"
                    />
                  </div>
                  <ScrollArea className="h-64 w-full">
                    <div className="p-2 space-y-1 dark:bg-white/13">
                      {filteredStatuses.map((status) => (
                        <div
                          key={status}
                          className="flex items-center justify-between px-2 py-1 hover:bg-muted rounded gap-2 w-full"
                        >
                          <div className="flex items-center space-x-2 min-w-0 flex-1 overflow-hidden">
                            <Checkbox
                              className="dark:border-zinc-700 shrink-0"
                              id={`ovc-status-${status}`}
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
                              htmlFor={`ovc-status-${status}`}
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
