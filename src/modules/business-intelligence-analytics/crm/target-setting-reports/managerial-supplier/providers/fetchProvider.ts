import { VSalesPerformanceDataDto, ProductSalesDetail, AreaTarget } from "../types";

/**
 * Fetches managerial supplier data.
 * @param startDate - Format: YYYY-MM-DD
 * @param endDate - Format: YYYY-MM-DD
 */
export const fetchManagerialData = async (startDate: string, endDate: string): Promise<VSalesPerformanceDataDto[]> => {
    try {
        // 1. Build Query Parameters
        const params = new URLSearchParams({
            startDate,
            endDate,
            _t: new Date().getTime().toString() // Cache Buster
        });

        const url = `/api/bia/crm/target-setting-reports/managerial-supplier?${params.toString()}`;

        console.log(`[Managerial Fetch] Requesting: ${startDate} to ${endDate}`);

        // 2. Perform Fetch with Timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const response = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // 3. Handle specific status codes
        if (response.status === 401) {
            console.error("Session expired. Please log in again.");
            return [];
        }

        if (response.status === 502 || response.status === 504) {
            // This is likely your Spring Boot server failing or timing out
            throw new Error(`Upstream Server Error (502/504). Check if Spring Boot is running on the correct port.`);
        }

        if (!response.ok) {
            throw new Error(`API Request failed with status ${response.status}`);
        }

        const data = await response.json();

        // Safety check to ensure we always return an array
        return Array.isArray(data) ? data : [];

    } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.error("Managerial Fetch: Request timed out.");
        } else {
            console.error("Managerial Fetch Error:", error instanceof Error ? error.message : "Unknown error");
        }
        throw error; // Re-throw so the UI can show an error state if needed
    }
};

/**
 * Fetches dynamic targets for managerial supplier data.
 */
export const fetchDynamicTargets = async (startDate: string, endDate: string, divisionId?: number): Promise<Record<string, unknown>> => {
    try {
        const params = new URLSearchParams({ startDate, endDate });
        if (divisionId) params.append("divisionId", String(divisionId));
        const url = `/api/bia/crm/target-setting-reports/managerial-supplier/targets?${params.toString()}`;

        const response = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error(`API Request failed with status ${response.status}`);
        }

        return await response.json();
    } catch (error: unknown) {
        console.error("Fetch Targets Error:", error instanceof Error ? error.message : "Unknown error");
        return { supplierTargets: [], salesmanTargets: [] };
    }
};

export const fetchCustomerPeaks = async (names: string[] = [], salesmanIds: number[], viewType: 'customer' | 'area' | 'storeType' = 'customer', storeType?: string): Promise<Record<string, { total: number; peak: number; metadata?: Record<string, unknown> }>> => {
    let url = `/api/bia/crm/target-setting-reports/managerial-supplier/customer-peak?ids=${salesmanIds.join(",")}${names.length > 0 ? `&names=${encodeURIComponent(names.join("|"))}` : ""}&viewType=${viewType}`;
    if (storeType) url += `&storeType=${encodeURIComponent(storeType)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return {};
    return await res.json();
};

export const fetchCustomerTargets = async (salesmanIds: number[], startDate: string, endDate: string, viewType: 'customer' | 'area' | 'storeType' = 'customer', names: string[] = []): Promise<Record<string, number>> => {
    try {
        const url = `/api/bia/crm/target-setting-reports/managerial-supplier/customer-targets?salesmanIds=${salesmanIds.join(",")}&startDate=${startDate}&endDate=${endDate}&viewType=${viewType}${names.length > 0 ? `&names=${encodeURIComponent(names.join("|"))}` : ""}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return {};
        
        const data = await res.json();

        if (viewType === "area" && Array.isArray(data)) {
            const result: Record<string, number> = {};
            
            const smartNormalize = (s: string) => (s || "").toLowerCase()
                .replace(/city of /g, "").replace(/ city/g, "")
                .replace(/province of /g, "").replace(/ province/g, "")
                .replace(/\(capital\)/g, "").replace(/\s+/g, "")
                .replace(/[^a-z0-9]/g, "").trim();

            const normalizedInputMap: Record<string, string> = {};
            (names || []).forEach(n => { normalizedInputMap[smartNormalize(n)] = n; });

            data.forEach((item: AreaTarget) => {
                const prov = (item.province || "").trim();
                const city = (item.city || "").trim();
                const dbAreaName = `${prov}, ${city}`.replace(/^, |, $/g, "");
                
                const normalizedDb = smartNormalize(dbAreaName);
                const originalName = normalizedInputMap[normalizedDb] || dbAreaName;
                const amt = Number(item.target_amount || 0);

                const uniqueKeys = new Set([
                    originalName,
                    originalName.toUpperCase(),
                    normalizedDb
                ]);

                uniqueKeys.forEach(k => {
                    if (k) result[k] = (result[k] || 0) + amt;
                });
            });
            return result;
        }

        return data; 
    } catch (error) {
        console.error("fetchCustomerTargets error:", error);
        return {};
    }
};

export const fetchCustomerProducts = async (
    customerCode: string,
    salesmanId: string,
    supplierId: number,
    startDate: string,
    endDate: string,
    viewType: 'customer' | 'area' | 'storeType' = 'customer'
): Promise<ProductSalesDetail[]> => {
    const params = new URLSearchParams({
        customerCode,
        salesmanId: salesmanId.toString(),
        supplierId: supplierId.toString(),
        startDate,
        endDate,
        viewType
    });
    const url = `/api/bia/crm/target-setting-reports/managerial-supplier/customer-products?${params.toString()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
};
