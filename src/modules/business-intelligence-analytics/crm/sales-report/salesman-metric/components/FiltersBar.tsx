"use client";

import * as React from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { SalesmanOption } from "../types";

interface FiltersBarProps {
  salesmen: SalesmanOption[];
  selectedSalesmanId: number | "";
  fiscalPeriod: string; // YYYY-MM-DD
  onChangeSalesman: (id: number | "") => void;
  onChangeFiscalPeriod: (fp: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  loading: boolean;
}

export function FiltersBar({
  salesmen,
  selectedSalesmanId,
  fiscalPeriod,
  onChangeSalesman,
  onChangeFiscalPeriod,
  searchQuery,
  onSearchQueryChange,
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

  // Convert fiscal period YYYY-MM-DD to YYYY-MM for the html month input
  const monthInputValue = React.useMemo(() => {
    if (!fiscalPeriod) return "";
    return fiscalPeriod.substring(0, 7);
  }, [fiscalPeriod]);

  return (
    <Card className="border-border/60 bg-card dark:border-zinc-800">
      <CardContent className="p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-start gap-6">
          {/* Search Input (Far Left) */}
          <div className="w-full md:w-72 space-y-2">
            <Label className="text-sm font-semibold text-foreground/80">Search</Label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                disabled={loading}
                className="pl-9 h-9 border-border/60 dark:border-zinc-800"
              />
            </div>
          </div>

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

          {/* Fiscal Period Filter */}
          <div className="w-full md:w-64 space-y-2">
            <Label className="text-sm font-semibold text-foreground/80">Fiscal Period</Label>
            <Input
              type="month"
              value={monthInputValue}
              onChange={(e) => {
                const val = e.target.value; // "YYYY-MM"
                if (val) {
                  onChangeFiscalPeriod(val + "-01");
                }
              }}
              disabled={loading}
              className="h-9 border-border/60 dark:border-zinc-800"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
