"use client";

import * as React from "react";
import { MultiSelectFilter } from "./MultiSelectFilter";
import { Input } from "@/components/ui/input";
import { MonthPicker } from "@/components/ui/month-picker";
import { Search, RefreshCw, FunnelX } from "lucide-react";
import { SalesmanOption, SupervisorOption } from "../types";

interface FiltersBarProps {
  isAdmin?: boolean;
  supervisors: SupervisorOption[];
  selectedSupervisorIds: string[];
  onChangeSupervisor: (ids: string[]) => void;
  salesmen: SalesmanOption[];
  selectedSalesmanIds: number[];
  fiscalPeriod: string; // YYYY-MM-DD
  onChangeSalesmen: (ids: number[]) => void;
  onChangeFiscalPeriod: (fp: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onApplyFilters: () => void;
  onRefresh: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  loading: boolean;
}

export function FiltersBar({
  isAdmin = false,
  supervisors,
  selectedSupervisorIds,
  onChangeSupervisor,
  salesmen,
  selectedSalesmanIds,
  fiscalPeriod,
  onChangeSalesmen,
  onChangeFiscalPeriod,
  searchQuery,
  onSearchQueryChange,
  onApplyFilters,
  onRefresh,
  onClearFilters,
  hasActiveFilters,
  loading,
}: FiltersBarProps) {
  // Map supervisors to options format
  const supervisorOptions = React.useMemo(() => {
    return supervisors.map((sp) => ({
      value: sp.supervisorId,
      label: sp.supervisorName,
    }));
  }, [supervisors]);

  // Map salesmen list to option format for MultiSelectFilter
  const salesmanOptions = React.useMemo(() => {
    return salesmen.map((sm) => ({
      value: String(sm.salesmanId),
      label: `${sm.salesmanName} (${sm.salesmanCode})`,
    }));
  }, [salesmen]);

  const activeValues = selectedSalesmanIds.map(String);

  // Convert fiscal period YYYY-MM-DD to YYYY-MM for the html month input
  const monthInputValue = React.useMemo(() => {
    if (!fiscalPeriod) return "";
    return fiscalPeriod.substring(0, 7);
  }, [fiscalPeriod]);

  return (
    <div className="flex flex-wrap items-center gap-3 bg-card/50 backdrop-blur-md border border-border/40 rounded-2xl p-2 shadow-2xl">
      <div className="flex items-center gap-2 px-4 border-r border-border/40 py-1">
        <Search className="h-4 w-4 text-primary" />
        <Input
          type="text"
          placeholder="SEARCH..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          disabled={loading}
          className="w-[120px] lg:w-[150px] border-none bg-transparent h-8 text-[11px] font-black uppercase focus-visible:ring-0 p-0 placeholder:text-muted-foreground/30"
        />
      </div>

      {isAdmin && (
        <div className="flex items-center gap-2 px-4 border-r border-border/40 py-1 min-w-[200px]">
          <span className="text-muted-foreground/30 font-black text-[10px] uppercase tracking-widest">SUP:</span>
          <div className="flex-1">
              <MultiSelectFilter
              options={supervisorOptions}
              selectedValues={selectedSupervisorIds}
              onValuesChange={onChangeSupervisor}
              placeholder="Select supervisor..."
              searchPlaceholder="Search supervisor..."
              allLabel="All Supervisors"
              disabled={loading}
              />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 px-4 border-r border-border/40 py-1 min-w-[200px]">
        <span className="text-muted-foreground/30 font-black text-[10px] uppercase tracking-widest">REP:</span>
        <div className="flex-1">
            <MultiSelectFilter
            options={salesmanOptions}
            selectedValues={activeValues}
            onValuesChange={(vals) => {
                onChangeSalesmen(vals.map(Number));
            }}
            placeholder="Select salesman..."
            searchPlaceholder="Search salesman..."
            allLabel="All Salesmen"
            disabled={loading}
            />
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 border-r border-border/40 py-1">
        <span className="text-muted-foreground/30 font-black text-[10px] uppercase tracking-widest">DATE:</span>
        <MonthPicker
          value={monthInputValue}
          onChange={(val) => {
            if (val) onChangeFiscalPeriod(val + "-01");
          }}
          disabled={loading}
        />
      </div>

      <div className="flex items-center gap-2 px-2 py-1">
        <button
          onClick={onApplyFilters}
          disabled={loading}
          className="h-8 px-4 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-lg shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          APPLY
        </button>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            disabled={loading}
            title="Clear Filters"
            className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <FunnelX className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onRefresh}
          disabled={loading}
          title="Refresh Data"
          className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}
