// src/modules/.../fns-analysis/FnsAnalysisModule.tsx
"use client";

import * as React from "react";
import { RefreshCw, Calendar, Filter } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { useScmFilters } from "@/modules/business-intelligence-analytics/scm/providers/ScmFilterProvider";
import { useFnsAnalysis } from "./hooks/useFnsAnalysis";
import { FnsDistributionTab } from "./components/FnsDistributionTab";
import { FnsDataTable } from "./components/FnsDataTable";
import type { FnsEnrichedRow } from "./types";

/**
 * Main orchestrator for the FNS Analysis module.
 * Integrates with the shared SCM filter context for date range and supplier.
 * Renders 4 tabs: Distribution, Fast, Normal, Slow.
 */
export default function FnsAnalysisModule() {
    const {
        fromMonth,
        setFromMonth,
        toMonth,
        setToMonth,
        selectedSupplier,
        setSelectedSupplier,
    } = useScmFilters();

    const { data, summary, isLoading, error, refresh } = useFnsAnalysis();

    // ── Derive supplier list from the fetched data ──────────────────
    const suppliers = React.useMemo(() => {
        const set = new Set(data.map((d) => d.supplierName).filter(Boolean));
        set.delete("—");
        return Array.from(set).sort();
    }, [data]);

    // ── Client-side filtering (supplier only; date/branch are server-side) ──
    const filtered = React.useMemo(() => {
        if (selectedSupplier === "all") return data;
        return data.filter((d) => d.supplierName === selectedSupplier);
    }, [data, selectedSupplier]);

    // ── Category splits for tab views ──────────────────────────────
    const fastRows = React.useMemo(
        () => filtered.filter((d) => d.fnsClass === "F"),
        [filtered],
    );
    const normalRows = React.useMemo(
        () => filtered.filter((d) => d.fnsClass === "N"),
        [filtered],
    );
    const slowRows = React.useMemo(
        () => filtered.filter((d) => d.fnsClass === "S"),
        [filtered],
    );

    // ── Loading skeleton ───────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="space-y-6 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-10 w-96" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-80 rounded-xl" />
                    <div className="flex flex-col gap-4">
                        <Skeleton className="h-24 rounded-xl" />
                        <Skeleton className="h-24 rounded-xl" />
                        <Skeleton className="h-24 rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    // ── Visible error state ──────────────────────────────────────────
    if (error) {
        return (
            <div className="space-y-6 p-4 md:p-8 pt-6">
                <h2 className="text-3xl font-bold tracking-tight">FNS Analysis</h2>
                <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-6">
                    <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
                        Failed to load FNS data
                    </h3>
                    <p className="text-sm text-red-600 dark:text-red-300 mb-4">{error}</p>
                    <Button variant="outline" size="sm" onClick={refresh}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-8 pt-6">
            {/* ── Page Header + Filter Bar ─────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        FNS Analysis
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Visualize warehouse stock movement speed to optimize storage and capital turnover
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-card border rounded-xl p-2 shadow-sm">
                    {/* Date Range */}
                    <div className="flex items-center gap-2 px-2 border-r">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <Input
                            type="month"
                            value={fromMonth}
                            onChange={(e) => setFromMonth(e.target.value)}
                            className="w-32 border-none h-8 text-sm focus-visible:ring-0"
                        />
                        <span className="text-muted-foreground text-xs">-</span>
                        <Input
                            type="month"
                            value={toMonth}
                            onChange={(e) => setToMonth(e.target.value)}
                            className="w-32 border-none h-8 text-sm focus-visible:ring-0"
                        />
                    </div>

                    {/* Supplier */}
                    <div className="flex items-center gap-2 px-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select
                            value={selectedSupplier}
                            onValueChange={setSelectedSupplier}
                        >
                            <SelectTrigger className="w-[180px] h-8 border-none shadow-none text-sm font-medium">
                                <SelectValue placeholder="Select Supplier" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Suppliers</SelectItem>
                                {suppliers.map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {s}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Refresh */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={refresh}
                        className="h-8 w-8"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* ── Tabs: Distribution / Fast / Normal / Slow ────────────── */}
            <Tabs defaultValue="distribution" className="space-y-4">
                <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full max-w-2xl">
                    <TabsTrigger value="distribution" className="flex-1">Distribution</TabsTrigger>
                    <TabsTrigger value="fast" className="flex-1">
                        Fast ({fastRows.length})
                    </TabsTrigger>
                    <TabsTrigger value="normal" className="flex-1">
                        Normal ({normalRows.length})
                    </TabsTrigger>
                    <TabsTrigger value="slow" className="flex-1">
                        Slow ({slowRows.length})
                    </TabsTrigger>
                </TabsList>

                {/* Distribution Tab */}
                <TabsContent value="distribution">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Stock Movement Distribution</CardTitle>
                            <CardDescription>
                                FNS classification breakdown across {summary.totalCount} SKUs
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FnsDistributionTab summary={summary} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Fast Tab */}
                <TabsContent value="fast">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-green-700 dark:text-green-400">
                                Fast Movers
                            </CardTitle>
                            <CardDescription>
                                Products with high pick frequency (&gt; {summary.fastThreshold} picks)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FnsDataTable data={fastRows} isLoading={isLoading} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Normal Tab */}
                <TabsContent value="normal">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-blue-700 dark:text-blue-400">
                                Normal Movers
                            </CardTitle>
                            <CardDescription>
                                Products with moderate pick frequency ({summary.normalThreshold}-{summary.fastThreshold} picks)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FnsDataTable data={normalRows} isLoading={isLoading} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Slow Tab */}
                <TabsContent value="slow">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-red-700 dark:text-red-400">
                                Slow Movers
                            </CardTitle>
                            <CardDescription>
                                Products with low pick frequency (&lt; {summary.normalThreshold} picks)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FnsDataTable data={slowRows} isLoading={isLoading} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
