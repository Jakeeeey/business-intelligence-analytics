"use client";

import React from "react";
import { Search, RotateCcw, Download, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CustomerFilters as FilterType } from "../types";

interface CustomerFiltersProps {
    filters: FilterType;
    onChange: (filters: FilterType) => void;
    onReset: () => void;
    onReload: () => void;
    onExport: () => void;
    loading: boolean;
    filterOptions: {
        divisions: string[];
        suppliers: string[];
        salesmen: string[];
        storeTypes: string[];
    };
}

export const CustomerFilters: React.FC<CustomerFiltersProps> = ({
    filters,
    onChange,
    onReset,
    onReload,
    onExport,
    loading,
    filterOptions,
}) => {
    return (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm text-card-foreground transition-colors">
            <div className="flex flex-col gap-4">
                {/* Row 1: Dates & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                From
                            </span>
                            <Input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) =>
                                    onChange({ ...filters, startDate: e.target.value })
                                }
                                className="h-9 w-36 bg-background text-foreground border-input"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                To
                            </span>
                            <Input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) =>
                                    onChange({ ...filters, endDate: e.target.value })
                                }
                                className="h-9 w-36 bg-background text-foreground border-input"
                            />
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onReload}
                            disabled={loading}
                            className="h-9 gap-1.5"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onReset}
                            disabled={loading}
                            className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Reset</span>
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onExport}
                            disabled={loading}
                            className="h-9 gap-1.5 border-border bg-background hover:bg-muted font-medium"
                        >
                            <Download className="h-4 w-4" />
                            <span>Export CSV</span>
                        </Button>
                    </div>
                </div>

                {/* Row 2: Search & Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Search Customer */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search customer, code, area..."
                            value={filters.search}
                            onChange={(e) =>
                                onChange({ ...filters, search: e.target.value })
                            }
                            className="h-9 pl-9 bg-background text-foreground border-input placeholder:text-muted-foreground"
                        />
                    </div>

                    {/* Division */}
                    <Select
                        value={filters.division}
                        onValueChange={(val) => onChange({ ...filters, division: val })}
                    >
                        <SelectTrigger className="h-9 w-full bg-background border-input text-foreground">
                            <SelectValue placeholder="All Divisions" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 bg-popover text-popover-foreground border-border">
                            <SelectItem value="ALL">All Divisions</SelectItem>
                            {filterOptions.divisions.map((div) => (
                                <SelectItem key={div} value={div}>
                                    {div}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Supplier */}
                    <Select
                        value={filters.supplier}
                        onValueChange={(val) => onChange({ ...filters, supplier: val })}
                    >
                        <SelectTrigger className="h-9 w-full bg-background border-input text-foreground">
                            <SelectValue placeholder="All Suppliers" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 bg-popover text-popover-foreground border-border">
                            <SelectItem value="ALL">All Suppliers</SelectItem>
                            {filterOptions.suppliers.map((sup) => (
                                <SelectItem key={sup} value={sup}>
                                    {sup}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Salesman */}
                    <Select
                        value={filters.salesman}
                        onValueChange={(val) => onChange({ ...filters, salesman: val })}
                    >
                        <SelectTrigger className="h-9 w-full bg-background border-input text-foreground">
                            <SelectValue placeholder="All Salesmen" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 bg-popover text-popover-foreground border-border">
                            <SelectItem value="ALL">All Salesmen</SelectItem>
                            {filterOptions.salesmen.map((sm) => (
                                <SelectItem key={sm} value={sm}>
                                    {sm}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Store Type */}
                    <Select
                        value={filters.storeType}
                        onValueChange={(val) => onChange({ ...filters, storeType: val })}
                    >
                        <SelectTrigger className="h-9 w-full bg-background border-input text-foreground">
                            <SelectValue placeholder="All Store Types" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 bg-popover text-popover-foreground border-border">
                            <SelectItem value="ALL">All Store Types</SelectItem>
                            {filterOptions.storeTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
};
