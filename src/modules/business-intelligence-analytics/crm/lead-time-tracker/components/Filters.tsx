"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
export function Filters({
  filters,
  products,
  loadingProducts,
  loadingData,
  onChange,
  onApply,
}: FiltersProps) {
  const [quarterPick, setQuarterPick] = React.useState<number>(1);
  const [quarterYearPick, setQuarterYearPick] = React.useState<number>(
    new Date().getFullYear(),
  );
  const [yearPick, setYearPick] = React.useState<number>(
    new Date().getFullYear(),
  );
  // const [dayPick, setDayPick] = React.useState<string>(filters.dateFrom || "");
  const [weekPick, setWeekPick] = React.useState<string>("");
  const [monthPick, setMonthPick] = React.useState<string>("");
  const [productOpen, setProductOpen] = React.useState<boolean>(false);
  const [cmdQuery, setCmdQuery] = React.useState<string>("");
  const MAX_VISIBLE_PRODUCTS = 100;
  // Helper utils for date range display
  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const getDisplayRange = (preset: DateRangePreset) => {
    const now = new Date();
    switch (preset) {
      case "today":
        return formatDate(now);
      case "yesterday": {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return formatDate(d);
      }
      case "day-before-yesterday": {
        const d = new Date();
        d.setDate(d.getDate() - 2);
        return formatDate(d);
      }
      case "this-week": {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return `${formatDate(start)} — ${formatDate(end)}`;
      }
      case "last-week": {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay() - 7);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return `${formatDate(start)} — ${formatDate(end)}`;
      }
      case "last-7-days": {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);
        return `${formatDate(start)} — ${formatDate(end)}`;
      }
      case "last-2-weeks": {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 13);
        return `${formatDate(start)} — ${formatDate(end)}`;
      }
      case "this-month": {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return `${formatDate(start)} — ${formatDate(end)}`;
      }
      case "last-month": {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return `${formatDate(start)} — ${formatDate(end)}`;
      }
      case "last-30-days": {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 29);
        return `${formatDate(start)} — ${formatDate(end)}`;
      }
      case "last-2-months": {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return `${formatDate(start)} — ${formatDate(end)}`;
      }
      case "this-quarter": {
        const quarter = Math.floor(now.getMonth() / 3);
        const start = new Date(now.getFullYear(), quarter * 3, 1);
        const end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        return `${formatDate(start)} — ${formatDate(end)}`;
      }
      case "last-quarter": {
        const quarter = Math.floor(now.getMonth() / 3);
        const start = new Date(now.getFullYear(), quarter * 3 - 3, 1);
        const end = new Date(now.getFullYear(), quarter * 3, 0);
        return `${formatDate(start)} — ${formatDate(end)}`;
      }
      case "last-3-months": {
        const end = new Date();
        const start = new Date(end.getFullYear(), end.getMonth() - 2, 1);
        return `${formatDate(start)} — ${formatDate(end)}`;
      }
      case "last-2-quarters": {
        const end = new Date();
        const start = new Date(end.getFullYear(), end.getMonth() - 5, 1);
        return `${formatDate(start)} — ${formatDate(end)}`;
      }
      case "this-year": {
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31);
        return `${formatDate(start)} — ${formatDate(end)}`;
      }
      case "last-year": {
        const start = new Date(now.getFullYear() - 1, 0, 1);
        const end = new Date(now.getFullYear() - 1, 11, 31);
        return `${formatDate(start)} — ${formatDate(end)}`;
      }
      case "custom":
      default:
        return `${filters.dateFrom || "—"} — ${filters.dateTo || "—"}`;
    }
  };

  const getActivePresetDisplay = () => {
    switch (filters.dateRangePreset) {
      case "today":
        return "Today";
      case "yesterday":
        return "Yesterday";
      case "day-before-yesterday":
        return "Day Before Yesterday";
      case "custom":
        return `${filters.dateFrom || "—"} — ${filters.dateTo || "—"}`;
      default:
        return getDisplayRange(filters.dateRangePreset);
    }
  };

  // helper to format Date -> YYYY-MM-DD (local)
  const fmtYMD = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  };

  // Convert HTML week value (YYYY-W##) to start/end local dates (ISO week, Monday start)
  const weekToRange = (weekVal: string) => {
    const m = (weekVal || "").match(/^(\d{4})-W?(\d{2})$/);
    if (!m) return null;
    const year = Number(m[1]);
    const week = Number(m[2]);
    // Find week 1 start (Monday of the week containing Jan 4)
    const jan4 = new Date(year, 0, 4);
    const jan4Day = (jan4.getDay() + 6) % 7; // 0=Mon..6=Sun
    const week1Start = new Date(jan4.getTime() - jan4Day * 24 * 3600 * 1000);
    const start = new Date(
      week1Start.getTime() + (week - 1) * 7 * 24 * 3600 * 1000,
    );
    const end = new Date(start.getTime() + 6 * 24 * 3600 * 1000);
    return { from: fmtYMD(start), to: fmtYMD(end) };
  };

  const applyWeekPick = (val?: string) => {
    const v = val ?? weekPick;
    const r = weekToRange(v);
    if (!r) return;
    onChange({
      ...filters,
      dateRangePreset: "custom",
      dateFrom: r.from,
      dateTo: r.to,
    });
  };

  const applyMonthPick = (val?: string) => {
    const v = val ?? monthPick;
    if (!v) return;
    const m = v.split("-");
    if (m.length < 2) return;
    const y = Number(m[0]);
    const mo = Number(m[1]);
    const start = new Date(y, mo - 1, 1);
    const end = new Date(y, mo, 0);
    onChange({
      ...filters,
      dateRangePreset: "custom",
      dateFrom: fmtYMD(start),
      dateTo: fmtYMD(end),
    });
  };

  const applyQuarterPick = (q?: number, y?: number) => {
    const qq = q ?? quarterPick;
    const yy = y ?? quarterYearPick;
    const startMonth = (qq - 1) * 3;
    const start = new Date(yy, startMonth, 1);
    const end = new Date(yy, startMonth + 3, 0);
    onChange({
      ...filters,
      dateRangePreset: "custom",
      dateFrom: fmtYMD(start),
      dateTo: fmtYMD(end),
    });
  };

  const applyYearPick = (y?: number) => {
    const yy = y ?? yearPick;
    const start = new Date(yy, 0, 1);
    const end = new Date(yy, 11, 31);
    onChange({
      ...filters,
      dateRangePreset: "custom",
      dateFrom: fmtYMD(start),
      dateTo: fmtYMD(end),
    });
  };

  // const applyDayPick = (val?: string) => {
  //   const v = val ?? dayPick;
  //   if (!v) return;
  //   // v is YYYY-MM-DD from input[type=date]
  //   onChange({ ...filters, dateRangePreset: "custom", dateFrom: v, dateTo: v });
  // };

  // Single-select: choose one product. Normalize id to string so checks work
  // regardless of numeric/string id shapes. Selecting the same product will
  // clear the selection.
  const selectProduct = React.useCallback(
    (option: LeadTimeProductOption) => {
      const id = String(option.id);
      const current = (filters.productIds ?? []).map(String);
      const exists = current.includes(id);
      const next = exists ? [] : [id];
      onChange({ ...filters, productIds: next });
      setProductOpen(false);
      setCmdQuery("");
    },
    [filters, onChange],
  );

  // Memoized sets/lookup to avoid re-computation on every render when products
  // is large. We also build a lightweight searchable index to filter quickly.
  const selectedIdSet = React.useMemo(
    () => new Set((filters.productIds ?? []).map(String)),
    [filters.productIds],
  );

  const productLookup = React.useMemo(() => {
    const m = new Map<string, LeadTimeProductOption>();
    for (const p of products) m.set(String(p.id), p);
    return m;
  }, [products]);

  const productsIndex = React.useMemo(() => {
    return products.map((p) => ({
      id: String(p.id),
      text: `${p.name} ${p.code ?? ""}`.toLowerCase(),
    }));
  }, [products]);

  const selectedProducts = React.useMemo(() => {
    if (!products || products.length === 0)
      return [] as LeadTimeProductOption[];
    return Array.from(selectedIdSet)
      .map((id) => productLookup.get(id))
      .filter(Boolean) as LeadTimeProductOption[];
  }, [selectedIdSet, productLookup, products]);

  const filteredProducts = React.useMemo(() => {
    const q = (cmdQuery || "").trim().toLowerCase();
    if (!q) {
      // show first N items when no query to avoid rendering the whole list
      return products.slice(0, MAX_VISIBLE_PRODUCTS);
    }
    const matches = [] as LeadTimeProductOption[];
    for (const idx of productsIndex) {
      if (idx.text.includes(q)) {
        const p = productLookup.get(idx.id);
        if (p) matches.push(p);
        if (matches.length >= MAX_VISIBLE_PRODUCTS) break;
      }
    }
    return matches;
  }, [products, productsIndex, productLookup, cmdQuery]);

  return (
    <Card className="">
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
            <Label>Date Range</Label>
            <div className="flex flex-wrap gap-2 items-center">
              {/* Daily */}
              {/* <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Daily ▾
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {([0, 1, 2, 3, 4, 5, 6] as number[]).map((offset) => {
                    const d = new Date();
                    d.setDate(d.getDate() - offset);
                    const label =
                      offset === 0
                        ? "Today"
                        : `${offset} Day${offset > 1 ? "s" : ""} Ago`;
                    const dateKey = `${d.getFullYear()}-${String(
                      d.getMonth() + 1,
                    ).padStart(
                      2,
                      "0",
                    )}-${String(d.getDate()).padStart(2, "0")}`;
                    const display = d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                    const isActive =
                      filters.dateFrom === dateKey &&
                      filters.dateTo === dateKey;
                    return (
                      <DropdownMenuItem
                        key={offset}
                        className={
                          isActive ? "bg-primary text-primary-foreground" : ""
                        }
                        onClick={() => {
                          if (offset === 0) {
                            onChange({ ...filters, dateRangePreset: "today" });
                          } else if (offset === 1) {
                            onChange({
                              ...filters,
                              dateRangePreset: "yesterday",
                            });
                          } else if (offset === 2) {
                            onChange({
                              ...filters,
                              dateRangePreset: "day-before-yesterday",
                            });
                          } else {
                            onChange({
                              ...filters,
                              dateRangePreset: "custom",
                              dateFrom: dateKey,
                              dateTo: dateKey,
                            });
                          }
                        }}
                      >
                        {label} ({display})
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuItem asChild>
                    <div className="border-t px-3 py-2 w-full">
                      <div className="text-sm font-medium mb-2">
                        Pick a specific day
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="date"
                          value={dayPick}
                          onChange={(e) => setDayPick(e.target.value)}
                          className="w-48"
                        />
                        <button
                          type="button"
                          className="inline-flex items-center px-2 py-1 rounded bg-primary text-white text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            applyDayPick();
                          }}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> */}

              {/* Weekly */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Weekly ▾
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {[
                    { key: "this-week", label: "This Week" },
                    { key: "last-week", label: "Last Week" },
                    { key: "last-7-days", label: "Last 7 Days" },
                    { key: "last-2-weeks", label: "Last 2 Weeks" },
                  ].map(({ key, label }) => (
                    <DropdownMenuItem
                      key={key}
                      className={
                        filters.dateRangePreset === key
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }
                      onClick={() =>
                        onChange({
                          ...filters,
                          dateRangePreset: key as DateRangePreset,
                        })
                      }
                    >
                      {label} ({getDisplayRange(key as DateRangePreset)})
                    </DropdownMenuItem>
                  ))}
                  <div className="border-t px-3 py-2">
                    <div className="text-sm font-medium mb-2">
                      Pick a specific week
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="week"
                        value={weekPick}
                        onChange={(e) => setWeekPick(e.target.value)}
                        className="w-48"
                      />
                      <Button size="sm" onClick={() => applyWeekPick()}>
                        Apply
                      </Button>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Monthly */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Monthly ▾
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {[
                    { key: "this-month", label: "This Month" },
                    { key: "last-month", label: "Last Month" },
                    { key: "last-30-days", label: "Last 30 Days" },
                    { key: "last-2-months", label: "Last 2 Months" },
                  ].map(({ key, label }) => (
                    <DropdownMenuItem
                      key={key}
                      className={
                        filters.dateRangePreset === key
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }
                      onClick={() =>
                        onChange({
                          ...filters,
                          dateRangePreset: key as DateRangePreset,
                        })
                      }
                    >
                      {label} ({getDisplayRange(key as DateRangePreset)})
                    </DropdownMenuItem>
                  ))}
                  <div className="border-t px-3 py-2">
                    <div className="text-sm font-medium mb-2">
                      Pick a specific month
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="month"
                        value={monthPick}
                        onChange={(e) => setMonthPick(e.target.value)}
                        className="w-48"
                      />
                      <Button size="sm" onClick={() => applyMonthPick()}>
                        Apply
                      </Button>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Quarterly */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Quarterly ▾
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {[
                    { key: "this-quarter", label: "This Quarter" },
                    { key: "last-quarter", label: "Last Quarter" },
                    { key: "last-3-months", label: "Last 3 Months" },
                    { key: "last-2-quarters", label: "Last 2 Quarters" },
                  ].map(({ key, label }) => (
                    <DropdownMenuItem
                      key={key}
                      className={
                        filters.dateRangePreset === key
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }
                      onClick={() =>
                        onChange({
                          ...filters,
                          dateRangePreset: key as DateRangePreset,
                        })
                      }
                    >
                      {label} ({getDisplayRange(key as DateRangePreset)})
                    </DropdownMenuItem>
                  ))}
                  <div className="border-t px-3 py-2">
                    <div className="text-sm font-medium mb-2">
                      Pick a specific quarter
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={String(quarterPick)}
                        onChange={(e) => setQuarterPick(Number(e.target.value))}
                        className="rounded border px-2 py-1"
                      >
                        <option value="1">Q1</option>
                        <option value="2">Q2</option>
                        <option value="3">Q3</option>
                        <option value="4">Q4</option>
                      </select>
                      <Input
                        type="number"
                        min={2000}
                        max={2100}
                        value={String(quarterYearPick)}
                        onChange={(e) =>
                          setQuarterYearPick(Number(e.target.value))
                        }
                        className="w-24"
                      />
                      <Button size="sm" onClick={() => applyQuarterPick()}>
                        Apply
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Pick quarter + year then Apply
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Yearly */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Yearly ▾
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {[
                    { key: "this-year", label: "This Year" },
                    { key: "last-year", label: "Last Year" },
                  ].map(({ key, label }) => (
                    <DropdownMenuItem
                      key={key}
                      className={
                        filters.dateRangePreset === key
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }
                      onClick={() =>
                        onChange({
                          ...filters,
                          dateRangePreset: key as DateRangePreset,
                        })
                      }
                    >
                      {label} ({getDisplayRange(key as DateRangePreset)})
                    </DropdownMenuItem>
                  ))}
                  <div className="border-t px-3 py-2">
                    <div className="text-sm font-medium mb-2">
                      Pick a specific year
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={2000}
                        max={2100}
                        value={String(yearPick)}
                        onChange={(e) => setYearPick(Number(e.target.value))}
                        className="w-28"
                      />
                      <Button size="sm" onClick={() => applyYearPick()}>
                        Apply
                      </Button>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Custom */}
              <Button
                variant={
                  filters.dateRangePreset === "custom" ? "default" : "outline"
                }
                size="sm"
                onClick={() =>
                  onChange({ ...filters, dateRangePreset: "custom" })
                }
              >
                Custom
              </Button>
              <Badge variant="secondary" className="ml-2">
                Current Date Filter:{" "}
                <span className="font-bold">{getActivePresetDisplay()}</span>
              </Badge>
            </div>

            {/* Custom Date Inputs */}
            {filters.dateRangePreset === "custom" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="ovc-dateFrom">Date From</Label>
                  <Input
                    id="ovc-dateFrom"
                    type="date"
                    className=""
                    value={filters.dateFrom}
                    onChange={(e) =>
                      onChange({ ...filters, dateFrom: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ovc-dateTo">Date To</Label>
                  <Input
                    id="ovc-dateTo"
                    type="date"
                    className=""
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
                      : `${selectedProducts[0].name}${selectedProducts[0].code ? ` (${selectedProducts[0].code})` : ""}`}
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
                    <CommandInput
                      placeholder="Search products..."
                      onValueChange={(v: string) => setCmdQuery(v)}
                    />
                    <CommandList>
                      {loadingProducts && products.length === 0 ? (
                        <div className="p-4">
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-5/6" />
                        </div>
                      ) : (
                        <>
                          {filteredProducts.length === 0 ? (
                            <CommandEmpty>No product found.</CommandEmpty>
                          ) : (
                            <>
                              <CommandGroup>
                                {filteredProducts.map((product) => (
                                  <CommandItem
                                    key={product.id}
                                    value={`${product.name} ${product.code ?? ""}`}
                                    onSelect={() => selectProduct(product)}
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
                              {cmdQuery.trim() === "" &&
                                products.length > MAX_VISIBLE_PRODUCTS && (
                                  <div className="px-3 py-2 text-xs text-muted-foreground">
                                    Showing first {MAX_VISIBLE_PRODUCTS} of{" "}
                                    {products.length} products. Type to search
                                    for more.
                                  </div>
                                )}
                            </>
                          )}
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button
                onClick={onApply}
                className="shrink-0"
                disabled={(filters.productIds ?? []).length === 0}
                title={
                  (filters.productIds ?? []).length === 0
                    ? "Select a product to enable"
                    : undefined
                }
              >
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
        {/*
          Active product indicators (commented out per request)
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
        */}
      </CardContent>
    </Card>
  );
}
