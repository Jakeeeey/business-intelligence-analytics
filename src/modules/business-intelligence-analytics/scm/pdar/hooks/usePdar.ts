"use client";

import { useState, useEffect, useMemo } from "react";
import { fetchPdarData } from "../services/pdar.service";
import { PdarRecord } from "../types/pdar.schema";

export function usePdar() {
    const [data, setData] = useState<PdarRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const result = await fetchPdarData({ status: "Posted" });
                setData(result);
            } catch (err) {
                console.error("Failed to fetch PDAR data:", err);
                const message = err instanceof Error ? err.message : "Failed to load data. Please check your connection.";
                setError(message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // The user requested to only display dispatch plan details with Status "Posted"
    const postedData = useMemo(() => {
        return data.filter((item) => item.Status === "Posted");
    }, [data]);

    return {
        data: postedData,
        rawRecords: data,
        isLoading,
        error,
    };
}
