"use client";

import type { TacticalSkuFilters } from "../types";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";

type TacticalSkuFiltersProps = {
  value: TacticalSkuFilters;
  onChange: (next: TacticalSkuFilters) => void;
  skuOptions: { value: string; label: string }[];
  salesmanOptions: { value: string; label: string }[];
  onPrint: () => void;
  printing: boolean;
  disabled?: boolean;
};

export function TacticalSkuFiltersBar({
  value,
  onChange,
  skuOptions,
  salesmanOptions,
  onPrint,
  printing,
  disabled = false,
}: TacticalSkuFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-2">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground leading-tight">
            Refine results by SKU, salesman, or keyword. Filters are applied automatically.
          </p>

          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">SKU Filter</p>
              <SearchableSelect
                value={value.sku || "__all__"}
                onValueChange={(next) => onChange({ ...value, sku: next === "__all__" ? "" : next })}
                options={[{ value: "__all__", label: "All SKUs" }, ...skuOptions]}
                placeholder="Select SKU"
                disabled={disabled}
              />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Salesman Filter</p>
              <SearchableSelect
                value={value.salesman || "__all__"}
                onValueChange={(next) => onChange({ ...value, salesman: next === "__all__" ? "" : next })}
                options={[{ value: "__all__", label: "All Salesmen" }, ...salesmanOptions]}
                placeholder="Select Salesman"
                disabled={disabled}
              />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Search</p>
              <Input
                value={value.search}
                onChange={(e) => onChange({ ...value, search: e.target.value })}
                placeholder="Search product, brand, category, or salesman"
                aria-label="Search"
                disabled={disabled}
              />
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={onPrint}
                disabled={disabled || printing}
                className="gap-2"
              >
                <Printer className="size-4" />
                {printing ? "Preparing..." : "Print"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}