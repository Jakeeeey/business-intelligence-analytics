import {UnfulfilledOrder} from "../types";

export const getUnfulfilledOrders = async (
    startDate: string,
    endDate: string
): Promise<UnfulfilledOrder[]> => {
    const timestamp = new Date().getTime();
    // Using the /api/bia/ pattern to safely bypass the Next.js proxy
    const url = `/api/bia/scm/logistics-performance/unfulfilled-orders?startDate=${startDate}&endDate=${endDate}&_t=${timestamp}`;

    try {
        const res = await fetch(url, {cache: "no-store"});
        if (!res.ok) throw new Error(`API Failed: ${res.status}`);

        const rawData = await res.json();

        // Ensure we are returning the array directly
        if (Array.isArray(rawData)) {
            return rawData;
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch unfulfilled orders:", error);
        return [];
    }
};