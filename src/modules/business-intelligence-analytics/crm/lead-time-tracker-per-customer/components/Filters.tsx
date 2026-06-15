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
  CustomerLeadTimeFilters,
  CustomerOption,
} from "../types";

type FiltersProps = {
  filters: CustomerLeadTimeFilters;
  customers: CustomerOption[];
  loadingCustomers: boolean;
  loadingData: boolean;
  onChange: (next: CustomerLeadTimeFilters) => void;
  onApply: () => void;
};

export function Filters({
  filters,
  customers,
  loadingCustomers,
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
  const [weekPick, setWeekPick] = React.useState<string>("");
  const [monthPick, setMonthPick] = React.useState<string>("");
  const [customerOpen, setCustomerOpen] = React.useState<boolean>(false);
  const [cmdQuery, setCmdQuery] = React.useState<string>("");
  const MAX_VISIBLE_CUSTOMERS = 100;

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

  // Convert HTML week value (YYYY-W##) to start/end local dates
  const weekToRange = (weekVal: string) => {
    const m = (weekVal || "").match(/^(\d{4})-W?(\d{2})$/);
    if (!m) return null;
    const year = Number(m[1]);
    const week = Number(m[2]);
    const jan4 = new Date(year, 0, 4);
    const jan4Day = (jan4.getDay() + 6) % 7;
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

  // Single-select: choose one customer
  const selectCustomer = React.useCallback(
    (option: CustomerOption) => {
      const code = option.code;
      const current = filters.customerCodes ?? [];
      const exists = current.includes(code);
      const next = exists ? [] : [code];
      onChange({ ...filters, customerCodes: next });
      setCustomerOpen(false);
      setCmdQuery("");
    },
    [filters, onChange],
  );

  const selectedCodeSet = React.useMemo(
    () => new Set(filters.customerCodes ?? []),
    [filters.customerCodes],
  );

  const customerLookup = React.useMemo(() => {
    const m = new Map<string, CustomerOption>();
    for (const c of customers) m.set(c.code, c);
    return m;
  }, [customers]);

  const customersIndex = React.useMemo(() => {
    return customers.map((c) => ({
      code: c.code,
      text: `${c.name} ${c.code}`.toLowerCase(),
    }));
  }, [customers]);

  const selectedCustomers = React.useMemo(() => {
    if (!customers || customers.length === 0) return [] as CustomerOption[];
    return Array.from(selectedCodeSet)
      .map((code) => customerLookup.get(code))
      .filter(Boolean) as CustomerOption[];
  }, [selectedCodeSet, customerLookup, customers]);

  const filteredCustomers = React.useMemo(() => {
    const q = (cmdQuery || "").trim().toLowerCase();
    if (!q) {
      return customers.slice(0, MAX_VISIBLE_CUSTOMERS);
    }
    const matches = [] as CustomerOption[];
    for (const idx of customersIndex) {
      if (idx.text.includes(q)) {
        const c = customerLookup.get(idx.code);
        if (c) matches.push(c);
        if (matches.length >= MAX_VISIBLE_CUSTOMERS) break;
      }
    }
    return matches;
  }, [customers, customersIndex, customerLookup, cmdQuery]);

  return (
    <Card className="">
      <CardContent className="space-y-10">
        <div className="flex items-start gap-3">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold">Lead Time Tracker Per Customer</h2>
            <p className="text-sm text-muted-foreground">
              Track SO → PO lead times for selected customers and date range
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-3">
            <Label>Date Range</Label>
            <div className="flex flex-wrap gap-2 items-center">
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
                        className="rounded-sm border px-2 py-1"
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
                  <Label htmlFor="clt-dateFrom">Date From</Label>
                  <Input
                    id="clt-dateFrom"
                    type="date"
                    className=""
                    value={filters.dateFrom}
                    onChange={(e) =>
                      onChange({ ...filters, dateFrom: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clt-dateTo">Date To</Label>
                  <Input
                    id="clt-dateTo"
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
            <Label className="text-sm font-medium">Customer</Label>
            <div className="flex items-stretch gap-3">
              <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={customerOpen}
                    className="flex-1 justify-between"
                  >
                    {selectedCustomers.length === 0
                      ? "Select Customer"
                      : `${selectedCustomers[0].name} (${selectedCustomers[0].code})`}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-full min-w-[300px] p-0"
                  align="start"
                >
                  <div className="px-3 py-2 border-b bg-muted/5">
                    <div className="text-sm font-medium">Customers</div>
                  </div>
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search customers..."
                      onValueChange={(v: string) => setCmdQuery(v)}
                    />
                    <CommandList>
                      {loadingCustomers && customers.length === 0 ? (
                        <div className="p-4">
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-5/6" />
                        </div>
                      ) : (
                        <>
                          {filteredCustomers.length === 0 ? (
                            <CommandEmpty>No customer found.</CommandEmpty>
                          ) : (
                            <>
                              <CommandGroup>
                                {filteredCustomers.map((customer) => (
                                  <CommandItem
                                    key={customer.code}
                                    value={`${customer.name} ${customer.code}`}
                                    onSelect={() => selectCustomer(customer)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedCodeSet.has(customer.code)
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {customer.name}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {customer.code}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                              {cmdQuery.trim() === "" &&
                                customers.length > MAX_VISIBLE_CUSTOMERS && (
                                  <div className="px-3 py-2 text-xs text-muted-foreground">
                                    Showing first {MAX_VISIBLE_CUSTOMERS} of{" "}
                                    {customers.length} customers. Type to search
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
            </div>

            {/* PO Number Filter */}
            <Label className="text-sm font-medium">PO Number</Label>
            <Input
              placeholder="Enter PO Number (optional)"
              value={filters.poNo}
              onChange={(e) =>
                onChange({ ...filters, poNo: e.target.value })
              }
            />

            {/* Apply Button */}
            <Button
              onClick={onApply}
              className="w-full"
              disabled={loadingData}
            >
              {loadingData ? (
                <span className="flex items-center">
                  <Spinner className="h-4 w-4 mr-2" /> Loading...
                </span>
              ) : loadingCustomers ? (
                <span className="flex items-center">
                  <Spinner className="h-4 w-4 mr-2" /> Apply Filters
                </span>
              ) : (
                "Apply Filters"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
