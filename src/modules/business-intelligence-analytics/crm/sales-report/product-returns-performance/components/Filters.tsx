// src/modules/business-intelligence-analytics/sales-report/product-returns-performance/components/Filters.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { ProductReturnsFilters } from "../types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { ProductReturnRecord } from "../types";

type FiltersProps = {
  filters: ProductReturnsFilters;
  onChange: (filters: ProductReturnsFilters) => void;
  onLoad: () => void;
  onGenerateReport?: () => void;
  loading: boolean;
  reportGenerated?: boolean;
  rawData: ProductReturnRecord[];
  dateFrom: string;
  dateTo: string;
  uniqueSuppliers: string[];
  uniqueProducts: string[];
  productBrandMap: Record<string, string>;
  uniqueBrands: string[];
  uniqueCities: string[];
  uniqueProvinces: string[];
  uniqueDivisions: string[];
  uniqueOperations: string[];
  uniqueSalesmen: string[];
};

export function Filters(props: FiltersProps) {
  const {
    filters,
    onChange,
    onLoad,
    // onGenerateReport,
    loading,
    // reportGenerated,
    rawData,
    dateFrom,
    dateTo,
    uniqueSuppliers,
    uniqueProducts,
    productBrandMap,
    uniqueBrands,
    uniqueCities,
    uniqueProvinces,
    uniqueDivisions,
    uniqueOperations,
    uniqueSalesmen,
  } = props;

  const [supplierSearch, setSupplierSearch] = React.useState("");
  const [productSearch, setProductSearch] = React.useState("");
  const [brandSearch, setBrandSearch] = React.useState("");
  const [citySearch, setCitySearch] = React.useState("");
  const [provinceSearch, setProvinceSearch] = React.useState("");
  const [divisionSearch, setDivisionSearch] = React.useState("");
  const [operationSearch, setOperationSearch] = React.useState("");
  const [salesmanSearch, setSalesmanSearch] = React.useState("");

  // Group items by first word
  const groupItems = (items: string[]) => {
    const groups = new Map<string, string[]>();
    items.forEach((item) => {
      if (!item) return;
      const firstWord = item.split(" ")[0];
      if (!groups.has(firstWord)) groups.set(firstWord, []);
      groups.get(firstWord)!.push(item);
    });
    return groups;
  };

  const filteredGroupedProducts = React.useMemo(() => {
    const filtered = productSearch
      ? uniqueProducts.filter((p) => {
          const q = productSearch.toLowerCase();
          return (
            p.toLowerCase().includes(q) ||
            (productBrandMap[p] || "").toLowerCase().includes(q)
          );
        })
      : uniqueProducts;
    const groups = new Map<string, string[]>();
    filtered.forEach((item) => {
      const brand = productBrandMap[item] || "Unknown";
      if (!groups.has(brand)) groups.set(brand, []);
      groups.get(brand)!.push(item);
    });
    return groups;
  }, [uniqueProducts, productSearch, productBrandMap]);

  const filteredGroupedCities = React.useMemo(() => {
    const filtered = citySearch
      ? uniqueCities.filter((c) =>
          c.toLowerCase().includes(citySearch.toLowerCase()),
        )
      : uniqueCities;
    return groupItems(filtered);
  }, [uniqueCities, citySearch]);

  const filteredGroupedProvinces = React.useMemo(() => {
    const filtered = provinceSearch
      ? uniqueProvinces.filter((p) =>
          p.toLowerCase().includes(provinceSearch.toLowerCase()),
        )
      : uniqueProvinces;
    return groupItems(filtered);
  }, [uniqueProvinces, provinceSearch]);

  const filteredGroupedDivisions = React.useMemo(() => {
    const filtered = divisionSearch
      ? uniqueDivisions.filter((d) =>
          d.toLowerCase().includes(divisionSearch.toLowerCase()),
        )
      : uniqueDivisions;
    return groupItems(filtered);
  }, [uniqueDivisions, divisionSearch]);

  const filteredGroupedOperations = React.useMemo(() => {
    const filtered = operationSearch
      ? uniqueOperations.filter((o) =>
          o.toLowerCase().includes(operationSearch.toLowerCase()),
        )
      : uniqueOperations;
    return groupItems(filtered);
  }, [uniqueOperations, operationSearch]);

  const filteredGroupedSalesmen = React.useMemo(() => {
    const filtered = salesmanSearch
      ? uniqueSalesmen.filter((s) =>
          s.toLowerCase().includes(salesmanSearch.toLowerCase()),
        )
      : uniqueSalesmen;
    return groupItems(filtered);
  }, [uniqueSalesmen, salesmanSearch]);

  const filteredBrands = React.useMemo(() => {
    return brandSearch
      ? uniqueBrands.filter((b) =>
          b.toLowerCase().includes(brandSearch.toLowerCase()),
        )
      : uniqueBrands;
  }, [uniqueBrands, brandSearch]);

  const filteredSuppliers = React.useMemo(() => {
    return supplierSearch
      ? uniqueSuppliers.filter((s) =>
          s.toLowerCase().includes(supplierSearch.toLowerCase()),
        )
      : uniqueSuppliers;
  }, [uniqueSuppliers, supplierSearch]);
  const handleMultiSelectChange = (
    field: keyof Pick<
      ProductReturnsFilters,
      | "suppliers"
      | "products"
      | "brands"
      | "cities"
      | "provinces"
      | "divisions"
      | "operations"
      | "salesmen"
    >,
    value: string,
    checked: boolean,
  ) => {
    const currentValues = filters[field] || [];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter((v) => v !== value);
    onChange({ ...filters, [field]: newValues });
  };

  const clearFilter = (
    field: keyof Pick<
      ProductReturnsFilters,
      | "suppliers"
      | "products"
      | "brands"
      | "cities"
      | "provinces"
      | "divisions"
      | "operations"
      | "salesmen"
    >,
  ) => {
    onChange({ ...filters, [field]: [] });
  };

  const handleGroupSelect = (
    field: keyof Pick<
      ProductReturnsFilters,
      "suppliers" | "products" | "cities" | "provinces"
    >,
    items: string[],
    checked: boolean,
  ) => {
    const currentValues = filters[field] || [];
    let newValues: string[];
    if (checked) {
      const itemsToAdd = items.filter((item) => !currentValues.includes(item));
      newValues = [...currentValues, ...itemsToAdd];
    } else {
      newValues = currentValues.filter((v) => !items.includes(v));
    }
    onChange({ ...filters, [field]: newValues });
  };

  return (
    <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Title Row */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Product Return Performance Dashboard
              </h2>
              <p className="text-sm text-muted-foreground">
                Analytics across returned products, suppliers, and locations
              </p>
            </div>
          </div>

          {/* Date Range Presets */}
          <div className="space-y-3">
            <Label>Date Range</Label>
            <div className="flex flex-wrap justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    "yesterday",
                    "this-week",
                    "this-month",
                    "this-year",
                    "custom",
                  ] as const
                ).map((preset) => (
                  <Button
                    key={preset}
                    variant={
                      filters.dateRangePreset === preset ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      onChange({ ...filters, dateRangePreset: preset })
                    }
                  >
                    {preset === "yesterday"
                      ? "Yesterday"
                      : preset === "this-week"
                        ? "This Week"
                        : preset === "this-month"
                          ? "This Month"
                          : preset === "this-year"
                            ? "This Year"
                            : "Custom"}
                  </Button>
                ))}
              </div>

              {/* Action buttons
              <div className="flex justify-end gap-2">
                <Button onClick={onGenerateReport} disabled={loading} size="sm">
                  {loading ? "Loading..." : "Generate Report"}
                </Button>
                <Button
                  size="sm"
                  disabled={!reportGenerated || rawData.length === 0}
                  onClick={() => {
                    const ctx: ExportContext = {
                      dateFrom,
                      dateTo,
                      branches: filters.branches ?? [],
                      salesmen: filters.salesmen,
                      statuses: filters.statuses ?? [],
                      suppliers: filters.suppliers,
                      products: filters.products,
                      brands: filters.brands,
                      cities: filters.cities,
                      provinces: filters.provinces,
                      divisions: filters.divisions,
                      operations: filters.operations,
                    };
                    exportToCSV(rawData, ctx);
                  }}
                >
                  Export to CSV
                </Button>
              </div> */}
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

          {/* Row 1: Supplier + Product */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Suppliers */}
            <div className="space-y-2">
              <Label>Suppliers</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between dark:border-zinc-700"
                  >
                    {filters.suppliers.length > 0
                      ? `${filters.suppliers.length} selected`
                      : "All Suppliers"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 p-0 dark:border-zinc-700"
                  align="start"
                >
                  <div className="p-2 border-b dark:border-zinc-700 dark:bg-white/13">
                    <Input
                      placeholder="Search suppliers..."
                      value={supplierSearch}
                      onChange={(e) => setSupplierSearch(e.target.value)}
                      className="h-8 dark:border-zinc-700"
                    />
                  </div>
                  <ScrollArea className="h-64">
                    <div className="p-4 space-y-2 dark:bg-white/13">
                      {filteredSuppliers.map((supplier) => (
                        <div
                          key={supplier}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            className="dark:border-zinc-700"
                            id={`rp-supplier-${supplier}`}
                            checked={filters.suppliers.includes(supplier)}
                            onCheckedChange={(checked) =>
                              handleMultiSelectChange(
                                "suppliers",
                                supplier,
                                !!checked,
                              )
                            }
                          />
                          <label
                            htmlFor={`rp-supplier-${supplier}`}
                            className="text-sm font-medium leading-none cursor-pointer flex-1"
                          >
                            {supplier}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {filters.suppliers.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter("suppliers")}
                  className="h-6 px-2 text-xs dark:border-zinc-700"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Products */}
            <div className="space-y-2">
              <Label>Products</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between dark:border-zinc-700"
                  >
                    {filters.products.length > 0
                      ? `${filters.products.length} selected`
                      : "All Products"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 p-0 dark:border-zinc-700"
                  align="start"
                >
                  <div className="p-2 border-b dark:border-zinc-700 dark:bg-white/13">
                    <Input
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="h-8 dark:border-zinc-700"
                    />
                  </div>
                  <ScrollArea className="h-64">
                    <div className="p-2 space-y-1 dark:bg-white/13">
                      {Array.from(filteredGroupedProducts.entries()).map(
                        ([group, items]) => {
                          const allSelected = items.every((item) =>
                            filters.products.includes(item),
                          );
                          const someSelected = items.some((item) =>
                            filters.products.includes(item),
                          );
                          const checkedState = allSelected
                            ? true
                            : someSelected
                              ? "indeterminate"
                              : false;
                          return (
                            <div key={group}>
                              <div className="flex items-center space-x-2 px-2 py-1 hover:bg-muted rounded cursor-pointer">
                                <Checkbox
                                  className="dark:border-zinc-700"
                                  id={`rp-product-group-${group}`}
                                  checked={checkedState}
                                  onCheckedChange={(checked) =>
                                    handleGroupSelect(
                                      "products",
                                      items,
                                      !!checked,
                                    )
                                  }
                                />
                                <label
                                  htmlFor={`rp-product-group-${group}`}
                                  className="font-semibold text-sm text-primary cursor-pointer flex-1"
                                >
                                  {group} ({items.length})
                                </label>
                              </div>
                              {items.map((product) => (
                                <div
                                  key={product}
                                  className="flex items-center space-x-2 px-4 py-1 hover:bg-muted rounded"
                                >
                                  <Checkbox
                                    className="dark:border-zinc-700"
                                    id={`rp-product-${product}`}
                                    checked={filters.products.includes(product)}
                                    onCheckedChange={(checked) =>
                                      handleMultiSelectChange(
                                        "products",
                                        product,
                                        !!checked,
                                      )
                                    }
                                  />
                                  <label
                                    htmlFor={`rp-product-${product}`}
                                    className="text-sm leading-none cursor-pointer flex-1"
                                  >
                                    {product}
                                  </label>
                                </div>
                              ))}
                            </div>
                          );
                        },
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {filters.products.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter("products")}
                  className="h-6 px-2 text-xs dark:border-zinc-700"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Brands */}
            <div className="space-y-2">
              <Label>Brands</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between dark:border-zinc-700"
                  >
                    {filters.brands.length > 0
                      ? `${filters.brands.length} selected`
                      : "All Brands"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 p-0 dark:border-zinc-700"
                  align="start"
                >
                  <div className="p-2 border-b dark:border-zinc-700 dark:bg-white/13">
                    <Input
                      placeholder="Search brands..."
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="h-8 dark:border-zinc-700"
                    />
                  </div>
                  <ScrollArea className="h-64">
                    <div className="p-4 space-y-2 dark:bg-white/13">
                      {filteredBrands.map((brand) => (
                        <div
                          key={brand}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            className="dark:border-zinc-700"
                            id={`rp-brand-${brand}`}
                            checked={filters.brands.includes(brand)}
                            onCheckedChange={(checked) =>
                              handleMultiSelectChange(
                                "brands",
                                brand,
                                !!checked,
                              )
                            }
                          />
                          <label
                            htmlFor={`rp-brand-${brand}`}
                            className="text-sm font-medium leading-none cursor-pointer flex-1"
                          >
                            {brand}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {filters.brands.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter("brands")}
                  className="h-6 px-2 text-xs dark:border-zinc-700"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Row 2: Cities & Provinces */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Cities</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between dark:border-zinc-700"
                  >
                    {filters.cities.length > 0
                      ? `${filters.cities.length} selected`
                      : "All Cities"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 p-0 dark:border-zinc-700"
                  align="start"
                >
                  <div className="p-2 border-b dark:border-zinc-700 dark:bg-white/13">
                    <Input
                      placeholder="Search cities..."
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      className="h-8 dark:border-zinc-700"
                    />
                  </div>
                  <ScrollArea className="h-64">
                    <div className="p-2 space-y-1 dark:bg-white/13">
                      {Array.from(filteredGroupedCities.entries()).map(
                        ([, items]) =>
                          items.map((city) => (
                            <div
                              key={city}
                              className="flex items-center space-x-2 px-4 py-1 hover:bg-muted rounded"
                            >
                              <Checkbox
                                className="dark:border-zinc-700"
                                id={`rp-city-${city}`}
                                checked={filters.cities.includes(city)}
                                onCheckedChange={(checked) =>
                                  handleMultiSelectChange(
                                    "cities",
                                    city,
                                    !!checked,
                                  )
                                }
                              />
                              <label
                                htmlFor={`rp-city-${city}`}
                                className="text-sm leading-none cursor-pointer flex-1"
                              >
                                {city}
                              </label>
                            </div>
                          )),
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {filters.cities.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter("cities")}
                  className="h-6 px-2 text-xs dark:border-zinc-700"
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label>Provinces</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between dark:border-zinc-700"
                  >
                    {filters.provinces.length > 0
                      ? `${filters.provinces.length} selected`
                      : "All Provinces"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 p-0 dark:border-zinc-700"
                  align="start"
                >
                  <div className="p-2 border-b dark:border-zinc-700 dark:bg-white/13">
                    <Input
                      placeholder="Search provinces..."
                      value={provinceSearch}
                      onChange={(e) => setProvinceSearch(e.target.value)}
                      className="h-8 dark:border-zinc-700"
                    />
                  </div>
                  <ScrollArea className="h-64">
                    <div className="p-2 space-y-1 dark:bg-white/13">
                      {Array.from(filteredGroupedProvinces.entries()).map(
                        ([, items]) =>
                          items.map((province) => (
                            <div
                              key={province}
                              className="flex items-center space-x-2 px-4 py-1 hover:bg-muted rounded"
                            >
                              <Checkbox
                                className="dark:border-zinc-700"
                                id={`rp-province-${province}`}
                                checked={filters.provinces.includes(province)}
                                onCheckedChange={(checked) =>
                                  handleMultiSelectChange(
                                    "provinces",
                                    province,
                                    !!checked,
                                  )
                                }
                              />
                              <label
                                htmlFor={`rp-province-${province}`}
                                className="text-sm leading-none cursor-pointer flex-1"
                              >
                                {province}
                              </label>
                            </div>
                          )),
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {filters.provinces.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter("provinces")}
                  className="h-6 px-2 text-xs dark:border-zinc-700"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Row 3: Division + Operation + Salesman */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Divisions */}
            <div className="space-y-2">
              <Label>Divisions</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between dark:border-zinc-700"
                  >
                    {filters.divisions.length > 0
                      ? `${filters.divisions.length} selected`
                      : "All Divisions"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 p-0 dark:border-zinc-700"
                  align="start"
                >
                  <div className="p-2 border-b dark:border-zinc-700 dark:bg-white/13">
                    <Input
                      placeholder="Search divisions..."
                      value={divisionSearch}
                      onChange={(e) => setDivisionSearch(e.target.value)}
                      className="h-8 dark:border-zinc-700"
                    />
                  </div>
                  <ScrollArea className="h-64">
                    <div className="p-2 space-y-1 dark:bg-white/13">
                      {Array.from(filteredGroupedDivisions.entries()).map(
                        ([, items]) =>
                          items.map((division) => (
                            <div
                              key={division}
                              className="flex items-center space-x-2 px-4 py-1 hover:bg-muted rounded"
                            >
                              <Checkbox
                                className="dark:border-zinc-700"
                                id={`rp-division-${division}`}
                                checked={filters.divisions.includes(division)}
                                onCheckedChange={(checked) =>
                                  handleMultiSelectChange(
                                    "divisions",
                                    division,
                                    !!checked,
                                  )
                                }
                              />
                              <label
                                htmlFor={`rp-division-${division}`}
                                className="text-sm leading-none cursor-pointer flex-1"
                              >
                                {division}
                              </label>
                            </div>
                          )),
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {filters.divisions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter("divisions")}
                  className="h-6 px-2 text-xs dark:border-zinc-700"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Operations */}
            <div className="space-y-2">
              <Label>Operations</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between dark:border-zinc-700"
                  >
                    {filters.operations.length > 0
                      ? `${filters.operations.length} selected`
                      : "All Operations"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 p-0 dark:border-zinc-700"
                  align="start"
                >
                  <div className="p-2 border-b dark:border-zinc-700 dark:bg-white/13">
                    <Input
                      placeholder="Search operations..."
                      value={operationSearch}
                      onChange={(e) => setOperationSearch(e.target.value)}
                      className="h-8 dark:border-zinc-700"
                    />
                  </div>
                  <ScrollArea className="h-64">
                    <div className="p-2 space-y-1 dark:bg-white/13">
                      {Array.from(filteredGroupedOperations.entries()).map(
                        ([, items]) =>
                          items.map((operation) => (
                            <div
                              key={operation}
                              className="flex items-center space-x-2 px-4 py-1 hover:bg-muted rounded"
                            >
                              <Checkbox
                                className="dark:border-zinc-700"
                                id={`rp-operation-${operation}`}
                                checked={filters.operations.includes(operation)}
                                onCheckedChange={(checked) =>
                                  handleMultiSelectChange(
                                    "operations",
                                    operation,
                                    !!checked,
                                  )
                                }
                              />
                              <label
                                htmlFor={`rp-operation-${operation}`}
                                className="text-sm leading-none cursor-pointer flex-1"
                              >
                                {operation}
                              </label>
                            </div>
                          )),
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {filters.operations.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter("operations")}
                  className="h-6 px-2 text-xs dark:border-zinc-700"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Salesmen */}
            <div className="space-y-2">
              <Label>Salesmen</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between dark:border-zinc-700"
                  >
                    {filters.salesmen.length > 0
                      ? `${filters.salesmen.length} selected`
                      : "All Salesmen"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 p-0 dark:border-zinc-700"
                  align="start"
                >
                  <div className="p-2 border-b dark:border-zinc-700 dark:bg-white/13">
                    <Input
                      placeholder="Search salesmen..."
                      value={salesmanSearch}
                      onChange={(e) => setSalesmanSearch(e.target.value)}
                      className="h-8 dark:border-zinc-700"
                    />
                  </div>
                  <ScrollArea className="h-64">
                    <div className="p-2 space-y-1 dark:bg-white/13">
                      {Array.from(filteredGroupedSalesmen.entries()).map(
                        ([, items]) =>
                          items.map((salesman) => (
                            <div
                              key={salesman}
                              className="flex items-center space-x-2 px-4 py-1 hover:bg-muted rounded"
                            >
                              <Checkbox
                                className="dark:border-zinc-700"
                                id={`rp-salesman-${salesman}`}
                                checked={filters.salesmen.includes(salesman)}
                                onCheckedChange={(checked) =>
                                  handleMultiSelectChange(
                                    "salesmen",
                                    salesman,
                                    !!checked,
                                  )
                                }
                              />
                              <label
                                htmlFor={`rp-salesman-${salesman}`}
                                className="text-sm leading-none cursor-pointer flex-1"
                              >
                                {salesman}
                              </label>
                            </div>
                          )),
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {filters.salesmen.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter("salesmen")}
                  className="h-6 px-2 text-xs dark:border-zinc-700"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Active Filter Badges */}
          {(filters.suppliers.length > 0 ||
            filters.products.length > 0 ||
            filters.brands.length > 0 ||
            filters.cities.length > 0 ||
            filters.provinces.length > 0 ||
            filters.divisions.length > 0 ||
            filters.operations.length > 0 ||
            filters.salesmen.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {filters.suppliers.map((s) => (
                <Badge key={s} variant="secondary">
                  Supplier: {s}
                  <button
                    onClick={() =>
                      onChange({
                        ...filters,
                        suppliers: filters.suppliers.filter((x) => x !== s),
                      })
                    }
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.products.map((p) => (
                <Badge key={p} variant="secondary">
                  Product: {p}
                  <button
                    onClick={() =>
                      onChange({
                        ...filters,
                        products: filters.products.filter((x) => x !== p),
                      })
                    }
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.brands.map((b) => (
                <Badge key={b} variant="secondary">
                  Brand: {b}
                  <button
                    onClick={() =>
                      onChange({
                        ...filters,
                        brands: filters.brands.filter((x) => x !== b),
                      })
                    }
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.cities.map((c) => (
                <Badge key={c} variant="secondary">
                  City: {c}
                  <button
                    onClick={() =>
                      onChange({
                        ...filters,
                        cities: filters.cities.filter((x) => x !== c),
                      })
                    }
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.provinces.map((p) => (
                <Badge key={p} variant="secondary">
                  Province: {p}
                  <button
                    onClick={() =>
                      onChange({
                        ...filters,
                        provinces: filters.provinces.filter((x) => x !== p),
                      })
                    }
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.divisions.map((d) => (
                <Badge key={d} variant="secondary">
                  Division: {d}
                  <button
                    onClick={() =>
                      onChange({
                        ...filters,
                        divisions: filters.divisions.filter((x) => x !== d),
                      })
                    }
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.operations.map((o) => (
                <Badge key={o} variant="secondary">
                  Operation: {o}
                  <button
                    onClick={() =>
                      onChange({
                        ...filters,
                        operations: filters.operations.filter((x) => x !== o),
                      })
                    }
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.salesmen.map((s) => (
                <Badge key={s} variant="secondary">
                  Salesman: {s}
                  <button
                    onClick={() =>
                      onChange({
                        ...filters,
                        salesmen: filters.salesmen.filter((x) => x !== s),
                      })
                    }
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
