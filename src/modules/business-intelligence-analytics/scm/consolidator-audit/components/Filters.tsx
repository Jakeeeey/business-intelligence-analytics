// src/modules/business-intelligence-analytics/scm/consolidator-audit/components/Filters.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, RotateCcw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ConsolidatorAuditFilters } from "../types";

type FiltersProps = {
  filters: ConsolidatorAuditFilters;
  onChange: React.Dispatch<React.SetStateAction<ConsolidatorAuditFilters>>;
  uniqueStatuses: {
    pdp: string[];
    consolidator: string[];
    dp: string[];
  };
  onSearch: () => void;
  onClear: () => void;
  loading: boolean;
};

export function Filters({
  filters,
  onChange,
  uniqueStatuses,
  onSearch,
  onClear,
  loading,
}: FiltersProps) {
  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-card-foreground">Consolidator Audit Filters</h2>
            <p className="text-xs text-muted-foreground">
              Search and filter across dispatch plans, consolidators, and pre-dispatch plans.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {/* Start Date */}
            <div className="space-y-1">
              <Label htmlFor="startDate" className="text-xs font-medium">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => onChange((prev) => ({ ...prev, startDate: e.target.value }))}
                className="h-9"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <Label htmlFor="endDate" className="text-xs font-medium">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => onChange((prev) => ({ ...prev, endDate: e.target.value }))}
                className="h-9"
              />
            </div>

            {/* PDP No */}
            <div className="space-y-1">
              <Label htmlFor="pdpNo" className="text-xs font-medium">PDP No.</Label>
              <Input
                id="pdpNo"
                placeholder="e.g. PDP-00342"
                value={filters.pdpNo || ""}
                onChange={(e) => onChange((prev) => ({ ...prev, pdpNo: e.target.value }))}
                className="h-9"
              />
            </div>

            {/* PDP Status */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">PDP Status</Label>
              <Select
                value={filters.pdpStatus || "ALL"}
                onValueChange={(val) =>
                  onChange((prev) => ({
                    ...prev,
                    pdpStatus: val === "ALL" ? "" : val,
                  }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {uniqueStatuses.pdp.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                  {/* Default fallback statuses if data not loaded yet */}
                  {!uniqueStatuses.pdp.includes("Dispatched") && (
                    <SelectItem value="Dispatched">Dispatched</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {/* Consolidator No */}
            <div className="space-y-1">
              <Label htmlFor="consolidatorNo" className="text-xs font-medium">Consolidator No.</Label>
              <Input
                id="consolidatorNo"
                placeholder="e.g. CLDTO-00501"
                value={filters.consolidatorNo || ""}
                onChange={(e) => onChange((prev) => ({ ...prev, consolidatorNo: e.target.value }))}
                className="h-9"
              />
            </div>

            {/* Consolidator Status */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Consolidator Status</Label>
              <Select
                value={filters.consolidatorStatus || "ALL"}
                onValueChange={(val) =>
                  onChange((prev) => ({
                    ...prev,
                    consolidatorStatus: val === "ALL" ? "" : val,
                  }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {uniqueStatuses.consolidator.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                  {!uniqueStatuses.consolidator.includes("Audited") && (
                    <SelectItem value="Audited">Audited</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* DP No */}
            <div className="space-y-1">
              <Label htmlFor="dpNo" className="text-xs font-medium">DP No.</Label>
              <Input
                id="dpNo"
                placeholder="e.g. DP-01921"
                value={filters.dpNo || ""}
                onChange={(e) => onChange((prev) => ({ ...prev, dpNo: e.target.value }))}
                className="h-9"
              />
            </div>

            {/* DP Status */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">DP Status</Label>
              <Select
                value={filters.dpStatus || "ALL"}
                onValueChange={(val) =>
                  onChange((prev) => ({
                    ...prev,
                    dpStatus: val === "ALL" ? "" : val,
                  }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {uniqueStatuses.dp.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                  {!uniqueStatuses.dp.includes("Posted") && (
                    <SelectItem value="Posted">Posted</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClear}
              disabled={loading}
              className="gap-1.5 h-9"
            >
              <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
              Reset Filters
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onSearch}
              disabled={loading}
              className="gap-1.5 h-9"
            >
              <Search className="h-3.5 w-3.5" />
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
