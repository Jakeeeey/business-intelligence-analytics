import { VSalesPerformanceDataDto, TargetSettingExecutive, TargetSettingDivision } from "../types";

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

export const fetchCompanyTargets = async (startDate: string, endDate: string): Promise<TargetSettingExecutive[]> => {
    const filter = JSON.stringify({ fiscal_period: { _between: [startDate, endDate] } });
    const url = `/api/bia/target-setting/executive?filter=${filter}&sort=fiscal_period`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Target Fetch Failed");

    const data = await res.json();
    return Array.isArray(data?.data) ? data.data : [];
};

export const fetchDivisionTargets = async (tseIds: number[]): Promise<TargetSettingDivision[]> => {
    if (tseIds.length === 0) return [];
    const filter = JSON.stringify({ tse_id: { _in: tseIds } });
    const url = `/api/bia/target-setting/executive?scope=division&filter=${filter}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Division Target Fetch Failed");

    const data = await res.json();
    return Array.isArray(data?.data) ? data.data : [];
};
