"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScmDateRangePicker } from "@/modules/business-intelligence-analytics/scm/components/shared/ScmDateRangePicker";
import { useScmFilters } from "@/modules/business-intelligence-analytics/scm/providers/ScmFilterProvider";

interface ScmAdvancedFiltersProps {
  suppliers: string[];
}

/**
 * ScmAdvancedFilters
 * A centralized filtering component for SCM modules.
 * Groups date range and supplier filters into a single responsive layout.
 */
export function ScmAdvancedFilters({ suppliers }: ScmAdvancedFiltersProps) {
  const { dateRange, setDateRange, selectedSupplier, setSelectedSupplier } =
    useScmFilters();

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {/* Date Range Filtering */}
      <ScmDateRangePicker date={dateRange} onDateChange={setDateRange} />
      {/* Supplier Filtering */}
      <div className="flex items-center gap-2 px-2">
        <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
          <SelectTrigger>
            <SelectValue placeholder="All Supplier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            {suppliers.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
