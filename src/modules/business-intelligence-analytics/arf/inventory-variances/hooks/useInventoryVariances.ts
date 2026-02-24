// src/modules/business-intelligence-analytics/arf/inventory-variances/hooks/useInventoryVariances.ts
import { useState, useEffect } from "react";
import { InventoryVarianceResponseDto } from "../types";
import { fetchInventoryVariances } from "../providers/fetchProvider";

export const useInventoryVariances = (startDate?: string, endDate?: string) => {
    const [data, setData] = useState<InventoryVarianceResponseDto | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const result = await fetchInventoryVariances(startDate, endDate);
                setData(result);
                setError(null);
            } catch (err: any) {
                setError(err.message || "An error occurred");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [startDate, endDate]); // 👈 CRITICAL: Re-runs fetch when these change

    return { data, loading, error };
};