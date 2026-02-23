// src/modules/business-intelligence-analytics/arf/inventory-variances/providers/fetchProvider.ts
import { InventoryVarianceResponseDto } from "../types";

export const fetchInventoryVariances = async (
    startDate?: string,
    endDate?: string
): Promise<InventoryVarianceResponseDto> => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`/api/bia/arf/variance-analysis/inventory-variances${queryString}`);

    if (!res.ok) {
        // Handle 500 or 404 errors gracefully
        const errorText = await res.text();
        throw new Error(errorText || `Server Error: ${res.status}`);
    }

    const rawData = await res.text();
    if (!rawData) throw new Error("Server returned an empty response.");

    return JSON.parse(rawData);
};