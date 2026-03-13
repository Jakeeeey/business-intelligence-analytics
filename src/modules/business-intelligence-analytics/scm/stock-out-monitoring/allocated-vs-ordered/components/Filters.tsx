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
  // Optional: provide raw records so this component can compute counts
  // taking the currently selected date range into account.
  records?: Record<string, unknown>[];
  // If your record fields use different names, override these.
  recordFieldNames?: {
    date?: string;
    supplier?: string;
    brand?: string;
    category?: string;
    status?: string;
    orderId?: string;
  };
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
  records,
  recordFieldNames,
}: FiltersProps) {
  // Debug incoming raw records + mapping
  React.useEffect(() => {
    console.log(
      "Filters mounted/updated — records count:",
      records?.length ?? 0,
    );
    console.log("Records sample:", records ? records.slice(0, 3) : []);
    console.log("recordFieldNames:", recordFieldNames);
  }, [records, recordFieldNames]);

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
    const next = checked
      ? [...current, value]
      : current.filter((v) => v !== value);
    console.log("filter change:", {
      field,
      value,
      checked,
      before: current,
      after: next,
    });
    onChange({ ...filters, [field]: next });
  };

  const clearFilter = (
    field: keyof Pick<
      AllocationFilters,
      "suppliers" | "brands" | "categories" | "statuses"
    >,
  ) => {
    console.log("clear filter:", field);
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

  // Helpers to derive a date range from filters (presets or custom)
  const parseISO = (s?: string) => (s ? new Date(s) : undefined);
  const getDateRange = React.useCallback(() => {
    const now = new Date();
    const startOf = (d: Date) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate());
    switch (filters.dateRangePreset) {
      case "yesterday": {
        const d = new Date(now);
        d.setDate(d.getDate() - 1);
        const from = startOf(d);
        const to = new Date(from);
        to.setHours(23, 59, 59, 999);
        return { from, to };
      }
      case "this-week": {
        // assume week starts Monday
        const d = startOf(now);
        const day = d.getDay() || 7; // Sunday -> 7
        const from = new Date(d);
        from.setDate(d.getDate() - (day - 1));
        const to = new Date(from);
        to.setDate(from.getDate() + 6);
        to.setHours(23, 59, 59, 999);
        return { from, to };
      }
      case "this-month": {
        const from = new Date(now.getFullYear(), now.getMonth(), 1);
        const to = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );
        return { from, to };
      }
      case "this-year": {
        const from = new Date(now.getFullYear(), 0, 1);
        const to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        return { from, to };
      }
      case "custom": {
        const from = parseISO(filters.dateFrom);
        const to = parseISO(filters.dateTo);
        if (from && to) {
          to.setHours(23, 59, 59, 999);
        }
        return { from, to };
      }
      default:
        return { from: undefined, to: undefined };
    }
  }, [filters.dateRangePreset, filters.dateFrom, filters.dateTo]);

  const setDatePreset = React.useCallback(
    (preset: DateRangePreset) => {
      console.log("dateRangePreset selected:", preset);
      onChange({ ...filters, dateRangePreset: preset });
    },
    [filters, onChange],
  );

  // If records are provided, compute counts scoped to the selected date range.
  const computedSupplierCounts: Record<string, number> | undefined =
    React.useMemo(() => {
      if (!records || records.length === 0) return undefined;
      const names = {
        date: "date",
        supplier: "supplier",
        brand: "brand",
        category: "category",
        status: "status",
        orderId: "orderId",
        ...(recordFieldNames || {}),
      };
      const { from, to } = getDateRange();
      const inRange = (d?: unknown) => {
        if (d === undefined || d === null) return false;
        const dt = d instanceof Date ? d : new Date(String(d));
        if (!(dt instanceof Date) || Number.isNaN(dt.getTime())) return false;
        if (from && dt < from) return false;
        if (to && dt > to) return false;
        return true;
      };

      // Count unique orderIds per supplier when possible; fallback to row count.
      const map = new Map<string, Set<string | number>>();
      const orderKey = names.orderId ?? "orderId";
      for (let i = 0; i < records.length; i++) {
        const r = records[i] as Record<string, unknown>;
        const dtRaw = r[names.date] as unknown;
        if (from || to) {
          if (!inRange(dtRaw)) continue;
        }
        const keyRaw = r[names.supplier] as unknown;
        const key = keyRaw == null ? undefined : String(keyRaw);
        if (!key) continue;
        const idRaw = r[orderKey] as unknown;
        const id =
          idRaw == null
            ? undefined
            : typeof idRaw === "number"
              ? idRaw
              : String(idRaw);
        if (!map.has(key)) map.set(key, new Set());
        if (id !== undefined) map.get(key)!.add(id);
        else map.get(key)!.add(`__row_${i}`);
      }
      const out: Record<string, number> = {};
      map.forEach((set, k) => {
        out[k] = set.size;
      });
      console.log("computedSupplierCounts:", { from, to, counts: out });
      return out;
    }, [records, recordFieldNames, getDateRange]);

  const computedBrandCounts: Record<string, number> | undefined =
    React.useMemo(() => {
      if (!records || records.length === 0) return undefined;
      const names = {
        date: "date",
        supplier: "supplier",
        brand: "brand",
        category: "category",
        status: "status",
        ...(recordFieldNames || {}),
      };
      const { from, to } = getDateRange();
      const inRange = (d?: unknown) => {
        if (d === undefined || d === null) return false;
        const dt = d instanceof Date ? d : new Date(String(d));
        if (!(dt instanceof Date) || Number.isNaN(dt.getTime())) return false;
        if (from && dt < from) return false;
        if (to && dt > to) return false;
        return true;
      };
      // Deduplicate by orderId when available
      const map = new Map<string, Set<string | number>>();
      const orderKey = names.orderId ?? "orderId";
      for (let i = 0; i < records.length; i++) {
        const r = records[i] as Record<string, unknown>;
        const dtRaw = r[names.date] as unknown;
        if (from || to) {
          if (!inRange(dtRaw)) continue;
        }
        const keyRaw = r[names.brand] as unknown;
        const key = keyRaw == null ? undefined : String(keyRaw);
        if (!key) continue;
        const idRaw = r[orderKey] as unknown;
        const id =
          idRaw == null
            ? undefined
            : typeof idRaw === "number"
              ? idRaw
              : String(idRaw);
        if (!map.has(key)) map.set(key, new Set());
        if (id !== undefined) map.get(key)!.add(id);
        else map.get(key)!.add(`__row_${i}`);
      }
      const out: Record<string, number> = {};
      map.forEach((set, k) => {
        out[k] = set.size;
      });
      console.log("computedBrandCounts:", { from, to, counts: out });
      return out;
    }, [records, recordFieldNames, getDateRange]);

  const computedCategoryCounts: Record<string, number> | undefined =
    React.useMemo(() => {
      if (!records || records.length === 0) return undefined;
      const names = {
        date: "date",
        supplier: "supplier",
        brand: "brand",
        category: "category",
        status: "status",
        ...(recordFieldNames || {}),
      };
      const { from, to } = getDateRange();
      const inRange = (d?: unknown) => {
        if (d === undefined || d === null) return false;
        const dt = d instanceof Date ? d : new Date(String(d));
        if (!(dt instanceof Date) || Number.isNaN(dt.getTime())) return false;
        if (from && dt < from) return false;
        if (to && dt > to) return false;
        return true;
      };
      // Deduplicate by orderId when available
      const map = new Map<string, Set<string | number>>();
      const orderKey = names.orderId ?? "orderId";
      for (let i = 0; i < records.length; i++) {
        const r = records[i] as Record<string, unknown>;
        const dtRaw = r[names.date] as unknown;
        if (from || to) {
          if (!inRange(dtRaw)) continue;
        }
        const keyRaw = r[names.category] as unknown;
        const key = keyRaw == null ? undefined : String(keyRaw);
        if (!key) continue;
        const idRaw = r[orderKey] as unknown;
        const id =
          idRaw == null
            ? undefined
            : typeof idRaw === "number"
              ? idRaw
              : String(idRaw);
        if (!map.has(key)) map.set(key, new Set());
        if (id !== undefined) map.get(key)!.add(id);
        else map.get(key)!.add(`__row_${i}`);
      }
      const out: Record<string, number> = {};
      map.forEach((set, k) => {
        out[k] = set.size;
      });
      console.log("computedCategoryCounts:", { from, to, counts: out });
      return out;
    }, [records, recordFieldNames, getDateRange]);

  const computedStatusCounts: Record<string, number> | undefined =
    React.useMemo(() => {
      if (!records || records.length === 0) return undefined;
      const names = {
        date: "date",
        supplier: "supplier",
        brand: "brand",
        category: "category",
        status: "status",
        ...(recordFieldNames || {}),
      };
      const { from, to } = getDateRange();
      const inRange = (d?: unknown) => {
        if (d === undefined || d === null) return false;
        const dt = d instanceof Date ? d : new Date(String(d));
        if (!(dt instanceof Date) || Number.isNaN(dt.getTime())) return false;
        if (from && dt < from) return false;
        if (to && dt > to) return false;
        return true;
      };
      // Deduplicate by orderId when available
      const map = new Map<string, Set<string | number>>();
      const orderKey = names.orderId ?? "orderId";
      for (let i = 0; i < records.length; i++) {
        const r = records[i] as Record<string, unknown>;
        const dtRaw = r[names.date] as unknown;
        if (from || to) {
          if (!inRange(dtRaw)) continue;
        }
        const keyRaw = r[names.status] as unknown;
        const key = keyRaw == null ? undefined : String(keyRaw);
        if (!key) continue;
        const idRaw = r[orderKey] as unknown;
        const id =
          idRaw == null
            ? undefined
            : typeof idRaw === "number"
              ? idRaw
              : String(idRaw);
        if (!map.has(key)) map.set(key, new Set());
        if (id !== undefined) map.get(key)!.add(id);
        else map.get(key)!.add(`__row_${i}`);
      }
      const out: Record<string, number> = {};
      map.forEach((set, k) => {
        out[k] = set.size;
      });
      console.log("computedStatusCounts:", { from, to, counts: out });
      return out;
    }, [records, recordFieldNames, getDateRange]);

  return (
    <Card className="dark:border-zinc-700 dark:bg-white/13">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Allocated vs Ordered Dashboard
              </h2>
              <p className="text-sm text-muted-foreground">
                Monitor inventory allocation shortages vs ordered quantities
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
                  <Label htmlFor="avo-dateFrom">Date From</Label>
                  <Input
                    id="avo-dateFrom"
                    type="date"
                    className="dark:border-zinc-700"
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
                  className="w-80 p-0 dark:border-zinc-700"
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
                  <ScrollArea className="h-64">
                    <div className="p-2 space-y-1 dark:bg-white/13">
                      {filteredSuppliers.map((supplier) => (
                        <div
                          key={supplier}
                          className="flex items-center space-x-2 px-2 py-1 hover:bg-muted rounded"
                        >
                          <Checkbox
                            className="dark:border-zinc-700"
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
                            className="text-sm leading-none cursor-pointer flex-1"
                          >
                            {supplier}
                          </label>
                          {(computedSupplierCounts || supplierCounts) && (
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {computedSupplierCounts?.[supplier] ??
                                supplierCounts?.[supplier] ??
                                0}
                            </span>
                          )}
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
                  className="w-80 p-0 dark:border-zinc-700"
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
                  <ScrollArea className="h-64">
                    <div className="p-2 space-y-1 dark:bg-white/13">
                      {filteredBrands.map((brand) => (
                        <div
                          key={brand}
                          className="flex items-center space-x-2 px-2 py-1 hover:bg-muted rounded"
                        >
                          <Checkbox
                            className="dark:border-zinc-700"
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
                            className="text-sm leading-none cursor-pointer flex-1"
                          >
                            {brand}
                          </label>
                          {(computedBrandCounts || brandCounts) && (
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {computedBrandCounts?.[brand] ??
                                brandCounts?.[brand] ??
                                0}
                            </span>
                          )}
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
                  className="w-80 p-0 dark:border-zinc-700"
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
                  <ScrollArea className="h-64">
                    <div className="p-2 space-y-1 dark:bg-white/13">
                      {filteredCategories.map((category) => (
                        <div
                          key={category}
                          className="flex items-center space-x-2 px-2 py-1 hover:bg-muted rounded"
                        >
                          <Checkbox
                            className="dark:border-zinc-700"
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
                            className="text-sm leading-none cursor-pointer flex-1"
                          >
                            {category}
                          </label>
                          {(computedCategoryCounts || categoryCounts) && (
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {computedCategoryCounts?.[category] ??
                                categoryCounts?.[category] ??
                                0}
                            </span>
                          )}
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
                  className="w-80 p-0 dark:border-zinc-700"
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
                  <ScrollArea className="h-64">
                    <div className="p-2 space-y-1 dark:bg-white/13">
                      {filteredStatuses.map((status) => (
                        <div
                          key={status}
                          className="flex items-center space-x-2 px-2 py-1 hover:bg-muted rounded"
                        >
                          <Checkbox
                            className="dark:border-zinc-700"
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
                            className="text-sm leading-none cursor-pointer flex-1"
                          >
                            {status}
                          </label>
                          {(computedStatusCounts || statusCounts) && (
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {computedStatusCounts?.[status] ??
                                statusCounts?.[status] ??
                                0}
                            </span>
                          )}
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
