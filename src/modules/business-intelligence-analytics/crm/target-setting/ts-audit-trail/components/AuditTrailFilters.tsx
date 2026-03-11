"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X, Filter as FilterIcon } from "lucide-react";
import type { AuditTrailFilters } from "../types";

interface Props {
  filters: AuditTrailFilters;
  onFilterChange: (filters: Partial<AuditTrailFilters>) => void;
}

export function AuditTrailFilters({ filters, onFilterChange }: Props) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes, status..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="pl-9 h-9 w-[150px] lg:w-[250px] transition-all"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-9 w-9 hover:bg-transparent"
              onClick={() => onFilterChange({ search: "" })}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </div>
        
        <Select
          value={filters.trigger_event}
          onValueChange={(val) => onFilterChange({ trigger_event: val === "ALL" ? "" : val })}
        >
          <SelectTrigger className="h-9 w-[160px] border-dashed">
            <div className="flex items-center gap-2">
                <FilterIcon className="h-3.5 w-3.5" />
                <SelectValue placeholder="Event Type" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Events</SelectItem>
            <SelectItem value="REJECTION">Rejection</SelectItem>
            <SelectItem value="REOPEN_TO_DRAFT">Reopen to Draft</SelectItem>
            <SelectItem value="APPROVAL">Approval</SelectItem>
            <SelectItem value="MANUAL">Manual</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
            <Input
                type="month"
                className="h-9 w-[160px]"
                value={filters.fiscal_period ? filters.fiscal_period.substring(0, 7) : ""}
                onChange={(e) => {
                    const val = e.target.value;
                    onFilterChange({ fiscal_period: val ? `${val}-01` : "" });
                }}
            />
        </div>
        
        {(filters.search || filters.trigger_event || filters.fiscal_period) && (
             <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 px-2 lg:px-3"
                onClick={() => onFilterChange({ search: "", trigger_event: "", fiscal_period: "" })}
             >
                Reset
                <X className="ml-2 h-4 w-4" />
             </Button>
        )}
      </div>
    </div>
  );
}
