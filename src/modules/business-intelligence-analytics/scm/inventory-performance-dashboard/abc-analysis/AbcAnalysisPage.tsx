"use client";

import React from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription } from "@/components/ui/card";

import { ScmAdvancedFilters } from "./components/ScmAdvancedFilters";
import { useAbcAnalysis } from "./hooks/useAbcAnalysis";
import { AbcSummaryCards } from "./components/AbcSummaryCards";
import { AbcCharts } from "./components/AbcCharts";
import { AbcDataTable } from "./components/AbcDataTable";
import { AbcAnalysisSkeleton } from "./components/AbcAnalysisSkeleton";
import { ErrorPage } from "./components/ErrorPage";

export default function AbcAnalysisPage() {
    const {
        data,
        isLoading,
        error,
        suppliers,
        branches,
        stats
    } = useAbcAnalysis();

    if (isLoading) {
        return <AbcAnalysisSkeleton />;
    }

    if (error) {
        return (
            <ErrorPage
                title="Data Fetch Error"
                message={error}
                code="502"
                onRefresh={() => window.location.reload()}
            />
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-8 pt-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">ABC Analysis</h2>
                    <CardDescription className="mt-1">
                        Product classification based on inventory output value and volume
                    </CardDescription>
                </div>

                <div className="bg-card border rounded-xl p-2 shadow-sm">
                    <ScmAdvancedFilters
                        suppliers={suppliers}
                        branches={branches}
                        showBranch={true}
                    />
                </div>
            </div>

            <AbcSummaryCards stats={stats} />

            <AbcCharts stats={stats} data={data} />

            <AbcDataTable data={data} isLoading={isLoading} />
        </div>
    );
}
