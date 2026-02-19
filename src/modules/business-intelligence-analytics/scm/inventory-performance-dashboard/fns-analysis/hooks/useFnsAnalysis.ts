// src/modules/business-intelligence-analytics/scm/inventory-performance-dashboard/fns-analysis/hooks/useFnsAnalysis.ts
"use client";

import * as React from "react";
import { toast } from "sonner";

import type { FnsEnrichedRow, FnsSummary } from "../types";
import { getFnsAnalysisData } from "../providers/fetchProvider";

/**
 * Hook that manages FNS analysis state: data fetching, loading, errors.
 * Returns the standard `{ data, summary, isLoading, error, refresh }` shape.
 */
export function useFnsAnalysis() {
    const [data, setData] = React.useState<FnsEnrichedRow[]>([]);
    const [summary, setSummary] = React.useState<FnsSummary>({
        fastCount: 0,
        normalCount: 0,
        slowCount: 0,
        totalCount: 0,
        fastThreshold: 15,
        normalThreshold: 5,
    });
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const refresh = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await getFnsAnalysisData();
            setData(result.data ?? []);
            setSummary(
                result.summary ?? {
                    fastCount: 0,
                    normalCount: 0,
                    slowCount: 0,
                    totalCount: 0,
                    fastThreshold: 15,
                    normalThreshold: 5,
                },
            );
        } catch (e: any) {
            const msg = e?.message || "Failed to load FNS analysis data.";
            setError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch data on mount
    React.useEffect(() => {
        refresh();
    }, [refresh]);

    return { data, summary, isLoading, error, refresh };
}
