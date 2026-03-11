import { AreaDrilldownDto } from "../types";

export const fetchAreaDrilldownData = async (
    startDate: string,
    endDate: string
): Promise<AreaDrilldownDto[]> => {
    const timestamp = new Date().getTime();
    const url = `/api/bia/crm/target-setting-reports/area-analytics?startDate=${startDate}&endDate=${endDate}&_t=${timestamp}`;

    try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`API Failed: ${res.status}`);

        const rawData = await res.json();

        if (Array.isArray(rawData)) {
            return rawData.map((item: Record<string, unknown>) => ({
                divisionName: (item.divisionName as string) || "Unassigned",
                province: (item.province as string) || "Unknown Province",
                city: (item.city as string) || "Unknown City",
                supplierName: (item.supplierName as string) || "Unknown Supplier",
                salesmanName: (item.salesmanName as string) || "Unknown Salesman",
                netAmount: (item.netAmount as number) || 0
            }));
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch drill-down data:", error);
        return [];
    }
};