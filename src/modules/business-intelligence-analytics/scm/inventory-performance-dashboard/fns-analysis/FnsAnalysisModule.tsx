// src/modules/.../fns-analysis/FnsAnalysisModule.tsx
"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { useScmFilters } from "@/modules/business-intelligence-analytics/scm/providers/ScmFilterProvider";
import { ScmAdvancedFilters } from "@/modules/business-intelligence-analytics/scm/components/filters/ScmAdvancedFilters";
import { useFnsAnalysis } from "./hooks/useFnsAnalysis";
import { FnsDistributionTab } from "./components/FnsDistributionTab";
import { FnsDataTable } from "./components/FnsDataTable";
import type { FnsEnrichedRow } from "./types";

/**
 * Main orchestrator for the FNS Analysis module.
 * Uses the shared ScmAdvancedFilters component for date range and supplier.
 * Renders 4 tabs: Distribution, Fast, Normal, Slow.
 */
export default function FnsAnalysisModule() {
    const { selectedSupplier, selectedBranch } = useScmFilters();

    const { data, summary, isLoading, error, refresh } = useFnsAnalysis();

    // ── Derive supplier list from the fetched data ──────────────────
    const suppliers = React.useMemo(() => {
        const set = new Set(data.map((d) => d.supplierName).filter(Boolean));
        set.delete("—");
        return Array.from(set).sort();
    }, [data]);

    // ── Derive branch list from the fetched data ────────────────────
    const branches = React.useMemo(() => {
        const set = new Set(data.map((d) => d.branchName || "Unknown"));
        return Array.from(set).filter((b) => b !== "Unknown" && b !== "—").sort();
    }, [data]);

    // ── Client-side filtering (supplier + branch) ───────────────────
    const filtered = React.useMemo(() => {
        let result = data;
        if (selectedSupplier !== "all") {
            result = result.filter((d) => d.supplierName === selectedSupplier);
        }
        if (selectedBranch !== "all") {
            result = result.filter((d) => d.branchName === selectedBranch);
        }
        return result;
    }, [data, selectedSupplier, selectedBranch]);

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

    // ── Dynamic summary derived from filtered data ──────────────────
    const filteredSummary = React.useMemo(() => ({
        fastCount: fastRows.length,
        normalCount: normalRows.length,
        slowCount: slowRows.length,
        totalCount: filtered.length,
        fastThreshold: summary.fastThreshold,
        normalThreshold: summary.normalThreshold,
    }), [fastRows, normalRows, slowRows, filtered, summary]);

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
            {/* ── Page Header + Shared Filter Bar ─────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        FNS Analysis
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Visualize warehouse stock movement speed to optimize storage and capital turnover
                    </p>
                </div>

                <div className="bg-card border rounded-xl p-2 shadow-sm">
                    <ScmAdvancedFilters
                        suppliers={suppliers}
                        branches={branches}
                        showBranch={true}
                    />
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
                                FNS classification breakdown across {filteredSummary.totalCount} SKUs
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FnsDistributionTab summary={filteredSummary} />
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
