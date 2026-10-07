import { SalesReportItemizedRecord } from "../types";

export const fetchSalesByCustomerData = async (
    startDate: string,
    endDate: string
): Promise<SalesReportItemizedRecord[]> => {
    const timestamp = Date.now();
    const url = `/api/bia/crm/sales-report/sales-by-customer?startDate=${startDate}&endDate=${endDate}&_t=${timestamp}`;

    const res = await fetch(url, { cache: "no-store", credentials: "include" });
    if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.error || `Failed to fetch sales performance data (${res.status})`;
        throw new Error(errMsg);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
};
