"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type {
  DateRangePreset,
  LeadTimeFilters,
  LeadTimeProductOption,
} from "../types";

type FiltersProps = {
  filters: LeadTimeFilters;
  products: LeadTimeProductOption[];
  loadingProducts: boolean;
  loadingData: boolean;
  onChange: (next: LeadTimeFilters) => void;
  onApply: () => void;
};

const presetOptions: { key: DateRangePreset; label: string }[] = [
  { key: "yesterday", label: "Yesterday" },
  { key: "this-week", label: "This Week" },
  { key: "this-month", label: "This Month" },
  { key: "this-year", label: "This Year" },
  { key: "custom", label: "Custom" },
];

export function Filters({
  filters,
  products,
  loadingProducts,
  loadingData,
  onChange,
  onApply,
}: FiltersProps) {
  const [productOpen, setProductOpen] = React.useState(false);

  const setPreset = (preset: DateRangePreset) => {
    onChange({ ...filters, dateRangePreset: preset });
  };

  //   const setDate = (key: "dateFrom" | "dateTo", value: string) => {
  //     onChange({ ...filters, [key]: value, dateRangePreset: "custom" });
  //   };

  // Multi-select: choose one or more products. Normalize ids to string so
  // removing/contains checks work regardless of numeric/string id shapes.
  const toggleProduct = (option: LeadTimeProductOption) => {
    const id = String(option.id);
    const current = (filters.productIds ?? []).map(String);
    const exists = current.includes(id);
    const next = exists ? current.filter((i) => i !== id) : [...current, id];
    onChange({ ...filters, productIds: next });
  };

  const selectedIdSet = new Set((filters.productIds ?? []).map(String));
  const selectedProducts = products.filter((p) =>
    selectedIdSet.has(String(p.id)),
  );

  return (
    <Card className="border-muted/60 dark:border-zinc-700">
      <CardContent className="space-y-10">
        <div className="flex items-start gap-3">
          {/* <div className="rounded-md bg-muted/50 p-2 text-primary">
            <Filter className="h-5 w-5" />
          </div> */}
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold">Lead Time Tracker</h2>
            <p className="text-sm text-muted-foreground">
              Track PO → SO lead times for selected products and date range
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              Date Range
            </Label>
            <div className="flex justify-between ">
              <div className="flex flex-wrap gap-2">
                {presetOptions.map((preset) => (
                  <Button
                    key={preset.key}
                    size="sm"
                    variant={
                      filters.dateRangePreset === preset.key
                        ? "default"
                        : "outline"
                    }
                    onClick={() => setPreset(preset.key)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            {filters.dateRangePreset === "custom" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="rp-dateFrom">Date From</Label>
                  <Input
                    id="rp-dateFrom"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) =>
                      onChange({ ...filters, dateFrom: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rp-dateTo">Date To</Label>
                  <Input
                    id="rp-dateTo"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) =>
                      onChange({ ...filters, dateTo: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Product</Label>
            <div className="flex items-stretch gap-3">
              <Popover open={productOpen} onOpenChange={setProductOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={productOpen}
                    className="flex-1 justify-between"
                  >
                    {selectedProducts.length === 0
                      ? "Select Product"
                      : selectedProducts.length === 1
                        ? `${selectedProducts[0].name}${selectedProducts[0].code ? ` (${selectedProducts[0].code})` : ""}`
                        : `${selectedProducts.length} selected`}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-(--radix-popover-trigger-width) p-0"
                  align="start"
                >
                  <div className="px-3 py-2 border-b bg-muted/5">
                    <div className="text-sm font-medium">Products</div>
                  </div>
                  <Command>
                    <CommandInput placeholder="Search products..." />
                    <CommandList>
                      {loadingProducts && products.length === 0 ? (
                        <div className="p-4">
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-5/6" />
                        </div>
                      ) : (
                        <>
                          <CommandEmpty>No product found.</CommandEmpty>
                          <CommandGroup>
                            {products.map((product) => (
                              <CommandItem
                                key={product.id}
                                value={`${product.name} ${product.code ?? ""}`}
                                onSelect={() => toggleProduct(product)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedIdSet.has(String(product.id))
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {product.name}
                                  </span>
                                  {product.code ? (
                                    <span className="text-xs text-muted-foreground">
                                      {product.code}
                                    </span>
                                  ) : null}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button onClick={onApply} className="shrink-0">
                {loadingData ? (
                  <span className="flex items-center">
                    <Spinner className="h-4 w-4 mr-2" /> Loading...
                  </span>
                ) : loadingProducts ? (
                  <span className="flex items-center">
                    <Spinner className="h-4 w-4 mr-2" /> Apply Filters
                  </span>
                ) : (
                  "Apply Filters"
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Active product indicators */}
        {selectedProducts.length > 0 && (
          <div className="pt-2 border-t">
            <Label className="text-xs">Active Filters</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedProducts.map((p) => (
                <Badge key={p.id} variant="secondary" className="gap-1">
                  <span className="truncate">{p.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${p.name}`}
                    className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full p-0 hover:bg-muted/10 focus:outline-none cursor-pointer"
                    onClick={() => {
                      const next = (filters.productIds ?? [])
                        .map(String)
                        .filter((id) => id !== String(p.id));
                      onChange({ ...filters, productIds: next });
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange({ ...filters, productIds: [] })}
                className="ml-1"
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
