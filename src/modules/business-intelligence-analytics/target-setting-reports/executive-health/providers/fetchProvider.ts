import { VSalesPerformanceDataDto } from "../types";

export const fetchExecutiveHealthData = async (startDate: string, endDate: string) => {
    // CACHE BUSTER: Add timestamp to force fresh data
    const timestamp = new Date().getTime();
    const url = `/api/bia/target-setting-reports/executive-health?startDate=${startDate}&endDate=${endDate}&_t=${timestamp}`;

    console.log(`[Executive Fetch] ${startDate} -> ${endDate}`);

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("API Failed");
    
    const data: VSalesPerformanceDataDto[] = await res.json();
    return Array.isArray(data) ? data : [];
};