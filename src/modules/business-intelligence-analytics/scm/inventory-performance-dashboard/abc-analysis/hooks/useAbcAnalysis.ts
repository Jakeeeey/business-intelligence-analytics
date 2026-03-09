"use client";

import { useMemo, useState, useEffect } from "react";
import { format } from "date-fns";
import { useScmFilters } from "@/modules/business-intelligence-analytics/scm/providers/ScmFilterProvider";
import { fetchAbcAnalysisData } from "../services/abc-analysis";
import { AbcProduct } from "../types/abc-analysis.schema";

export function useAbcAnalysis() {
    const {
        dateRange,
        selectedSupplier,
        selectedBranch,
    } = useScmFilters();

    const [data, setData] = useState<AbcProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const params: Record<string, string> = {};
                if (dateRange?.from) params.from = format(dateRange.from, "yyyy-MM-dd");
                if (dateRange?.to) params.to = format(dateRange.to, "yyyy-MM-dd");

                const result = await fetchAbcAnalysisData(params);
                setData(result);
            } catch (err: any) {
                console.error("Failed to fetch ABC Analysis data:", err);
                setError(err.message || "Failed to load data. Please check your connection.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [dateRange]);

    const suppliers = useMemo(() => {
        const set = new Set(data.map((d) => d.supplierName));
        return Array.from(set).sort();
    }, [data]);

    const branches = useMemo(() => {
        const set = new Set(data.map((d) => d.branchName || "Unknown"));
        return Array.from(set).filter(b => b !== "Unknown").sort();
    }, [data]);

    const enrichedData = useMemo(() => {
        let filtered = data;

        // Filter by supplier
        if (selectedSupplier !== "all") {
            filtered = filtered.filter((item) => item.supplierName === selectedSupplier);
        }

        // Filter by branch
        if (selectedBranch !== "all") {
            filtered = filtered.filter((item) => item.branchName === selectedBranch);
        }

        // Sort by value descending
        const sorted = [...filtered].sort((a, b) => b.outValue - a.outValue);
        const totalValue = sorted.reduce((sum, item) => sum + item.outValue, 0);

        let cumulativeValue = 0;
        return sorted.map((item, i) => {
            cumulativeValue += item.outValue;
            const cumulativePct = totalValue > 0 ? (cumulativeValue / totalValue) * 100 : 0;

            let abcClass: "A" | "B" | "C" = "C";
            if (cumulativePct <= 70) abcClass = "A";
            else if (cumulativePct <= 90) abcClass = "B";

            return {
                ...item,
                abcClass,
                classRank: i + 1,
                cumulativePct
            };
        });
    }, [data, selectedSupplier, selectedBranch]);

    const stats = useMemo(() => {
        const totalItems = enrichedData.length;
        const totalValue = enrichedData.reduce((sum, item) => sum + item.outValue, 0);
        const totalVolume = enrichedData.reduce((sum, item) => sum + item.outQtyBase, 0);

        const categories = {
            A: enrichedData.filter(d => (d as any).abcClass === "A"),
            B: enrichedData.filter(d => (d as any).abcClass === "B"),
            C: enrichedData.filter(d => (d as any).abcClass === "C"),
        };

        return {
            totalItems,
            totalValue,
            totalVolume,
            catA: { count: categories.A.length, value: categories.A.reduce((s, i) => s + i.outValue, 0) },
            catB: { count: categories.B.length, value: categories.B.reduce((s, i) => s + i.outValue, 0) },
            catC: { count: categories.C.length, value: categories.C.reduce((s, i) => s + i.outValue, 0) },
        };
    }, [enrichedData]);

    return {
        data: enrichedData,
        rawRecords: data,
        isLoading,
        error,
        suppliers,
        branches,
        stats,
    };
}
