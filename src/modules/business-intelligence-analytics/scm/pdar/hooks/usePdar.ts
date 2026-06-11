"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { fetchPdarData } from "../services/pdar.service";
import { PdarRecord } from "../types/pdar.schema";

export interface PdarFilters {
    docNo: string;
    category: string;
    storeName: string;
}

export function usePdar() {
    const [rawRecords, setRawRecords] = useState<PdarRecord[]>([]);
    const [displayedData, setDisplayedData] = useState<PdarRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState<PdarFilters>({
        docNo: "all",
        category: "all",
        storeName: "all"
    });

    // Fetch all data on mount to populate the table and dropdown options
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                // Passing empty strings fetches all posted records
                const result = await fetchPdarData({ 
                    status: "Posted",
                    docNo: "",
                    category: "",
                    storeName: ""
                });
                setRawRecords(result);
                setDisplayedData(result);
            } catch (err) {
                console.error("Failed to fetch PDAR data:", err);
                const message = err instanceof Error ? err.message : "Failed to load data.";
                setError(message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllData();
    }, []);

    // Derive unique options for dropdowns
    const dropdownOptions = useMemo(() => {
        const docNos = Array.from(new Set(rawRecords.map(r => r.DP_Number).filter((x): x is string => Boolean(x)))).sort();
        const categories = Array.from(new Set(rawRecords.map(r => r.Category).filter((x): x is string => Boolean(x)))).sort();
        const storeNames = Array.from(new Set(rawRecords.map(r => r.StoreName).filter((x): x is string => Boolean(x)))).sort();
        return { docNos, categories, storeNames };
    }, [rawRecords]);

    const handleFilterChange = useCallback((key: keyof PdarFilters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleSearch = useCallback(() => {
        let filtered = [...rawRecords];

        if (filters.docNo !== "all") {
            filtered = filtered.filter(r => r.DP_Number === filters.docNo);
        }
        if (filters.category !== "all") {
            filtered = filtered.filter(r => r.Category === filters.category);
        }
        if (filters.storeName !== "all") {
            filtered = filtered.filter(r => r.StoreName === filters.storeName);
        }

        setDisplayedData(filtered);
    }, [rawRecords, filters]);

    return {
        data: displayedData,
        dropdownOptions,
        isLoading,
        error,
        filters,
        handleFilterChange,
        handleSearch
    };
}

