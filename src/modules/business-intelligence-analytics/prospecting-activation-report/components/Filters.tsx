"use client";

import * as React from "react";
import { MultiSelect, MultiSelectOption } from "./MultiSelect";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FiltersProps = {
  areaOptions: MultiSelectOption[];
  storeTypeOptions: MultiSelectOption[];
  selectedAreas: string[];
  onAreasChange: (val: string[]) => void;
  selectedStoreTypes: string[];
  onStoreTypesChange: (val: string[]) => void;
  activationStatus: "all" | "activated" | "pending";
  onActivationStatusChange: (val: "all" | "activated" | "pending") => void;
  onReset: () => void;
};

export default function Filters({
  areaOptions,
  storeTypeOptions,
  selectedAreas,
  onAreasChange,
  selectedStoreTypes,
  onStoreTypesChange,
  activationStatus,
  onActivationStatusChange,
  onReset,
}: FiltersProps) {
  const hasActiveFilters =
    selectedAreas.length > 0 || selectedStoreTypes.length > 0 || activationStatus !== "all";

  return (
    <Card className="border shadow-xs bg-card/60 backdrop-blur-xs">
      <CardContent className="p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4 items-end">
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

          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
              Activation Status
            </label>
            <Select
              value={activationStatus}
              onValueChange={(val) =>
                onActivationStatusChange(val as "all" | "activated" | "pending")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="activated">Activated</SelectItem>
                <SelectItem value="pending">Pending Activation</SelectItem>
              </SelectContent>
            </Select>
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
