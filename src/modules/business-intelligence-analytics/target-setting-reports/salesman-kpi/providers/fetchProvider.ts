import { VSalesPerformanceDataDto } from "../../executive-health/types";

/**
 * Fetches raw sales data for salesman performance analysis.
 * Reuses the managerial data endpoint as it contains the necessary 
 * salesmanName and netAmount fields.
 */
export const fetchSalesmanData = async (startDate: string, endDate: string): Promise<VSalesPerformanceDataDto[]> => {
    try {
        const params = new URLSearchParams({
            startDate,
            endDate,
            _t: new Date().getTime().toString() // Cache Buster to force fresh data
        });

        const url = `/api/bia/target-setting-reports/managerial-supplier?${params.toString()}`;

        console.log(`[Salesman Fetch] Requesting: ${startDate} to ${endDate}`);

        // Set a 15-second timeout to prevent hanging on 502/504 errors
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.status === 401) {
            console.error("Unauthorized: Session may have expired.");
            return [];
        }

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Return empty array if data is null or undefined to prevent UI crashes
        return Array.isArray(data) ? data : [];

    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.error("Salesman Fetch: The request timed out.");
        } else {
            console.error("Salesman Fetch Error:", error.message);
        }
        throw error;
    }
};

/**
 * Fetches dynamic targets for salesman data.
 */
export const fetchDynamicTargets = async (startDate: string, endDate: string): Promise<any> => {
    try {
        const params = new URLSearchParams({ startDate, endDate });
        const url = `/api/bia/target-setting-reports/managerial-supplier/targets?${params.toString()}`;

        const response = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error(`API Request failed with status ${response.status}`);
        }

        return await response.json();
    } catch (error: any) {
        console.error("Fetch Salesman Targets Error:", error.message);
        return { supplierTargets: [], salesmanTargets: [] };
    }
};