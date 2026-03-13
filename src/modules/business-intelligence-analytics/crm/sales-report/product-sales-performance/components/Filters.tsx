// src/modules/business-intelligence-analytics/sales-report/product-sales-performance/components/Filters.tsx
"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { ProductPerformanceFilters } from "../types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

type FiltersProps = {
  filters: ProductPerformanceFilters;
  onChange: (filters: ProductPerformanceFilters) => void;
  onLoad: () => void;
  loading: boolean;
  uniqueSuppliers: string[];
  uniqueProducts: string[];
  uniqueCities: string[];
  uniqueProvinces: string[];
  uniqueDivisions: string[];
  uniqueOperations: string[];
  uniqueSalesmen: string[];
};

export function Filters(props: FiltersProps) {
  // Theme mode detection
  // const { theme, systemTheme } = useTheme();
  // const resolvedTheme = theme === "system" ? systemTheme : theme;
  // resolvedTheme will be "light" or "dark"
  const {
    filters,
    onChange,
    onLoad,
    loading,
    uniqueSuppliers,
    uniqueProducts,
    uniqueCities,
    uniqueProvinces,
    uniqueDivisions,
    uniqueOperations,
    uniqueSalesmen,
  } = props;

  // Mark some props/values as used to avoid unused-variable TypeScript errors
  // void resolvedTheme;
  void onLoad;
  void loading;

  // Search states for each filter
  const [supplierSearch, setSupplierSearch] = React.useState("");
  const [productSearch, setProductSearch] = React.useState("");
  const [citySearch, setCitySearch] = React.useState("");
  const [provinceSearch, setProvinceSearch] = React.useState("");
  const [divisionSearch, setDivisionSearch] = React.useState("");
  const [operationSearch, setOperationSearch] = React.useState("");
  const [salesmanSearch, setSalesmanSearch] = React.useState("");

  // Group items by first word
  const groupItems = (items: string[]) => {
    const groups = new Map<string, string[]>();

    items.forEach((item) => {
      // Skip null, undefined, or empty values
      if (!item) return;

      const firstWord = item.split(" ")[0];
      if (!groups.has(firstWord)) {
        groups.set(firstWord, []);
      }
      groups.get(firstWord)!.push(item);
    });

    return groups;
  };

  // Filter and group suppliers
  // const filteredGroupedSuppliers = React.useMemo(() => {
  //   const filtered = supplierSearch
  //     ? uniqueSuppliers.filter((s) => s.toLowerCase().includes(supplierSearch.toLowerCase()))
  //     : uniqueSuppliers;
  //   return groupItems(filtered);
  // }, [uniqueSuppliers, supplierSearch]);

  // Filter and group products
  const filteredGroupedProducts = React.useMemo(() => {
    const filtered = productSearch
      ? uniqueProducts.filter((p) => p.toLowerCase().includes(productSearch.toLowerCase()))
      : uniqueProducts;
    return groupItems(filtered);
  }, [uniqueProducts, productSearch]);

  // Filter and group cities
  const filteredGroupedCities = React.useMemo(() => {
    const filtered = citySearch
      ? uniqueCities.filter((c) => c.toLowerCase().includes(citySearch.toLowerCase()))
      : uniqueCities;
    return groupItems(filtered);
  }, [uniqueCities, citySearch]);

  // Filter and group provinces
  const filteredGroupedProvinces = React.useMemo(() => {
    const filtered = provinceSearch
      ? uniqueProvinces.filter((p) => p.toLowerCase().includes(provinceSearch.toLowerCase()))
      : uniqueProvinces;
    return groupItems(filtered);
  }, [uniqueProvinces, provinceSearch]);

  // Filter and group divisions
  const filteredGroupedDivisions = React.useMemo(() => {
    const filtered = divisionSearch
      ? uniqueDivisions.filter((d) => d.toLowerCase().includes(divisionSearch.toLowerCase()))
      : uniqueDivisions;
    return groupItems(filtered);
  }, [uniqueDivisions, divisionSearch]);

  // Filter and group operations
  const filteredGroupedOperations = React.useMemo(() => {
    const filtered = operationSearch
      ? uniqueOperations.filter((o) => o.toLowerCase().includes(operationSearch.toLowerCase()))
      : uniqueOperations;
    return groupItems(filtered);
  }, [uniqueOperations, operationSearch]);

  // Filter and group salesmen
  const filteredGroupedSalesmen = React.useMemo(() => {
    const filtered = salesmanSearch
      ? uniqueSalesmen.filter((s) => s.toLowerCase().includes(salesmanSearch.toLowerCase()))
      : uniqueSalesmen;
    return groupItems(filtered);
  }, [uniqueSalesmen, salesmanSearch]);

  const handleMultiSelectChange = (
    field: keyof Pick<ProductPerformanceFilters, "suppliers" | "products" | "cities" | "provinces" | "divisions" | "operations" | "salesmen">,
    value: string,
    checked: boolean
  ) => {
    const currentValues = filters[field] || [];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter((v) => v !== value);
    onChange({ ...filters, [field]: newValues });
  };

  const clearFilter = (
    field: keyof Pick<ProductPerformanceFilters, "suppliers" | "products" | "cities" | "provinces" | "divisions" | "operations" | "salesmen">
  ) => {
    onChange({ ...filters, [field]: [] });
  };

  // Handle group selection (select all items in a group)
  const handleGroupSelect = (
    field: keyof Pick<ProductPerformanceFilters, "suppliers" | "products" | "cities" | "provinces">,
    items: string[],
    checked: boolean
  ) => {
    const currentValues = filters[field] || [];
    let newValues: string[];

    if (checked) {
      // Add all items from the group that aren't already selected
      const itemsToAdd = items.filter((item) => !currentValues.includes(item));
      newValues = [...currentValues, ...itemsToAdd];
    } else {
      // Remove all items from the group
      newValues = currentValues.filter((v) => !items.includes(v));
    }

    onChange({ ...filters, [field]: newValues });
  };

  return (
    <Card className="dark:border-zinc-700 dark:bg-white/13">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Top Row: Title & Load Button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Product Sales Performance Dashboard</h2>
              <p className="text-sm text-muted-foreground">
                Interactive analytics across products, suppliers, and locations
              </p>
            </div>
            {/* <Button onClick={onLoad} disabled={loading}>
              {loading ? "Loading..." : "Load Data"}
            </Button> */}
          </div>

          {/* Date Range Presets */}
          <div className="space-y-3">
            <Label>Date Range</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                className="dark:border-zinc-700"
                variant={filters.dateRangePreset === "yesterday" ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ ...filters, dateRangePreset: "yesterday" })}
              >
                Yesterday
              </Button>
              {/* <Button
                variant={filters.dateRangePreset === "today" ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ ...filters, dateRangePreset: "today" })}
              >
                Today
              </Button> */}
              {/* <Button
                variant={filters.dateRangePreset === "tomorrow" ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ ...filters, dateRangePreset: "tomorrow" })}
              >
                Tomorrow
              </Button> */}
              <Button
                className="dark:border-zinc-700"
                variant={filters.dateRangePreset === "this-week" ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ ...filters, dateRangePreset: "this-week" })}
              >
                This Week
              </Button>
              <Button
                className="dark:border-zinc-700"
                variant={filters.dateRangePreset === "this-month" ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ ...filters, dateRangePreset: "this-month" })}
              >
                This Month
              </Button>
              <Button
                className="dark:border-zinc-700"
                variant={filters.dateRangePreset === "this-year" ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ ...filters, dateRangePreset: "this-year" })}
              >
                This Year
              </Button>
              <Button
                className="dark:border-zinc-700"
                variant={filters.dateRangePreset === "custom" ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ ...filters, dateRangePreset: "custom" })}
              >
                Custom
              </Button>
              {/* Custom Date Inputs (shown only when Custom is selected)
              // {filters.dateRangePreset === "custom" && (
              //   <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
              //     <div className="space-y-2">
              //       <Label htmlFor="dateFrom">Date From</Label>
              //       <Input
              //         id="dateFrom"
              //         type="date"
              //         value={filters.dateFrom}
              //         onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
              //       />
              //     </div>
              //     <div className="space-y-2">
              //       <Label htmlFor="dateTo">Date To</Label>
              //       <Input
              //         id="dateTo"
              //         type="date"
              //         value={filters.dateTo}
              //         onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
              //       />
              //     </div>
              //   </div>
              // )} */}
            </div>

            {/* Custom Date Inputs (shown only when Custom is selected) */}
            {filters.dateRangePreset === "custom" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">Date From</Label>
                  <Input
                    className="dark:border-zinc-700"
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTo">Date To</Label>
                  <Input
                    className="dark:border-zinc-700"
                    id="dateTo"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 ">

            {/* Suppliers Multi-Select */}
            <div className="space-y-2">
              <Label>Suppliers</Label>
              <Popover >
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between dark:border-zinc-700">
                    {filters.suppliers.length > 0
                      ? `${filters.suppliers.length} selected`
                      : "All Suppliers"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 dark:border-zinc-700" align="start" >
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
                      {uniqueSuppliers.map((supplier) => (
                        <div key={supplier} className="flex items-center space-x-2 ">
                          <Checkbox
                            className="dark:border-zinc-700"
                            id={`supplier-${supplier}`}
                            checked={filters.suppliers.includes(supplier)}
                            onCheckedChange={(checked) =>
                              handleMultiSelectChange("suppliers", supplier, !!checked)
                            }
                          />
                          <label
                            htmlFor={`supplier-${supplier}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {supplier}
                          </label>
                          {/* <div className="p-2 space-y-1">
                      {Array.from(filteredGroupedSuppliers.entries()).map(([group, items]) => (
                        <div key={group}>
                          <div className="font-semibold text-sm px-2 py-1 text-primary">{group}</div>
                          {items.map((supplier) => (
                            <div key={supplier} className="flex items-center space-x-2 px-4 py-1 hover:bg-muted rounded">
                              <Checkbox
                                id={`supplier-${supplier}`}
                                checked={filters.suppliers.includes(supplier)}
                                onCheckedChange={(checked) =>
                                  handleMultiSelectChange("suppliers", supplier, !!checked)
                                }
                              />
                              <label
                                htmlFor={`supplier-${supplier}`}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {supplier}
                              </label>
                            </div>
                          ))} */}
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
                  className="h-6 px-2 text-xs"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Products Multi-Select */}
            <div className="space-y-2">
              <Label>Products</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between dark:border-zinc-700">
                    {filters.products.length > 0
                      ? `${filters.products.length} selected`
                      : "All Products"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 dark:border-zinc-700" align="start">
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
                      {Array.from(filteredGroupedProducts.entries()).map(([group, items]) => {
                        const allSelected = items.every((item) => filters.products.includes(item));
                        const someSelected = items.some((item) => filters.products.includes(item));
                        const checkedState = allSelected ? true : someSelected ? "indeterminate" : false;

                        return (
                          <div key={group}>
                            <div className="flex items-center space-x-2 px-2 py-1 hover:bg-muted rounded cursor-pointer">
                              <Checkbox
                                id={`product-group-${group}`}
                                checked={checkedState}
                                onCheckedChange={(checked) =>
                                  handleGroupSelect("products", items, !!checked)
                                }
                              />
                              <label
                                htmlFor={`product-group-${group}`}
                                className="font-semibold text-sm text-primary cursor-pointer flex-1"
                              >
                                {group} ({items.length})
                              </label>
                            </div>
                            {items.map((product) => (
                              <div key={product} className="flex items-center space-x-2 px-4 py-1 hover:bg-muted rounded">
                                <Checkbox
                                  className="dark:border-zinc-700"
                                  id={`product-${product}`}
                                  checked={filters.products.includes(product)}
                                  onCheckedChange={(checked) =>
                                    handleMultiSelectChange("products", product, !!checked)
                                  }
                                />
                                <label
                                  htmlFor={`product-${product}`}
                                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                >
                                  {product}
                                </label>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {filters.products.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter("products")}
                  className="h-6 px-2 text-xs"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Cities & Provinces */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Cities</Label>
              <Popover >
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between dark:border-zinc-700">
                    {filters.cities.length > 0
                      ? `${filters.cities.length} selected`
                      : "All Cities"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 dark:border-zinc-700" align="start">
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
                      {Array.from(filteredGroupedCities.entries()).map(([group, items]) => {

                        return (
                          <div key={group} className="dark:border-zinc-700">
                            {items.map((city) => (
                              <div key={city} className="flex items-center space-x-2 px-4 py-1 hover:bg-muted rounded dark:border-zinc-700">
                                <Checkbox
                                  className="dark:border-zinc-700"
                                  id={`city-${city}`}
                                  checked={filters.cities.includes(city)}
                                  onCheckedChange={(checked) =>
                                    handleMultiSelectChange("cities", city, !!checked)
                                  }
                                />
                                <label
                                  htmlFor={`city-${city}`}
                                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                >
                                  {city}
                                </label>
                              </div>
                            ))}
                          </div>
                        );
                      })}
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
                  <Button variant="outline" className="w-full justify-between dark:border-zinc-700">
                    {filters.provinces.length > 0
                      ? `${filters.provinces.length} selected`
                      : "All Provinces"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 dark:border-zinc-700" align="start">
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
                      {Array.from(filteredGroupedProvinces.entries()).map(([group, items]) => {

                        return (
                          <div key={group}>
                            {items.map((province) => (
                              <div key={province} className="flex items-center space-x-2 px-4 py-1 hover:bg-muted rounded">
                                <Checkbox
                                  className="dark:border-zinc-700"
                                  id={`province-${province}`}
                                  checked={filters.provinces.includes(province)}
                                  onCheckedChange={(checked) =>
                                    handleMultiSelectChange("provinces", province, !!checked)
                                  }
                                />
                                <label
                                  htmlFor={`province-${province}`}
                                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                >
                                  {province}
                                </label>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {filters.provinces.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter("provinces")}
                  className="h-6 px-2 text-xs"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Additional Filters Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Divisions Multi-Select */}
            <div className="space-y-2 ">
              <Label>Divisions</Label>
              <Popover >
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between dark:border-zinc-700 ">
                    {filters.divisions.length > 0
                      ? `${filters.divisions.length} selected`
                      : "All Divisions"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 dark:border-zinc-700 " align="start">
                  <div className="p-2 border-b dark:border-zinc-700 dark:bg-white/13">
                    <Input
                      placeholder="Search divisions..."
                      value={divisionSearch}
                      onChange={(e) => setDivisionSearch(e.target.value)}
                      className="h-8 dark:border-zinc-700 "
                    />
                  </div>
                  <ScrollArea className="h-64">
                    <div className="p-2 space-y-1 dark:bg-white/13">
                      {Array.from(filteredGroupedDivisions.entries()).map(([group, items]) => (
                        <div key={group}>
                          {items.map((division) => (
                            <div key={division} className="flex items-center space-x-2 px-4 py-1 hover:bg-muted rounded">
                                <Checkbox
                                  className="dark:border-zinc-700"
                                  id={`division-${division}`}
                                  checked={filters.divisions.includes(division)}
                                  onCheckedChange={(checked) =>
                                    handleMultiSelectChange("divisions", division, !!checked)
                                  }
                                />
                              <label
                                htmlFor={`division-${division}`}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {division}
                              </label>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {filters.divisions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter("divisions")}
                  className="h-6 px-2 text-xs"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Operations Multi-Select */}
            <div className="space-y-2">
              <Label>Operations</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between dark:border-zinc-700">
                    {filters.operations.length > 0
                      ? `${filters.operations.length} selected`
                      : "All Operations"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 dark:border-zinc-700" align="start">
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
                      {Array.from(filteredGroupedOperations.entries()).map(([group, items]) => (
                        <div key={group}>
                          {items.map((operation) => (
                            <div key={operation} className="flex items-center space-x-2 px-4 py-1 hover:bg-muted rounded">
                                <Checkbox
                                  className="dark:border-zinc-700"
                                  id={`operation-${operation}`}
                                  checked={filters.operations.includes(operation)}
                                  onCheckedChange={(checked) =>
                                    handleMultiSelectChange("operations", operation, !!checked)
                                  }
                                />
                              <label
                                htmlFor={`operation-${operation}`}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {operation}
                              </label>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {filters.operations.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter("operations")}
                  className="h-6 px-2 text-xs"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Salesmen Multi-Select */}
            <div className="space-y-2">
              <Label>Salesmen</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between dark:border-zinc-700">
                    {filters.salesmen.length > 0
                      ? `${filters.salesmen.length} selected`
                      : "All Salesmen"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 dark:border-zinc-700" align="start">
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
                      {Array.from(filteredGroupedSalesmen.entries()).map(([group, items]) => (
                        <div key={group}>
                          {items.map((salesman) => (
                            <div key={salesman} className="flex items-center space-x-2 px-4 py-1 hover:bg-muted rounded">
                                <Checkbox
                                  className="dark:border-zinc-700"
                                  id={`salesman-${salesman}`}
                                  checked={filters.salesmen.includes(salesman)}
                                  onCheckedChange={(checked) =>
                                    handleMultiSelectChange("salesmen", salesman, !!checked)
                                  }
                                />
                              <label
                                htmlFor={`salesman-${salesman}`}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {salesman}
                              </label>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {filters.salesmen.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter("salesmen")}
                  className="h-6 px-2 text-xs"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {(filters.suppliers.length > 0 ||
            filters.products.length > 0 ||
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
                {filters.cities.map((c) => (
                  <Badge key={c} variant="secondary">
                    City: {c}
                    <button
                      onClick={() =>
                        onChange({ ...filters, cities: filters.cities.filter((x) => x !== c) })
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

// Silence unused variable warnings for values intentionally kept for API
// compatibility with parent components.
void undefined;
