import { VSalesPerformanceDataDto, TargetSettingResponse, SupervisorKPIResponse } from "../types";

export const fetchSupervisorMappings = async (): Promise<SupervisorKPIResponse> => {
    const url = `/api/bia/crm/target-setting-reports/supervisor-kpi/mapping`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch supervisor mappings");
    return await res.json();
};

export const fetchSalesmanData = async (startDate: string, endDate: string): Promise<VSalesPerformanceDataDto[]> => {
    const params = new URLSearchParams({ startDate, endDate });
    const url = `/api/bia/crm/target-setting-reports/salesman-kpi?${params.toString()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
};

export const fetchDynamicTargets = async (startDate: string, endDate: string): Promise<TargetSettingResponse> => {
    const params = new URLSearchParams({ startDate, endDate });
    const url = `/api/bia/crm/target-setting-reports/managerial-supplier/targets?${params.toString()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { salesmanTargets: [], supervisorTargets: [] };
    return await res.json();
};

export const fetchCustomerPeaks = async (storeNames: string[]): Promise<Record<string, number>> => {
    if (storeNames.length === 0) return {};
    const params = new URLSearchParams({ storeNames: storeNames.join(",") });
    const url = `/api/bia/crm/target-setting-reports/supervisor-kpi/customer-peak?${params.toString()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return {};
    return await res.json();
};
