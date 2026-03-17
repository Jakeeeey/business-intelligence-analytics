import { ChannelDrilldownDto } from "../types";

export const fetchChannelDrilldownData = async (
    startDate: string,
    endDate: string
): Promise<ChannelDrilldownDto[]> => {
    const timestamp = new Date().getTime();
    const url = `/api/bia/crm/target-setting-reports/area-analytics?startDate=${startDate}&endDate=${endDate}&_t=${timestamp}`;

    try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`API Failed: ${res.status}`);

        const rawData = await res.json();

        if (Array.isArray(rawData)) {
            return rawData.map((item: Record<string, unknown>) => ({
                divisionName: (item.divisionName as string) || "Unassigned",
                storeTypeLabel: (item.storeTypeLabel as string) || "Uncategorized Channel",
                storeName: (item.storeName as string) || "Unknown Store",
                supplierName: (item.supplierName as string) || "Unknown Supplier",
                salesmanName: (item.salesmanName as string) || "Unassigned",
                netAmount: (item.netAmount as number) || 0
            }));
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch Channel drill-down data:", error);
        return [];
    }
};