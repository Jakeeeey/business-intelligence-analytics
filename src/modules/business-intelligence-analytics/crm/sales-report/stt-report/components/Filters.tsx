// src/modules/business-intelligence-analytics/sales-report/sales-report-summary/components/Filters.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { STTReportFilters, STTReportRecord } from "../types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { exportToExcel } from "../utils/exportCsv";

type FiltersProps = {
  filters: STTReportFilters;
  onChange: (filters: STTReportFilters) => void;
  onLoad: () => void;
  loading: boolean;
  uniqueBranches: string[];
  uniqueSalesmen: string[];
  uniqueStatuses: string[];
  uniqueSuppliers: string[];
  rawData: STTReportRecord[];
  dateFrom: string;
  dateTo: string;
};

export function Filters(props: FiltersProps) {
  const {
    filters,
    onChange,
    onLoad,
    loading,
    uniqueBranches,
    uniqueSalesmen,
    uniqueStatuses,
    uniqueSuppliers,
    rawData,
    dateFrom,
    dateTo,
  } = props;

  // Search states for each filter
  const [branchSearch, setBranchSearch] = React.useState("");
  const [salesmanSearch, setSalesmanSearch] = React.useState("");
  const [statusSearch, setStatusSearch] = React.useState("");
  const [supplierSearch, setSupplierSearch] = React.useState("");

  // Filter branches
  const filteredBranches = React.useMemo(() => {
    return branchSearch
      ? uniqueBranches.filter((b) =>
          b.toLowerCase().includes(branchSearch.toLowerCase()),
        )
      : uniqueBranches;
  }, [uniqueBranches, branchSearch]);

  // Filter salesmen
  const filteredSalesmen = React.useMemo(() => {
    return salesmanSearch
      ? uniqueSalesmen.filter((s) =>
          s.toLowerCase().includes(salesmanSearch.toLowerCase()),
        )
      : uniqueSalesmen;
  }, [uniqueSalesmen, salesmanSearch]);

  // Filter statuses
  const filteredStatuses = React.useMemo(() => {
    return statusSearch
      ? uniqueStatuses.filter((s) =>
          s.toLowerCase().includes(statusSearch.toLowerCase()),
        )
      : uniqueStatuses;
  }, [uniqueStatuses, statusSearch]);

  // Filter suppliers
  const filteredSuppliers = React.useMemo(() => {
    return supplierSearch
      ? uniqueSuppliers.filter((s) =>
          s.toLowerCase().includes(supplierSearch.toLowerCase()),
        )
      : uniqueSuppliers;
  }, [uniqueSuppliers, supplierSearch]);

  const clearFilter = (key: keyof STTReportFilters) => {
    onChange({
      ...filters,
      [key]: [],
    });
  };

  const toggleItem = (key: keyof STTReportFilters, value: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter((x) => x !== value)
      : [...current, value];
    onChange({
      ...filters,
      [key]: updated,
    });
  };

  return (
    <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Title Row */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Sales Report Summary Dashboard
              </h2>
              <p className="text-sm text-muted-foreground">
                Comprehensive overview of sales, returns, and performance
                metrics
              </p>
            </div>
          </div>

          {/* Date Range Presets */}
          <div className="space-y-3">
            <Label>Date Range</Label>
            <div className="flex flex-wrap justify-between gap-2">
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

              {/* Action buttons */}
              <div className="flex justify-end gap-2">
                <Button onClick={onLoad}  size="sm">
                  {loading ? "Loading..." : "Generate Report"}
                </Button>
                <Button
                  size="sm"
                  disabled={rawData.length === 0}
                  onClick={() => {
                    const ctx = {
                      dateFrom,
                      dateTo,
                      branches: filters.branches,
                      salesmen: filters.salesmen,
                      statuses: filters.statuses,
                      suppliers: filters.suppliers,
                    };
                    exportToExcel(rawData, ctx);
                  }}
                >
                  Export to CSV
                </Button>
              </div>
            </div>

            {/* Custom Date Inputs */}
            {filters.dateRangePreset === "custom" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="srs-dateFrom">Date From</Label>
                  <Input
                    id="srs-dateFrom"
                    type="date"
                    className="dark:border-zinc-700"
                    value={filters.dateFrom}
                    onChange={(e) =>
                      onChange({ ...filters, dateFrom: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="srs-dateTo">Date To</Label>
                  <Input
                    id="srs-dateTo"
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

          {/* Row 1: Branch + Salesman + Status + Supplier */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Branches */}
            <div className="space-y-2">
              <Label>Branches</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between dark:border-zinc-700"
                  >
                    {filters.branches.length > 0
                      ? `${filters.branches.length} selected`
                      : "All Branches"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 p-0 dark:border-zinc-700"
                  align="start"
                >
                  <div className="p-2 border-b dark:border-zinc-700 dark:bg-white/13">
                    <Input
                      placeholder="Search branches..."
                      value={branchSearch}
                      onChange={(e) => setBranchSearch(e.target.value)}
                      className="h-8 dark:border-zinc-700"
                    />
                  </div>
                  <ScrollArea className="h-64">
                    <div className="p-2 space-y-1 dark:bg-white/13">
                      {filteredBranches.map((branch) => (
                        <div
                          key={branch}
                          className="flex items-center space-x-2 py-1 px-2 hover:bg-accent/50 rounded-md cursor-pointer"
                        >
                          <Checkbox
                            id={`branch-${branch}`}
                            checked={filters.branches.includes(branch)}
                            onCheckedChange={() =>
                              toggleItem("branches", branch)
                            }
                          />
                          <label
                            htmlFor={`branch-${branch}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            {branch}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {filters.branches.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter("branches")}
                  className="h-6 px-2 text-xs dark:border-zinc-700"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Salesmen */}
            <div className="space-y-2">
              <Label>Salesmen</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between dark:border-zinc-700"
                  >
                    {filters.salesmen.length > 0
                      ? `${filters.salesmen.length} selected`
                      : "All Salesmen"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 p-0 dark:border-zinc-700"
                  align="start"
                >
                  <div className="p-2 border-b dark:border-zinc-700 dark:bg-white/13">
                    <Input
                      placeholder="Search salesmen..."
                      value={salesmanSearch}
                      onChange={(e) => setSalesmanSearch(e.target.value)}
                      className="h-8 dark:border-zinc-700"
                    />
                  </div>
                  <ScrollArea className="h-64">
                    <div className="p-2 space-y-1 dark:bg-white/13">
                      {filteredSalesmen.map((salesman) => (
                        <div
                          key={salesman}
                          className="flex items-center space-x-2 py-1 px-2 hover:bg-accent/50 rounded-md cursor-pointer"
                        >
                          <Checkbox
                            id={`salesman-${salesman}`}
                            checked={filters.salesmen.includes(salesman)}
                            onCheckedChange={() =>
                              toggleItem("salesmen", salesman)
                            }
                          />
                          <label
                            htmlFor={`salesman-${salesman}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            {salesman}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {filters.salesmen.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter("salesmen")}
                  className="h-6 px-2 text-xs dark:border-zinc-700"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Statuses */}
            <div className="space-y-2">
              <Label>Statuses</Label>
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
                          className="flex items-center space-x-2 py-1 px-2 hover:bg-accent/50 rounded-md cursor-pointer"
                        >
                          <Checkbox
                            id={`status-${status}`}
                            checked={filters.statuses.includes(status)}
                            onCheckedChange={() =>
                              toggleItem("statuses", status)
                            }
                          />
                          <label
                            htmlFor={`status-${status}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            {status}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {filters.statuses.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter("statuses")}
                  className="h-6 px-2 text-xs dark:border-zinc-700"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Suppliers */}
            <div className="space-y-2">
              <Label>Suppliers</Label>
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
                          className="flex items-center space-x-2 py-1 px-2 hover:bg-accent/50 rounded-md cursor-pointer"
                        >
                          <Checkbox
                            id={`supplier-${supplier}`}
                            checked={filters.suppliers.includes(supplier)}
                            onCheckedChange={() =>
                              toggleItem("suppliers", supplier)
                            }
                          />
                          <label
                            htmlFor={`supplier-${supplier}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            {supplier}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {filters.suppliers.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter("suppliers")}
                  className="h-6 px-2 text-xs dark:border-zinc-700"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {(filters.branches.length > 0 ||
            filters.salesmen.length > 0 ||
            filters.statuses.length > 0 ||
            filters.suppliers.length > 0) && (
            <div className="space-y-2">
              <Label>Active Filters</Label>
              <div className="flex flex-wrap gap-2">
                {filters.branches.map((b) => (
                  <Badge key={b} variant="secondary">
                    Branch: {b}
                    <button
                      onClick={() =>
                        onChange({
                          ...filters,
                          branches: filters.branches.filter((x) => x !== b),
                        })
                      }
                      className="ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.salesmen.map((s) => (
                  <Badge key={s} variant="secondary">
                    Salesman: {s}
                    <button
                      onClick={() =>
                        onChange({
                          ...filters,
                          salesmen: filters.salesmen.filter((x) => x !== s),
                        })
                      }
                      className="ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.statuses.map((s) => (
                  <Badge key={s} variant="secondary">
                    Status: {s}
                    <button
                      onClick={() =>
                        onChange({
                          ...filters,
                          statuses: filters.statuses.filter((x) => x !== s),
                        })
                      }
                      className="ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.suppliers.map((s) => (
                  <Badge key={s} variant="secondary">
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
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
