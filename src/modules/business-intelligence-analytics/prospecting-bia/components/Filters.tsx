"use client";

import * as React from "react";
import { MultiSelect, MultiSelectOption } from "./MultiSelect";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type FiltersProps = {
  salesmanOptions: MultiSelectOption[];
  areaOptions: MultiSelectOption[];
  storeTypeOptions: MultiSelectOption[];
  selectedSalesmen: string[];
  onSalesmenChange: (val: string[]) => void;
  selectedAreas: string[];
  onAreasChange: (val: string[]) => void;
  selectedStoreTypes: string[];
  onStoreTypesChange: (val: string[]) => void;
  onReset: () => void;
};

export default function Filters({
  salesmanOptions,
  areaOptions,
  storeTypeOptions,
  selectedSalesmen,
  onSalesmenChange,
  selectedAreas,
  onAreasChange,
  selectedStoreTypes,
  onStoreTypesChange,
  onReset,
}: FiltersProps) {
  const hasActiveFilters =
    selectedSalesmen.length > 0 || selectedAreas.length > 0 || selectedStoreTypes.length > 0;

  return (
    <Card className="border shadow-xs bg-card/60 backdrop-blur-xs">
      <CardContent className="p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
              Salesman
            </label>
            <MultiSelect
              mode="multi"
              placeholder="All Salesmen"
              options={salesmanOptions}
              value={selectedSalesmen}
              onChange={onSalesmenChange}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
              Area (Province)
            </label>
            <MultiSelect
              mode="multi"
              placeholder="All Areas"
              options={areaOptions}
              value={selectedAreas}
              onChange={onAreasChange}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
              Store Type
            </label>
            <MultiSelect
              mode="multi"
              placeholder="All Store Types"
              options={storeTypeOptions}
              value={selectedStoreTypes}
              onChange={onStoreTypesChange}
            />
          </div>

          <div className="flex md:col-span-3 lg:col-span-1 justify-start md:justify-end">
            <Button
              variant="outline"
              size="default"
              disabled={!hasActiveFilters}
              onClick={onReset}
              className="w-full lg:w-auto flex items-center justify-center gap-2 hover:bg-destructive/10 hover:text-destructive active:scale-95 transition-all duration-150"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
