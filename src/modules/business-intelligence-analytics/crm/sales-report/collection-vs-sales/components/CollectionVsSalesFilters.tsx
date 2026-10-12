"use client";

import React from "react";
import {
    Calendar,
    RefreshCw,
    Download,
    FilterX,
    User,
    CreditCard,
    Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    CollectionVsSalesFiltersState,
    CollectionVsSalesLookups,
    DatePreset,
} from "../types";

interface CollectionVsSalesFiltersProps {
    filters: CollectionVsSalesFiltersState;
    onChange: React.Dispatch<React.SetStateAction<CollectionVsSalesFiltersState>>;
    datePreset: DatePreset;
    onPresetChange: (preset: DatePreset) => void;
    onReset: () => void;
    onReload: () => void;
    onExport: () => void;
    loading: boolean;
    lookups: CollectionVsSalesLookups;
}

const PRESETS: Array<{ label: string; value: DatePreset }> = [
    { label: "This Month", value: "this-month" },
    { label: "Last Month", value: "last-month" },
    { label: "Last 30 Days", value: "last-30-days" },
    { label: "Year to Date", value: "ytd" },
    { label: "All Time", value: "all" },
];

export const CollectionVsSalesFilters: React.FC<CollectionVsSalesFiltersProps> = ({
    filters,
    onChange,
    datePreset,
    onPresetChange,
    onReset,
    onReload,
    onExport,
    loading,
    lookups,
}) => {
    return (
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm space-y-3.5 text-card-foreground">
            {/* Row 1: Quick Presets Bar & Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-muted-foreground mr-1">Period:</span>
                    {PRESETS.map((p) => {
                        const active = datePreset === p.value;
                        return (
                            <Button
                                key={p.value}
                                type="button"
                                variant={active ? "default" : "outline"}
                                size="sm"
                                onClick={() => onPresetChange(p.value)}
                                className={`h-7 px-2.5 text-xs rounded-lg transition-all ${
                                    active
                                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                        : "bg-background text-muted-foreground hover:text-foreground border-border/60"
                                }`}
                            >
                                {p.label}
                            </Button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onReset}
                        className="h-8 text-xs gap-1.5 border-border/60"
                        title="Reset Filters"
                    >
                        <FilterX className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Reset</span>
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onReload}
                        disabled={loading}
                        className="h-8 text-xs gap-1.5 border-border/60"
                        title="Reload Data"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </Button>

                    <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={onExport}
                        className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                    >
                        <Download className="h-3.5 w-3.5" />
                        <span>Export CSV</span>
                    </Button>
                </div>
            </div>

            {/* Row 2: Detailed Inputs & Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Start Date */}
                <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Start Date
                    </label>
                    <Input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) =>
                            onChange((prev) => ({
                                ...prev,
                                startDate: e.target.value,
                            }))
                        }
                        className="h-9 text-xs bg-background border-input"
                    />
                </div>

                {/* End Date */}
                <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> End Date
                    </label>
                    <Input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) =>
                            onChange((prev) => ({
                                ...prev,
                                endDate: e.target.value,
                            }))
                        }
                        className="h-9 text-xs bg-background border-input"
                    />
                </div>

                {/* Salesman Filter */}
                <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" /> Sales Representative
                    </label>
                    <Select
                        value={filters.salesmanId}
                        onValueChange={(val) => onChange((prev) => ({ ...prev, salesmanId: val }))}
                    >
                        <SelectTrigger className="h-9 text-xs bg-background border-input">
                            <SelectValue placeholder="All Salesmen" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover text-popover-foreground border-border max-h-60">
                            <SelectItem value="ALL">All Sales Representatives</SelectItem>
                            {lookups.salesmen.map((sm) => (
                                <SelectItem key={sm.id} value={String(sm.id)}>
                                    {sm.name} {sm.code ? `(${sm.code})` : ""}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Payment Method Filter */}
                <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                        <CreditCard className="h-3 w-3" /> Payment Method
                    </label>
                    <Select
                        value={filters.paymentMethod}
                        onValueChange={(val) => onChange((prev) => ({ ...prev, paymentMethod: val }))}
                    >
                        <SelectTrigger className="h-9 text-xs bg-background border-input">
                            <SelectValue placeholder="All Methods" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover text-popover-foreground border-border">
                            <SelectItem value="ALL">All Payment Methods</SelectItem>
                            {lookups.paymentMethods.map((pm) => (
                                <SelectItem key={pm.id} value={pm.name}>
                                    {pm.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Search query */}
                <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                        <Search className="h-3 w-3" /> Search Receipts
                    </label>
                    <Input
                        type="text"
                        placeholder="Receipt #, doc, remarks..."
                        value={filters.searchQuery}
                        onChange={(e) => onChange((prev) => ({ ...prev, searchQuery: e.target.value }))}
                        className="h-9 text-xs bg-background border-input"
                    />
                </div>
            </div>
        </div>
    );
};
