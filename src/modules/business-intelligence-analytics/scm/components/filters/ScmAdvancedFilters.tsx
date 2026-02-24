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
  branches?: string[];
  showBranch?: boolean;
  showRiskStatus?: boolean;
}

/**
 * ScmAdvancedFilters
 * A centralized filtering component for SCM modules.
 * Groups date range, supplier, and branch filters into a single responsive layout.
 */
export function ScmAdvancedFilters({ 
  suppliers, 
  branches = [], 
  showBranch = false,
  showRiskStatus = false
}: ScmAdvancedFiltersProps) {
  const { 
    dateRange, 
    setDateRange, 
    selectedSupplier, 
    setSelectedSupplier,
    selectedBranch,
    setSelectedBranch,
    selectedRiskStatus,
    setSelectedRiskStatus
  } = useScmFilters();

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Date Range Filtering */}
      <ScmDateRangePicker date={dateRange} onDateChange={setDateRange} />
      
      {/* Supplier Filtering */}
      <div className="flex items-center gap-2">
        <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Suppliers" />
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

      {/* Branch Filtering */}
      {showBranch && (
        <div className="flex items-center gap-2">
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Risk Status Filtering */}
      {showRiskStatus && (
        <div className="flex items-center gap-2">
          <Select value={selectedRiskStatus} onValueChange={setSelectedRiskStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Risk Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
