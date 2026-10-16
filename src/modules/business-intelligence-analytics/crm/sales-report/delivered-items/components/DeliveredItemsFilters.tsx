// src/modules/business-intelligence-analytics/crm/sales-report/delivered-items/components/DeliveredItemsFilters.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import {
  Calendar,
  Search,
  Users,
  Download,
  RotateCcw,
  X,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import type { DateRangePreset, DeliveredItemsFilters } from "../types";

type Props = {
  filters: DeliveredItemsFilters;
  onChange: React.Dispatch<React.SetStateAction<DeliveredItemsFilters>>;
  availableCustomers: { name: string; totalQty: number; city?: string; province?: string }[];
  onReload: () => void;
  onExportCustomerSummary: () => void;
  onExportProductSummary?: () => void;
  onExportItemized: () => void;
  onExportPdf?: () => void;
  onExportProductPdf?: () => void;
  onSelectAllCustomers: () => void;
  onClearAllCustomers: () => void;
  onToggleCustomer: (name: string) => void;
  onSearchCustomers: (query: string) => void;
  isSearchingCustomers: boolean;
  loading: boolean;
};

export function DeliveredItemsFiltersComponent({
  filters,
  onChange,
  availableCustomers,
  onReload,
  onExportCustomerSummary,
  onExportProductSummary,
  onExportItemized,
  onExportPdf,
  onExportProductPdf,
  onSelectAllCustomers,
  onClearAllCustomers,
  onToggleCustomer,
  onSearchCustomers,
  isSearchingCustomers,
  loading,
}: Props) {
  const [customerSearch, setCustomerSearch] = React.useState("");

  // Debounce customer search against the master database
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onSearchCustomers(customerSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch, onSearchCustomers]);

  const selectedCount = filters.selectedCustomers.length;

  const displayedCustomers = React.useMemo(() => {
    const search = customerSearch.trim().toLowerCase();
    if (!search) {
      return availableCustomers;
    }
    return availableCustomers.filter((c) => {
      const matchName = c.name.toLowerCase().includes(search);
      const matchCity = c.city ? c.city.toLowerCase().includes(search) : false;
      const matchProv = c.province ? c.province.toLowerCase().includes(search) : false;
      const isSelected = filters.selectedCustomers.includes(c.name);
      return matchName || matchCity || matchProv || isSelected;
    });
  }, [availableCustomers, customerSearch, filters.selectedCustomers]);

  const handleSelectAllFiltered = () => {
    const namesToAdd = displayedCustomers.map((c) => c.name);
    onChange((prev) => ({
      ...prev,
      selectedCustomers: Array.from(new Set([...prev.selectedCustomers, ...namesToAdd])),
    }));
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      {/* Top Row: Presets, Date Pickers, Customer Selector, Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Date Presets & Dates */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Selector */}
          <div className="w-[140px]">
            <Select
              value={filters.dateRangePreset}
              onValueChange={(val: DateRangePreset) =>
                onChange((prev) => ({ ...prev, dateRangePreset: val }))
              }
            >
              <SelectTrigger className="h-9 text-xs font-medium border-border/80 dark:border-zinc-700 dark:bg-zinc-800/80">
                <SelectValue placeholder="Date Preset" />
              </SelectTrigger>
              <SelectContent className="dark:border-zinc-800 dark:bg-zinc-900">
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/50 px-2.5 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800/50">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  dateRangePreset: "custom",
                  startDate: e.target.value,
                }))
              }
              className="h-7 w-[125px] border-0 bg-transparent p-0 text-xs focus-visible:ring-0"
            />
            <span className="text-muted-foreground">→</span>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  dateRangePreset: "custom",
                  endDate: e.target.value,
                }))
              }
              className="h-7 w-[125px] border-0 bg-transparent p-0 text-xs focus-visible:ring-0"
            />
          </div>

          {/* Customer Multi-Select Dropdown Popover with Real-Time Database Search */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-9 gap-2 border-border/80 px-3 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800/80 dark:hover:bg-zinc-700"
              >
                <Users className="h-3.5 w-3.5 text-primary" />
                <span>Customers</span>
                {selectedCount === 0 ? (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal dark:bg-zinc-700 dark:text-zinc-200">
                    All Customers
                  </Badge>
                ) : (
                  <Badge className="bg-primary px-1.5 py-0 text-[10px] text-primary-foreground">
                    {selectedCount} Selected
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-[360px] p-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Search & Select Customers
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={customerSearch ? handleSelectAllFiltered : onSelectAllCustomers}
                      className="text-primary hover:underline font-medium"
                    >
                      {customerSearch ? "Select Matches" : "Select All"}
                    </button>
                    <span className="text-muted-foreground">|</span>
                    <button
                      type="button"
                      onClick={onClearAllCustomers}
                      className="text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Search input querying master database */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search all 6,500+ customers..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="h-8 pl-8 pr-8 text-xs dark:border-zinc-700 dark:bg-zinc-800/70"
                  />
                  {isSearchingCustomers ? (
                    <div className="absolute right-2.5 top-2.5">
                      <Spinner className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  ) : customerSearch ? (
                    <button
                      type="button"
                      onClick={() => setCustomerSearch("")}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>

                {/* Customer list checkboxes */}
                <ScrollArea className="h-[230px] rounded border border-border/50 p-1 dark:border-zinc-800">
                  {displayedCustomers.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      {isSearchingCustomers
                        ? "Searching customer database..."
                        : customerSearch
                        ? `No customers matching "${customerSearch}"`
                        : "No customers found"}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {displayedCustomers.map((cust) => {
                        const isChecked = filters.selectedCustomers.includes(cust.name);
                        return (
                          <label
                            key={cust.name}
                            className={`flex cursor-pointer items-start justify-between gap-2 rounded px-2 py-1.5 text-xs transition-colors hover:bg-muted/70 dark:hover:bg-zinc-800/70 ${
                              isChecked ? "bg-primary/5 dark:bg-primary/10" : ""
                            }`}
                          >
                            <div className="flex min-w-0 items-start gap-2 pt-0.5">
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => onToggleCustomer(cust.name)}
                                className="mt-0.5 dark:border-zinc-600"
                              />
                              <div className="min-w-0">
                                <span className="block truncate font-medium text-foreground">
                                  {cust.name}
                                </span>
                                {(cust.city || cust.province) && (
                                  <span className="block truncate text-[10px] text-muted-foreground">
                                    {[cust.city, cust.province].filter(Boolean).join(", ")}
                                  </span>
                                )}
                              </div>
                            </div>
                            {cust.totalQty > 0 && (
                              <Badge
                                variant="outline"
                                className="shrink-0 text-[10px] font-normal px-1 py-0 text-muted-foreground dark:border-zinc-700"
                              >
                                {cust.totalQty} items
                              </Badge>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t dark:border-zinc-800">
                  <span>
                    {selectedCount > 0
                      ? `${selectedCount} customer${selectedCount > 1 ? "s" : ""} selected`
                      : "Showing all customers"}
                  </span>
                  {selectedCount > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onClearAllCustomers}
                      className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive"
                    >
                      Reset filter
                    </Button>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Reload / Apply Button */}
          <Button
            size="sm"
            onClick={onReload}
            disabled={loading}
            className="h-9 gap-1.5 px-3 text-xs font-medium"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Apply</span>
          </Button>
        </div>

        {/* Right: Quick Table Search & Export Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative w-[200px] sm:w-[240px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search table..."
              value={filters.searchTerm}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, searchTerm: e.target.value }))
              }
              className="h-9 pl-8 text-xs border-border/80 dark:border-zinc-700 dark:bg-zinc-800/80"
            />
            {filters.searchTerm && (
              <button
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, searchTerm: "" }))}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Export Menu */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-9 gap-1.5 border-border/80 px-3 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800/80 dark:hover:bg-zinc-700"
              >
                <Download className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Export</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-[200px] p-1.5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-col gap-1">
                {onExportPdf && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onExportPdf}
                    className="justify-start gap-2 text-xs font-normal hover:bg-muted dark:hover:bg-zinc-800 text-foreground"
                  >
                    <FileText className="h-3.5 w-3.5 text-rose-500" />
                    Customer Summary (PDF)
                  </Button>
                )}
                {onExportProductPdf && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onExportProductPdf}
                    className="justify-start gap-2 text-xs font-normal hover:bg-muted dark:hover:bg-zinc-800 text-foreground"
                  >
                    <FileText className="h-3.5 w-3.5 text-amber-500" />
                    Product Summary (PDF)
                  </Button>
                )}
                {(onExportPdf || onExportProductPdf) && (
                  <div className="my-0.5 border-t border-border/50 dark:border-zinc-800" />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExportCustomerSummary}
                  className="justify-start gap-2 text-xs font-normal hover:bg-muted dark:hover:bg-zinc-800"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                  Customer Summary CSV
                </Button>
                {onExportProductSummary && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onExportProductSummary}
                    className="justify-start gap-2 text-xs font-normal hover:bg-muted dark:hover:bg-zinc-800"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-blue-500" />
                    Product Summary CSV
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExportItemized}
                  className="justify-start gap-2 text-xs font-normal hover:bg-muted dark:hover:bg-zinc-800"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
                  Itemized Delivered CSV
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Selected Customer Pills */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/50 dark:border-zinc-800/60">
          <span className="text-[11px] font-medium text-muted-foreground mr-1">
            Active Filter:
          </span>
          {filters.selectedCustomers.slice(0, 6).map((cName) => (
            <Badge
              key={cName}
              variant="secondary"
              className="gap-1 px-2 py-0.5 text-[11px] font-normal dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
            >
              <span className="max-w-[140px] truncate">{cName}</span>
              <button
                type="button"
                onClick={() => onToggleCustomer(cName)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedCount > 6 && (
            <Badge
              variant="outline"
              className="px-2 py-0.5 text-[11px] text-muted-foreground dark:border-zinc-700"
            >
              +{selectedCount - 6} more
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAllCustomers}
            className="h-5 px-1.5 text-[11px] text-destructive hover:bg-destructive/10"
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}
