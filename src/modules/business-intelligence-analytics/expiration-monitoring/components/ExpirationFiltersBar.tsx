"use client";

import * as React from "react";
import { Search, RefreshCw, FunnelX, Calendar as CalendarIcon } from "lucide-react";
import { MultiSelect } from "./MultiSelect";
import { ExpirationFilters } from "../types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ExpirationFiltersBarProps {
  suppliers: { id: number; name: string }[];
  branches: { id: number; name: string }[];
  lots: { id: number; name: string }[];
  batches: string[];
  filters: ExpirationFilters;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onApplyFilters: (f: ExpirationFilters) => void;
  onRefresh: () => void;
  onClearFilters: () => void;
  loading: boolean;
}

export function ExpirationFiltersBar({
  suppliers,
  branches,
  lots,
  batches,
  filters,
  searchQuery,
  onSearchQueryChange,
  onApplyFilters,
  onRefresh,
  onClearFilters,
  loading,
}: ExpirationFiltersBarProps) {
  const [localFilters, setLocalFilters] = React.useState<ExpirationFilters>(filters);

  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleChange = (key: keyof ExpirationFilters, value: ExpirationFilters[keyof ExpirationFilters]) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="flex flex-col gap-4 bg-card/50 backdrop-blur-md border border-border/40 rounded-2xl p-4 shadow-2xl relative z-50">
      {/* Top Row: Search and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 px-4 border border-border/40 py-2 rounded-lg bg-background">
          <Search className="h-4 w-4 text-primary" />
          <input
            type="text"
            placeholder="SEARCH PRODUCTS..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            disabled={loading}
            className="w-[200px] lg:w-[250px] border-none bg-transparent text-[12px] font-black uppercase focus-visible:ring-0 p-0 placeholder:text-muted-foreground/50 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onApplyFilters(localFilters)}
            disabled={loading}
            className="h-9 px-6 bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-widest rounded-lg shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            APPLY FILTERS
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              disabled={loading}
              title="Clear Filters"
              className="h-9 w-9 flex items-center justify-center text-muted-foreground border border-border/40 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors bg-background"
            >
              <FunnelX className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh Data"
            className="h-9 w-9 flex items-center justify-center text-muted-foreground border border-border/40 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors bg-background"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-20">
        {/* Date Range */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expiry From</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "h-9 px-3 w-full justify-between text-left font-normal border-border/40 bg-background text-sm focus:border-primary",
                  !localFilters.expiryDateFrom && "text-muted-foreground"
                )}
              >
                {localFilters.expiryDateFrom ? format(new Date(localFilters.expiryDateFrom), "PPP") : <span>mm/dd/yyyy</span>}
                <CalendarIcon className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={localFilters.expiryDateFrom ? new Date(localFilters.expiryDateFrom) : undefined}
                onSelect={(date) => handleChange("expiryDateFrom", date ? format(date, "yyyy-MM-dd") : "")}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expiry To</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "h-9 px-3 w-full justify-between text-left font-normal border-border/40 bg-background text-sm focus:border-primary",
                  !localFilters.expiryDateTo && "text-muted-foreground"
                )}
              >
                {localFilters.expiryDateTo ? format(new Date(localFilters.expiryDateTo), "PPP") : <span>mm/dd/yyyy</span>}
                <CalendarIcon className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={localFilters.expiryDateTo ? new Date(localFilters.expiryDateTo) : undefined}
                onSelect={(date) => handleChange("expiryDateTo", date ? format(date, "yyyy-MM-dd") : "")}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Branch */}
        <div className="flex flex-col gap-1 w-full relative">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Branch</label>
          <MultiSelect
            options={branches.map(b => ({ value: b.id, label: b.name }))}
            selectedValues={localFilters.branchIds || []}
            onValuesChange={(val) => handleChange("branchIds", val as number[])}
            placeholder="Select Branches..."
            allLabel="All Branches"
          />
        </div>

        {/* Supplier */}
        <div className="flex flex-col gap-1 w-full relative">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Supplier</label>
          <MultiSelect
            options={suppliers.map(s => ({ value: s.id, label: s.name }))}
            selectedValues={localFilters.supplierIds || []}
            onValuesChange={(val) => handleChange("supplierIds", val as number[])}
            placeholder="Select Suppliers..."
            allLabel="All Suppliers"
          />
        </div>
      </div>

      {/* Filter Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 z-10 relative">
        {/* Lot */}
        <div className="flex flex-col gap-1 w-full relative">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lot Number</label>
          <MultiSelect
            options={lots.map(l => ({ value: l.id, label: l.name }))}
            selectedValues={localFilters.lotIds || []}
            onValuesChange={(val) => handleChange("lotIds", val as number[])}
            placeholder="Select Lots..."
            allLabel="All Lots"
          />
        </div>

        {/* Batch */}
        <div className="flex flex-col gap-1 w-full relative">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Batch</label>
          <MultiSelect
            options={batches.map(b => ({ value: b, label: b }))}
            selectedValues={localFilters.batchNos || []}
            onValuesChange={(val) => handleChange("batchNos", val as string[])}
            placeholder="Select Batches..."
            allLabel="All Batches"
          />
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1 w-full relative">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</label>
          <MultiSelect
            options={[
              { value: "EXPIRED", label: "Expired (Past Due)" },
              { value: "CRITICAL", label: "< 3 Months (Critical)" },
              { value: "WARNING", label: "< 6 Months (Warning)" },
              { value: "SAFE", label: "Safe (> 6 Months)" }
            ]}
            selectedValues={localFilters.expirationStatuses || []}
            onValuesChange={(val) => handleChange("expirationStatuses", val as string[])}
            placeholder="Select Statuses..."
            allLabel="All Statuses"
          />
        </div>
      </div>
    </div>
  );
}
