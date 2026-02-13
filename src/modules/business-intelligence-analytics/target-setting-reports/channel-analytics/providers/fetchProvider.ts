import { ChannelDrilldownDto } from "../types";

export const fetchChannelDrilldownData = async (
    startDate: string,
    endDate: string
): Promise<ChannelDrilldownDto[]> => {
    const timestamp = new Date().getTime();
    const url = `/api/bia/target-setting-reports/area-analytics?startDate=${startDate}&endDate=${endDate}&_t=${timestamp}`;

    try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`API Failed: ${res.status}`);

        const rawData = await res.json();

        if (Array.isArray(rawData)) {
            return rawData.map((item: any) => ({
                divisionName: item.divisionName || "Unassigned",
                storeTypeLabel: item.storeTypeLabel || "Uncategorized Channel",
                storeName: item.storeName || "Unknown Store",
                supplierName: item.supplierName || "Unknown Supplier",
                salesmanName: item.salesmanName || "Unassigned",
                netAmount: item.netAmount || 0
            }));
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch Channel drill-down data:", error);
        return [];
    }
};