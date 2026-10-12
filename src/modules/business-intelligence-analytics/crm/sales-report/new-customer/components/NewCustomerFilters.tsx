"use client";

import React from "react";
import {
    Search,
    RotateCcw,
    Download,
    RefreshCw,
    SlidersHorizontal,
    X,
    Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { NewCustomerFilters as FilterType, DatePreset } from "../types";

interface NewCustomerFiltersProps {
    filters: FilterType;
    onChange: (filters: FilterType) => void;
    onPresetChange: (preset: DatePreset) => void;
    onReset: () => void;
    onReload: () => void;
    onExport: () => void;
    loading: boolean;
    filterOptions: {
        provinces: string[];
        cities: string[];
        storeTypes: string[];
        customerTypes: string[];
    };
    totalFilteredCount: number;
}

const PRESETS: { id: DatePreset; label: string }[] = [
    { id: "this-month", label: "This Month" },
    { id: "last-30-days", label: "Last 30 Days" },
    { id: "this-quarter", label: "This Quarter" },
    { id: "this-year", label: "This Year" },
    { id: "all-time", label: "All Time" },
    { id: "custom", label: "Custom" },
];

export const NewCustomerFilters: React.FC<NewCustomerFiltersProps> = ({
    filters,
    onChange,
    onPresetChange,
    onReset,
    onReload,
    onExport,
    loading,
    filterOptions,
    totalFilteredCount,
}) => {
    // Check if any non-default filter is applied
    const hasActiveFilters =
        filters.search ||
        filters.province !== "ALL" ||
        filters.city !== "ALL" ||
        filters.storeType !== "ALL" ||
        filters.status !== "ALL" ||
        filters.preset !== "this-month";

    return (
        <div className="rounded-2xl border border-border/70 bg-card/80 p-4 sm:p-5 shadow-sm text-card-foreground backdrop-blur-sm transition-all space-y-4">
            {/* Top Bar: Date Preset Pills & Action Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/50">
                <div className="flex flex-wrap items-center gap-1.5 bg-muted/50 p-1 rounded-xl border border-border/40">
                    <div className="flex items-center px-2 py-1 text-muted-foreground text-xs font-semibold gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Period:</span>
                    </div>
                    {PRESETS.map((p) => {
                        const active = filters.preset === p.id;
                        return (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => onPresetChange(p.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    active
                                        ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                            >
                                {p.label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onReload}
                        disabled={loading}
                        className="h-8 gap-1.5 text-xs border-border bg-background hover:bg-muted"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onExport}
                        disabled={loading || totalFilteredCount === 0}
                        className="h-8 gap-1.5 text-xs font-semibold border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                    >
                        <Download className="h-3.5 w-3.5" />
                        <span>Export CSV</span>
                    </Button>
                </div>
            </div>

            {/* Custom Date Pickers (if Custom preset active) */}
            {filters.preset === "custom" && (
                <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 animate-in fade-in slide-in-from-top-1 duration-200">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                        Custom Date Range:
                    </span>
                    <div className="flex items-center gap-2">
                        <Input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) =>
                                onChange({ ...filters, startDate: e.target.value })
                            }
                            className="h-8 w-36 bg-background text-foreground border-input text-xs"
                        />
                        <span className="text-xs text-muted-foreground">to</span>
                        <Input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) =>
                                onChange({ ...filters, endDate: e.target.value })
                            }
                            className="h-8 w-36 bg-background text-foreground border-input text-xs"
                        />
                    </div>
                </div>
            )}

            {/* Main Filter Controls: Search & Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Search Customer or Store */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search store, owner, code..."
                        value={filters.search}
                        onChange={(e) => onChange({ ...filters, search: e.target.value })}
                        className="h-9 pl-9 pr-7 bg-background text-foreground border-input placeholder:text-muted-foreground text-xs"
                    />
                    {filters.search && (
                        <button
                            type="button"
                            onClick={() => onChange({ ...filters, search: "" })}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Province Filter */}
                <Select
                    value={filters.province}
                    onValueChange={(val) => onChange({ ...filters, province: val, city: "ALL" })}
                >
                    <SelectTrigger className="h-9 w-full bg-background border-input text-foreground text-xs">
                        <SelectValue placeholder="All Provinces" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 bg-popover text-popover-foreground border-border text-xs">
                        <SelectItem value="ALL">All Provinces ({filterOptions.provinces.length})</SelectItem>
                        {filterOptions.provinces.map((p) => (
                            <SelectItem key={p} value={p}>
                                {p}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* City Filter */}
                <Select
                    value={filters.city}
                    onValueChange={(val) => onChange({ ...filters, city: val })}
                >
                    <SelectTrigger className="h-9 w-full bg-background border-input text-foreground text-xs">
                        <SelectValue placeholder="All Cities" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 bg-popover text-popover-foreground border-border text-xs">
                        <SelectItem value="ALL">All Cities ({filterOptions.cities.length})</SelectItem>
                        {filterOptions.cities.map((c) => (
                            <SelectItem key={c} value={c}>
                                {c}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Store Type */}
                <Select
                    value={filters.storeType}
                    onValueChange={(val) => onChange({ ...filters, storeType: val })}
                >
                    <SelectTrigger className="h-9 w-full bg-background border-input text-foreground text-xs">
                        <SelectValue placeholder="All Store Types" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 bg-popover text-popover-foreground border-border text-xs">
                        <SelectItem value="ALL">All Store Types ({filterOptions.storeTypes.length})</SelectItem>
                        {filterOptions.storeTypes.map((st) => (
                            <SelectItem key={st} value={st}>
                                {st}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select
                    value={filters.status}
                    onValueChange={(val) =>
                        onChange({ ...filters, status: val as "ALL" | "ACTIVE" | "INACTIVE" })
                    }
                >
                    <SelectTrigger className="h-9 w-full bg-background border-input text-foreground text-xs">
                        <SelectValue placeholder="Account Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground border-border text-xs">
                        <SelectItem value="ALL">All Status</SelectItem>
                        <SelectItem value="ACTIVE">Active Accounts Only</SelectItem>
                        <SelectItem value="INACTIVE">Inactive Accounts Only</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Active Filters Bar */}
            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                        <SlidersHorizontal className="h-3 w-3" /> Filters:
                    </span>

                    {filters.province !== "ALL" && (
                        <Badge variant="secondary" className="gap-1 text-xs py-0.5 px-2 font-medium">
                            Province: {filters.province}
                            <X
                                className="h-3 w-3 cursor-pointer hover:text-foreground"
                                onClick={() => onChange({ ...filters, province: "ALL" })}
                            />
                        </Badge>
                    )}

                    {filters.city !== "ALL" && (
                        <Badge variant="secondary" className="gap-1 text-xs py-0.5 px-2 font-medium">
                            City: {filters.city}
                            <X
                                className="h-3 w-3 cursor-pointer hover:text-foreground"
                                onClick={() => onChange({ ...filters, city: "ALL" })}
                            />
                        </Badge>
                    )}

                    {filters.storeType !== "ALL" && (
                        <Badge variant="secondary" className="gap-1 text-xs py-0.5 px-2 font-medium">
                            Type: {filters.storeType}
                            <X
                                className="h-3 w-3 cursor-pointer hover:text-foreground"
                                onClick={() => onChange({ ...filters, storeType: "ALL" })}
                            />
                        </Badge>
                    )}

                    {filters.status !== "ALL" && (
                        <Badge variant="secondary" className="gap-1 text-xs py-0.5 px-2 font-medium">
                            Status: {filters.status}
                            <X
                                className="h-3 w-3 cursor-pointer hover:text-foreground"
                                onClick={() => onChange({ ...filters, status: "ALL" })}
                            />
                        </Badge>
                    )}

                    {filters.search && (
                        <Badge variant="secondary" className="gap-1 text-xs py-0.5 px-2 font-medium">
                            Search: &quot;{filters.search}&quot;
                            <X
                                className="h-3 w-3 cursor-pointer hover:text-foreground"
                                onClick={() => onChange({ ...filters, search: "" })}
                            />
                        </Badge>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onReset}
                        className="h-6 px-2 text-[11px] text-muted-foreground hover:text-destructive gap-1"
                    >
                        <RotateCcw className="h-2.5 w-2.5" />
                        Clear All
                    </Button>
                </div>
            )}
        </div>
    );
};
