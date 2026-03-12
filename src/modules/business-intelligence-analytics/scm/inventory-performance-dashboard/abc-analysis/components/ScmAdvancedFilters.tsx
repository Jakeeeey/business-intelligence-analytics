"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScmDateRangePicker } from "./ScmDateRangePicker";
import { useScmFilters } from "../providers/ScmFilterProvider";

interface ScmAdvancedFiltersProps {
  suppliers: string[];
  branches?: string[];
  showBranch?: boolean;
  showRiskStatus?: boolean;
}

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
      <ScmDateRangePicker date={dateRange} onDateChange={setDateRange} />
      
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
