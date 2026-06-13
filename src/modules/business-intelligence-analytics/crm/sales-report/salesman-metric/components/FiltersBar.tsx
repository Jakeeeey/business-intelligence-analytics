"use client";

import * as React from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { DatePreset, SalesmanOption } from "../types";

interface FiltersBarProps {
  salesmen: SalesmanOption[];
  selectedSalesmanId: number | "";
  selectedDatePreset: DatePreset;
  startDate: string;
  endDate: string;
  onChangeSalesman: (id: number | "") => void;
  onChangeDatePreset: (preset: DatePreset) => void;
  onChangeCustomDates: (start: string, end: string) => void;
  loading: boolean;
}

export function FiltersBar({
  salesmen,
  selectedSalesmanId,
  selectedDatePreset,
  startDate,
  endDate,
  onChangeSalesman,
  onChangeDatePreset,
  onChangeCustomDates,
  loading,
}: FiltersBarProps) {
  // Map salesmen list to option format for SearchableSelect
  const salesmanOptions = React.useMemo(() => {
    const list = salesmen.map((sm) => ({
      value: String(sm.salesmanId),
      label: `${sm.salesmanName} (${sm.salesmanCode})`,
    }));
    return [{ value: "all", label: "All Salesmen" }, ...list];
  }, [salesmen]);

  const activeValue = selectedSalesmanId === "" ? "all" : String(selectedSalesmanId);

  // Helper to format date display (YYYY-MM-DD to Month DD, YYYY or similar, or keep simple)
  const dateDisplay = React.useMemo(() => {
    if (selectedDatePreset === "today") {
      return startDate;
    }
    return `${startDate} to ${endDate}`;
  }, [selectedDatePreset, startDate, endDate]);

  return (
    <Card className="border-border/60 bg-card dark:border-zinc-800">
      <CardContent className="p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          {/* Salesman Filter */}
          <div className="w-full md:w-80 space-y-2">
            <Label className="text-sm font-semibold text-foreground/80">Salesman</Label>
            <SearchableSelect
              options={salesmanOptions}
              value={activeValue}
              onValueChange={(val) => {
                if (val === "all") {
                  onChangeSalesman("");
                } else {
                  onChangeSalesman(Number(val));
                }
              }}
              placeholder="Search salesman..."
              disabled={loading}
            />
          </div>

          {/* Date Range Preset Selector */}
          <div className="flex-1 space-y-2">
            <Label className="text-sm font-semibold text-foreground/80">Date Range</Label>
            <div className="flex flex-wrap items-center gap-2">
              {(["today", "this-week", "this-month", "this-year", "custom"] as DatePreset[]).map(
                (preset) => (
                  <Button
                    key={preset}
                    variant={selectedDatePreset === preset ? "default" : "outline"}
                    size="sm"
                    className="capitalize border-border/60 dark:border-zinc-800"
                    onClick={() => onChangeDatePreset(preset)}
                    disabled={loading}
                  >
                    {preset.replace("-", " ")}
                  </Button>
                )
              )}

              {/* Active selected dates text displayed to the side */}
              <div className="ml-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-muted/60 text-muted-foreground border border-border/40 dark:border-zinc-800/60">
                {dateDisplay}
              </div>
            </div>
          </div>
        </div>

        {/* Custom Date Inputs if Preset is custom */}
        {selectedDatePreset === "custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md pt-2 border-t border-border/40 dark:border-zinc-800/40">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-xs text-foreground/75">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => onChangeCustomDates(e.target.value, endDate)}
                disabled={loading}
                className="h-9 border-border/60 dark:border-zinc-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-xs text-foreground/75">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => onChangeCustomDates(startDate, e.target.value)}
                disabled={loading}
                className="h-9 border-border/60 dark:border-zinc-800"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
