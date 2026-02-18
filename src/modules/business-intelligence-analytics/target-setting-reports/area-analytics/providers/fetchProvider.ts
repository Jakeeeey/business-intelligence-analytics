import { AreaDrilldownDto } from "../types";

export const fetchAreaDrilldownData = async (
    startDate: string,
    endDate: string
): Promise<AreaDrilldownDto[]> => {
    const timestamp = new Date().getTime();
    const url = `/api/bia/target-setting-reports/area-analytics?startDate=${startDate}&endDate=${endDate}&_t=${timestamp}`;

    try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`API Failed: ${res.status}`);

        const rawData = await res.json();

        if (Array.isArray(rawData)) {
            return rawData.map((item: any) => ({
                divisionName: item.divisionName || "Unassigned",
                province: item.province || "Unknown Province",
                city: item.city || "Unknown City",
                supplierName: item.supplierName || "Unknown Supplier",
                salesmanName: item.salesmanName || "Unknown Salesman",
                netAmount: item.netAmount || 0
            }));
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch drill-down data:", error);
        return [];
    }
};