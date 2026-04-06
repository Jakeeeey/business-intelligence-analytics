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
    <>
      <div className="w-full">
        {/* Desktop / md+ layout */}
        <div className="hidden md:flex w-full flex-wrap items-center gap-3 bg-card p-2 rounded-lg border shadow-sm">
          <div className="flex items-center w-full justify-end">
            <div className="flex flex-row items-center">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider p-2">
                Driver
              </label>
              <div className="flex items-center gap-2 ">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-8 text-[10px] font-bold text-muted-foreground uppercase tracking-wider min-w-32 md:min-w-56"
                    >
                      {selectedDrivers && selectedDrivers.length > 0
                        ? `${selectedDrivers.length} selected`
                        : "All Drivers"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-full md:w-96 p-3">
                    <div>
                      {/* Search + actions row */}
                      <div className="flex items-center gap-2 mb-2">
                        <Input
                          placeholder="Search drivers..."
                          value={driverSearch}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setDriverSearch(e.target.value)
                          }
                          className="flex-1 h-9"
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

                      {/* separator */}
                      <div className="border-t-2 border-black/10" />

                      {/* driver list */}
                      <ScrollArea className="h-56">
                        <div className="space-y-1">
                          {filteredDrivers.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-2">
                              No drivers
                            </p>
                          ) : (
                            filteredDrivers.map((option) => {
                              const isSelected = (
                                filters.driverNames || []
                              ).some((r) => option.raws.includes(r));
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
                                  className={`flex items-center justify-between gap-2 px-2 py-1 rounded cursor-pointer ${isSelected ? "bg-muted/10" : "hover:bg-muted/5"}`}
                                >
                                  <div className="flex items-center gap-2">
                                    {/* <Checkbox
                                      id={`driver-${option.id}`}
                                      checked={isSelected}
                                      onCheckedChange={() =>
                                        toggleDriverGroup(option.raws)
                                      }
                                    /> */}
                                    <span className="text-sm truncate uppercase tracking-wider">
                                      {option.label}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    {isSelected ? (
                                      <Check className="h-4 w-4 text-emerald-600" />
                                    ) : null}
                                  </div>
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
            </div>

            <div className="flex flex-row items-center flex-wrap">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider p-2">
                Period
                {isThisMonth && (
                  <span className="ml-2 text-[10px] text-muted-foreground lowercase">
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
                  className="h-8 w-28 md:w-36 text-xs bg-background text-muted-foreground uppercase tracking-wider"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="date"
                  value={localEnd ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLocalEnd(e.target.value)
                  }
                  className="h-8 w-28 md:w-36 text-xs bg-background text-muted-foreground uppercase tracking-wider"
                />
                <Button
                  type="button"
                  aria-label="Update data for selected period"
                  variant="default"
                  size="sm"
                  className="h-8"
                  onClick={applyDateRange}
                  // disabled={loading}
                >
                  {loading ? (
                    <Spinner className="h-4 w-4 mr-2" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5 mr-2" />
                  )}{" "}
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
          </div>
        </div>

        {/* Mobile layout: compact Filters button that opens popover with driver & period */}
        <div className="flex md:hidden w-full items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full text-sm flex items-center justify-between"
              >
                <span>Filters</span>
                <span className="text-muted-foreground text-xs">
                  {filters.driverNames?.length
                    ? `${filters.driverNames.length}`
                    : "All"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-3">
              {/* Search + actions row */}
              <div className="flex items-center gap-2 mb-2 ">
                <Input
                  placeholder="Search drivers..."
                  value={driverSearch}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDriverSearch(e.target.value)
                  }
                  className="flex-1 h-9 "
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  aria-label="Clear driver selection"
                  className="h-9 px-2"
                >
                  Clears
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

              {/* separator */}
              <div className="border-t-2 border-black  my-2" />

              <ScrollArea className="h-56 mb-3">
                <div className="space-y-1">
                  {filteredDrivers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
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
                          className={`flex items-center justify-between gap-2 px-2 py-1 rounded cursor-pointer ${isSelected ? "bg-muted/10" : "hover:bg-muted/5"}`}
                        >
                          <div className="flex items-center gap-2">
                            {/* <Checkbox
                              id={`m-driver-${option.id}`}
                              checked={isSelected}
                              onCheckedChange={() =>
                                toggleDriverGroup(option.raws)
                              }
                            /> */}
                            <span className="text-sm truncate uppercase tracking-wider">
                              {option.label}
                            </span>
                          </div>
                          <div className="flex items-center">
                            {isSelected ? (
                              <Check className="h-4 w-4 text-emerald-600" />
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={localStart ?? ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLocalStart(e.target.value)
                    }
                    className="h-8 w-full"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={localEnd ?? ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLocalEnd(e.target.value)
                    }
                    className="h-8 w-full"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Button
                    variant="default"
                    onClick={applyDateRange}
                    disabled={loading}
                  >
                    {loading ? (
                      <Spinner className="h-4 w-4 mr-2" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 mr-2" />
                    )}{" "}
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
        {selectedDrivers.length > 0 && (
          <div className="w-full mt-2 flex items-center gap-2 flex-wrap">
            {selectedDrivers.map((s) => (
              <Badge key={s.id} className="flex items-center gap-2">
                <span className="max-w-40 md:max-w-48 truncate">{s.label}</span>
                <button
                  onClick={() => toggleDriverGroup(s.raws)}
                  aria-label={`Remove ${s.label}`}
                  className="ml-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
