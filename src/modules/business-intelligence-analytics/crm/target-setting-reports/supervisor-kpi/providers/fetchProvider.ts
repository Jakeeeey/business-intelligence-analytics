import { VSalesPerformanceDataDto, TargetSettingResponse, SupervisorKPIResponse, ProductSalesDetail, AreaTarget } from "../types";

export const fetchSupervisorMappings = async (): Promise<SupervisorKPIResponse> => {
    const url = `/api/bia/crm/target-setting-reports/supervisor-kpi/mapping`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch supervisor mappings");
    return await res.json();
};

export const fetchSalesmanData = async (startDate: string, endDate: string): Promise<VSalesPerformanceDataDto[]> => {
    const params = new URLSearchParams({ startDate, endDate });
    const url = `/api/bia/crm/target-setting-reports/supervisor-kpi/performance?${params.toString()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
};

export const fetchDynamicTargets = async (startDate: string, endDate: string): Promise<TargetSettingResponse> => {
    const params = new URLSearchParams({ startDate, endDate });
    const url = `/api/bia/crm/target-setting-reports/supervisor-kpi/targets?${params.toString()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { salesmanTargets: [], supervisorTargets: [] };
    return await res.json();
};

export const fetchCustomerPeaks = async (names: string[], salesmanIds: number[], viewType: 'customer' | 'area' = 'customer'): Promise<Record<string, { total: number; peak: number }>> => {
    if (names.length === 0) return {};
    const url = `/api/bia/crm/target-setting-reports/supervisor-kpi/customer-peak?ids=${salesmanIds.join(",")}&names=${encodeURIComponent(names.join("|"))}&viewType=${viewType}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return {};
    return await res.json();
};
export const fetchCustomerTargets = async (salesmanIds: number[], startDate: string, endDate: string, viewType: 'customer' | 'area' = 'customer', names: string[] = []): Promise<Record<string, number>> => {
    try {
        const url = `/api/bia/crm/target-setting-reports/supervisor-kpi/customer-targets?salesmanIds=${salesmanIds.join(",")}&startDate=${startDate}&endDate=${endDate}&viewType=${viewType}${names.length > 0 ? `&names=${encodeURIComponent(names.join("|"))}` : ""}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return {};
        
        const data = await res.json();

        // FORGIVING AREA MATCH: Store in multiple formats to ensure match
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

                // Use a set of unique keys to avoid double-adding to the same key if they happen to be identical
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
    salesmanId: number,
    supplierId: number,
    startDate: string,
    endDate: string,
    viewType: 'customer' | 'area' = 'customer'
): Promise<ProductSalesDetail[]> => {
    const params = new URLSearchParams({
        customerCode,
        salesmanId: salesmanId.toString(),
        supplierId: supplierId.toString(),
        startDate,
        endDate,
        viewType
    });
    const url = `/api/bia/crm/target-setting-reports/supervisor-kpi/customer-products?${params.toString()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
};
