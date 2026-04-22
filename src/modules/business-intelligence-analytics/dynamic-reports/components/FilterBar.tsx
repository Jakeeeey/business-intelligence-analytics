"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Search, Filter, Plus, X, Trash2 } from "lucide-react";
import { ColumnFilter, FilterOperator } from "../utils/filter-utils";

interface FilterBarProps {
  columns: string[];
  activeFilters: ColumnFilter[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddFilter: (filter: ColumnFilter) => void;
  onRemoveFilter: (id: string) => void;
  onClearAll: () => void;
}

export function FilterBar({
  columns,
  activeFilters,
  searchTerm,
  onSearchChange,
  onAddFilter,
  onRemoveFilter,
  onClearAll,
}: FilterBarProps) {
  const [newFilter, setNewFilter] = useState<{
    column: string;
    operator: FilterOperator;
    value: string;
  }>({
    column: columns[0] || "",
    operator: "contains",
    value: "",
  });

  const handleAdd = () => {
    if (!newFilter.column || !newFilter.value) return;
    onAddFilter({
      id: Math.random().toString(36).substr(2, 9),
      ...newFilter,
    });
    setNewFilter({ ...newFilter, value: "" });
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Global Search */}
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search across all columns..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 rounded-xl bg-background border-none shadow-sm focus-visible:ring-primary/30 h-11"
          />
        </div>

        {/* Add Filter Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="rounded-xl h-11 gap-2 border-dashed font-bold tracking-tight px-6 bg-background hover:bg-muted/50">
              <Filter className="w-4 h-4" />
              Add Column Filter
              {activeFilters.length > 0 && (
                <Badge variant="secondary" className="ml-1 rounded-md bg-primary/10 text-primary border-none">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 rounded-2xl border-none shadow-premium p-4 backdrop-blur-xl bg-background/90" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-primary">Configure Filter</p>
                <div className="grid gap-2">
                  <Select 
                    value={newFilter.column} 
                    onValueChange={(val) => setNewFilter({ ...newFilter, column: val })}
                  >
                    <SelectTrigger className="rounded-lg h-10">
                      <SelectValue placeholder="Column" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((col) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select 
                    value={newFilter.operator} 
                    onValueChange={(val: FilterOperator) => setNewFilter({ ...newFilter, operator: val })}
                  >
                    <SelectTrigger className="rounded-lg h-10">
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="not_equals">Not Equals</SelectItem>
                      <SelectItem value="gt">Greater Than</SelectItem>
                      <SelectItem value="lt">Less Than</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Enter value..."
                    value={newFilter.value}
                    onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
                    className="rounded-lg h-10 focus-visible:ring-primary/20"
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  />
                </div>
              </div>
              <Button onClick={handleAdd} className="w-full rounded-xl gap-2 font-black tracking-tighter active:scale-95">
                <Plus className="w-4 h-4" />
                Apply Filter
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {activeFilters.length > 0 && (
          <Button 
            variant="ghost" 
            onClick={onClearAll} 
            className="rounded-xl h-11 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors group px-4"
          >
            <Trash2 className="w-4 h-4 mr-2 group-hover:animate-pulse" />
            Clear All
          </Button>
        )}
      </div>

      {/* Filter Badges Area */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {activeFilters.map((f) => (
            <Badge 
              key={f.id} 
              variant="outline" 
              className="pl-3 pr-1 py-1 rounded-full border-primary/20 bg-primary/5 text-xs font-bold tracking-tight flex items-center gap-2 group hover:border-primary/40 transition-all shadow-sm"
            >
              <span className="text-muted-foreground uppercase text-[10px] tracking-widest">{f.column}</span>
              <span className="text-primary">{f.operator.replace('_', ' ')}</span>
              <span className="bg-background px-2 py-0.5 rounded-full border border-primary/10">"{f.value}"</span>
              <button
                onClick={() => onRemoveFilter(f.id)}
                className="p-0.5 rounded-full hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
