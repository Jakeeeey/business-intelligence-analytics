"use client";

import React, { useState, useMemo } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  SortAsc,
  SortDesc,
  Search, 
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ReportData, PivotConfig, DateGrouping } from "../types";

/**
 * Excel-standard date formatting based on grouping type
 * (Shared logic with adapter - ideally this would be in a shared util)
 */
const formatDateValue = (value: unknown, grouping?: DateGrouping): string => {
  if (!value) return "N/A";
  const date = new Date(String(value));
  if (isNaN(date.getTime())) return String(value);

  switch (grouping) {
    case 'monthly':
      return date.toLocaleString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
    case 'yearly':
      return date.getFullYear().toString();
    case 'daily':
    default:
      return date.toISOString().split('T')[0];
  }
};

interface RowLabelFilterProps {
  data: ReportData[];
  config: PivotConfig;
  onSortChange: (order: 'asc' | 'desc') => void;
  onFilterChange: (values: string[]) => void;
  selectedValues: string[] | null;
}

export function RowLabelFilter({ data, config, onSortChange, onFilterChange, selectedValues: externalSelectedValues }: RowLabelFilterProps) {
  const [search, setSearch] = useState("");
  
  // Extract all unique values from the primary row field for the pick-list
  const primaryField = config.rowFields[0];
  const uniqueValues = useMemo(() => {
    if (!primaryField || !data.length) return [];
    const values = new Set<string>();
    data.forEach(row => {
      const val = row[primaryField.id as keyof ReportData];
      if (val !== undefined && val !== null) {
        if (primaryField.type === 'date') {
          values.add(formatDateValue(val, primaryField.dateGrouping));
        } else {
          values.add(String(val));
        }
      }
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [data, primaryField]);

  const filteredValues = uniqueValues.filter(v => 
    v.toLowerCase().includes(search.toLowerCase())
  );

  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  // Sync internal state with external prop (Excel style: null means Select All initially)
  React.useEffect(() => {
    if (externalSelectedValues === null) {
      setSelectedValues(uniqueValues);
    } else {
      setSelectedValues(externalSelectedValues);
    }
  }, [externalSelectedValues, uniqueValues]);

  const handleToggle = (val: string) => {
    const next = selectedValues.includes(val)
      ? selectedValues.filter(v => v !== val)
      : [...selectedValues, val];
    setSelectedValues(next);
    onFilterChange(next);
  };

  const handleSelectAll = () => {
    const next = selectedValues.length === uniqueValues.length ? [] : uniqueValues;
    setSelectedValues(next);
    onFilterChange(next);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="ml-auto p-1 hover:bg-muted rounded transition-colors group">
          <Filter className="w-3 h-3 text-slate-400 group-hover:text-primary transition-colors" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 bg-background border border-border p-0 shadow-2xl overflow-hidden rounded-xl z-[600]">
        <div className="p-2 space-y-2">
          {/* SORTING SECTION */}
          <div className="grid grid-cols-2 gap-1 px-1">
            <button 
              onClick={() => onSortChange('asc')}
              className="flex items-center justify-center gap-2 py-2 text-[9px] font-black uppercase tracking-tighter bg-muted/50 hover:bg-primary/10 text-foreground hover:text-primary rounded-lg transition-all border border-border/50"
            >
              <SortAsc className="w-3 h-3" />
              A TO Z
            </button>
            <button 
              onClick={() => onSortChange('desc')}
              className="flex items-center justify-center gap-2 py-2 text-[9px] font-black uppercase tracking-tighter bg-muted/50 hover:bg-primary/10 text-foreground hover:text-primary rounded-lg transition-all border border-border/50"
            >
              <SortDesc className="w-3 h-3" />
              Z TO A
            </button>
          </div>

          <div className="h-[1px] bg-border/50 mx-2" />

          {/* FILTER SEARCH */}
          <div className="px-1">
            <div className="relative group">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search values..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 pr-2 text-[10px] font-bold bg-muted/30 border-border focus-visible:ring-0 focus-visible:border-primary/50 rounded-lg"
              />
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center justify-between px-2 pt-1">
             <button 
               onClick={handleSelectAll}
               className="text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 px-2 py-1 rounded-md transition-all"
             >
               {selectedValues.length === uniqueValues.length ? "CLEAR ALL" : "SELECT ALL"}
             </button>
             <span className="text-[9px] font-black text-muted-foreground/30 tabular-nums uppercase tracking-widest">
               {selectedValues.length} OF {uniqueValues.length}
             </span>
          </div>

          {/* PICK LIST (CHECKBOXES) */}
          <div className="max-h-[220px] overflow-y-auto custom-scrollbar px-1 pb-1 space-y-0.5">
            {filteredValues.map(val => {
              const isSelected = selectedValues.includes(val);
              return (
                <div 
                  key={val}
                  className={cn(
                    "flex items-center gap-3 px-2.5 py-2 rounded-lg cursor-pointer transition-all group",
                    isSelected ? "bg-primary/5" : "hover:bg-muted/50"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(val);
                  }}
                >
                  <Checkbox 
                    checked={isSelected}
                    onCheckedChange={() => handleToggle(val)}
                    className="w-4 h-4 rounded border-border group-hover:border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
                  />
                  <span className={cn(
                    "text-[10px] font-bold truncate transition-colors",
                    isSelected ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {val}
                  </span>
                </div>
              );
            })}
            {filteredValues.length === 0 && (
              <div className="py-8 text-center text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
                No matches found
              </div>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
