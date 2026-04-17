"use client";

import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check, X } from "lucide-react";
import { useDriverKPI } from "../hooks/useDriverKPI";
// date-fns format not needed in this component
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function Filter() {
  const { filters, setFilters, drivers, loading, refresh } = useDriverKPI();
  const [localStart, setLocalStart] = useState<string | undefined>(
    filters.startDate,
  );
  const [localEnd, setLocalEnd] = useState<string | undefined>(filters.endDate);
  const [driverSearch, setDriverSearch] = useState("");

  // group drivers by full name (dedupe duplicates by normalized label)
  const driverGroups = useMemo(() => {
    const map = new Map<
      string,
      { id?: string; label: string; raws: string[] }
    >();
    (drivers || []).forEach((d) => {
      const label = String(d.label ?? "").trim();
      const key = label.toLowerCase();
      const raw = String(d.value ?? d.label ?? d.id ?? "");
      if (!map.has(key))
        map.set(key, { id: String(d.id ?? key), label, raws: [raw] });
      else {
        const entry = map.get(key)!;
        if (!entry.raws.includes(raw)) entry.raws.push(raw);
      }
    });
    return Array.from(map.values()).map((g, i) => ({
      id: g.id ?? String(i),
      label: g.label,
      raws: g.raws,
    }));
  }, [drivers]);

  const filteredDrivers = useMemo(() => {
    const q = driverSearch.trim().toLowerCase();
    if (!q) return driverGroups;
    return driverGroups.filter((d) => d.label.toLowerCase().includes(q));
  }, [driverGroups, driverSearch]);

  const selectedDrivers = useMemo(() => {
    return (driverGroups || []).filter((d) =>
      (filters.driverNames || []).some((r) => d.raws.includes(r)),
    );
  }, [driverGroups, filters.driverNames]);

  // Show recent selected driver groups (based on the order of raws in filters.driverNames)
  // We derive recency from the insertion order of the raw values in filters.driverNames
  // by walking that array from the end and mapping to unique groups.
  const ACTIVE_DISPLAY_LIMIT = 4;
  const recencyOrderedSelected = useMemo(() => {
    const raws = filters.driverNames || [];
    const seen = new Set<string>();
    const result: { id: string; label: string; raws: string[] }[] = [];
    for (let i = raws.length - 1; i >= 0; i--) {
      const raw = raws[i];
      const g = driverGroups.find((d) => d.raws.includes(raw));
      if (g && !seen.has(g.id)) {
        seen.add(g.id);
        result.push(g);
      }
    }
    return result; // most-recent-first
  }, [driverGroups, filters.driverNames]);

  const isThisMonth = useMemo(() => {
    if (!filters.startDate || !filters.endDate) return false;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);
    return filters.startDate === start && filters.endDate === end;
  }, [filters.startDate, filters.endDate]);

  function applyDateRange() {
    // update filters; provider effect will refresh when values change
    // but if the user clicks Update without changing dates, force a refresh
    // so the UI responds to the explicit action.
    const willChange =
      localStart !== filters.startDate || localEnd !== filters.endDate;
    setFilters({ startDate: localStart, endDate: localEnd });
    if (!willChange) {
      // force refresh (fetch full dataset for client-side pagination)
      void refresh({ page: 1, limit: -1 });
    }
  }

  function toggleDriverGroup(raws: string[]) {
    const current = new Set(filters.driverNames || []);
    const anySelected = raws.some((r) => current.has(r));
    if (anySelected) {
      // remove all raws for this group
      setFilters({
        driverNames: (filters.driverNames || []).filter(
          (r) => !raws.includes(r),
        ),
      });
    } else {
      // add all raws for this group
      setFilters({
        driverNames: Array.from(
          new Set([...(filters.driverNames || []), ...raws]),
        ),
      });
    }
  }

  function selectAllVisible() {
    const all = (filteredDrivers || []).flatMap((d) => d.raws);
    // create a unique union with existing selections
    const union = Array.from(new Set([...(filters.driverNames || []), ...all]));
    setFilters({ driverNames: union });
  }

  function clearSelection() {
    setFilters({ driverNames: [] });
  }

  function getThisMonthRange() {
    const now = new Date();
    function formatDatePH(date: Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    const start = formatDatePH(new Date(now.getFullYear(), now.getMonth(), 1));
    const end = formatDatePH(
      new Date(now.getFullYear(), now.getMonth() + 1, 0),
    );

    return { start, end };
  }

  function resetFiltersToThisMonth() {
    const { start, end } = getThisMonthRange();
    const driversNotEmpty = (filters.driverNames || []).length > 0;
    const datesDifferent =
      filters.startDate !== start || filters.endDate !== end;
    // update filters; provider effect will refresh when values change
    setFilters({ startDate: start, endDate: end, driverNames: [] });
    // sync local inputs
    setLocalStart(start);
    setLocalEnd(end);
    // if nothing actually changed, force a refresh so UI responds
    if (!datesDifferent && !driversNotEmpty) {
      void refresh({ page: 1, limit: -1 });
    }
  }

  return (
    <div className="space-y-2">
      {/* Desktop / md+ layout */}
      <div className="hidden md:flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border bg-card p-3 shadow-sm justify-end">
        {/* driver filter */}
        <div className="flex min-w-55 items-center gap-2">
          <label className="px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Driver
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-8 min-w-40 justify-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                {selectedDrivers.length > 0
                  ? `${selectedDrivers.length} selected`
                  : "All Drivers"}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-88 max-w-[calc(100vw-2rem)] p-3"
            >
              <div>
                {/* Search + actions row */}
                <div className="mb-2 flex items-center gap-2">
                  <Input
                    placeholder="Search drivers..."
                    value={driverSearch}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setDriverSearch(e.target.value)
                    }
                    className="h-8 flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    aria-label="Clear driver selection"
                    className="h-8 px-2"
                  >
                    Clear
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllVisible}
                    aria-label="Select all visible drivers"
                    className="h-8 px-2"
                  >
                    All
                  </Button>
                </div>

                <div className="border-t border-border" />

                <ScrollArea className="h-56">
                  <div className="space-y-1">
                    {filteredDrivers.length === 0 ? (
                      <p className="py-2 text-center text-sm text-muted-foreground">
                        No drivers
                      </p>
                    ) : (
                      filteredDrivers.map((option) => {
                        const isSelected = (filters.driverNames || []).some(
                          (r) => option.raws.includes(r),
                        );
                        return (
                          <div
                            key={option.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleDriverGroup(option.raws)}
                            onKeyDown={(e: React.KeyboardEvent) => {
                              if (e.key === "Enter" || e.key === " ")
                                toggleDriverGroup(option.raws);
                            }}
                            className={`flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 ${isSelected ? "bg-muted/10" : "hover:bg-muted/5"}`}
                          >
                            <span className="truncate text-sm uppercase tracking-wider">
                              {option.label}
                            </span>
                            {isSelected ? (
                              <Check className="h-4 w-4 text-emerald-600" />
                            ) : null}
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* period filter */}
        <div className="flex min-w-90 flex-wrap items-center gap-2">
          <label className="px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Period
            {isThisMonth && (
              <span className="ml-2 text-[10px] lowercase text-muted-foreground">
                (this month)
              </span>
            )}
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={localStart ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLocalStart(e.target.value)
              }
              className="h-8 w-34 bg-background text-xs uppercase tracking-wider text-muted-foreground lg:w-36"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="date"
              value={localEnd ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLocalEnd(e.target.value)
              }
              className="h-8 w-34 bg-background text-xs uppercase tracking-wider text-muted-foreground lg:w-36"
            />
          </div>
        </div>

        {/* buttons */}
        <div className="ml-auto flex w-full items-center justify-end gap-2 lg:w-auto">
          <Button
            type="button"
            aria-label="Update data for selected period"
            variant="default"
            size="sm"
            className="h-8"
            onClick={applyDateRange}
          >
            {loading ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : (
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
            )}
            {loading ? "Updating..." : "Update Data"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={resetFiltersToThisMonth}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Mobile layout: compact Filters button that opens popover with driver & period */}
      <div className="flex w-full items-center md:hidden">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="flex w-full items-center justify-between text-sm"
            >
              <span>Filters</span>
              <span className="text-xs text-muted-foreground">
                {filters.driverNames?.length
                  ? `${filters.driverNames.length}`
                  : "All"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[min(92vw,24rem)] p-3">
            {/* Search + actions row */}
            <div className="mb-2 flex items-center gap-2">
              <Input
                placeholder="Search drivers..."
                value={driverSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDriverSearch(e.target.value)
                }
                className="h-9 flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                aria-label="Clear driver selection"
                className="h-9 px-2"
              >
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllVisible}
                aria-label="Select all visible drivers"
                className="h-9 px-2"
              >
                All
              </Button>
            </div>

            <div className="my-2 border-t border-border" />

            <ScrollArea className="mb-3 h-56">
              <div className="space-y-1">
                {filteredDrivers.length === 0 ? (
                  <p className="py-2 text-center text-sm text-muted-foreground">
                    No drivers
                  </p>
                ) : (
                  filteredDrivers.map((option) => {
                    const isSelected = (filters.driverNames || []).some((r) =>
                      option.raws.includes(r),
                    );
                    return (
                      <div
                        key={option.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleDriverGroup(option.raws)}
                        onKeyDown={(e: React.KeyboardEvent) => {
                          if (e.key === "Enter" || e.key === " ")
                            toggleDriverGroup(option.raws);
                        }}
                        className={`flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 ${isSelected ? "bg-muted/10" : "hover:bg-muted/5"}`}
                      >
                        <span className="truncate text-sm uppercase tracking-wider">
                          {option.label}
                        </span>
                        {isSelected ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            <div className="flex flex-col gap-2">
              <Input
                type="date"
                value={localStart ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLocalStart(e.target.value)
                }
                className="h-8 w-full"
              />
              <Input
                type="date"
                value={localEnd ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLocalEnd(e.target.value)
                }
                className="h-8 w-full"
              />
              <div className="flex items-center justify-between">
                <Button
                  variant="default"
                  onClick={applyDateRange}
                  disabled={loading}
                >
                  {loading ? (
                    <Spinner className="mr-2 h-4 w-4" />
                  ) : (
                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  )}
                  {loading ? "Updating..." : "Update Data"}
                </Button>
                <Button variant="outline" onClick={resetFiltersToThisMonth}>
                  Clear
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active filters (below filter bar) */}
      {(filters.driverNames?.length ?? 0) > 0 && (
        <div className="mt-2 flex w-full flex-wrap items-center gap-2">
          {recencyOrderedSelected.slice(0, ACTIVE_DISPLAY_LIMIT).map((s) => (
            <Badge key={s.id} className="flex items-center gap-2">
              <span className="max-w-40 truncate md:max-w-48">{s.label}</span>
              <button
                onClick={() => toggleDriverGroup(s.raws)}
                aria-label={`Remove ${s.label}`}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {recencyOrderedSelected.length > ACTIVE_DISPLAY_LIMIT && (
            <Popover>
              <PopoverTrigger asChild>
                <Badge className="cursor-pointer">
                  +{recencyOrderedSelected.length - ACTIVE_DISPLAY_LIMIT} more
                </Badge>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-[18rem] max-w-[calc(100vw-2rem)] p-2"
              >
                <ScrollArea className="max-h-56">
                  <div className="space-y-1">
                    {recencyOrderedSelected
                      .slice(ACTIVE_DISPLAY_LIMIT)
                      .map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between gap-2 rounded px-2 py-1"
                        >
                          <span className="truncate">{s.label}</span>
                          <button
                            onClick={() => toggleDriverGroup(s.raws)}
                            aria-label={`Remove ${s.label}`}
                            className="ml-2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}
    </div>
  );
}
