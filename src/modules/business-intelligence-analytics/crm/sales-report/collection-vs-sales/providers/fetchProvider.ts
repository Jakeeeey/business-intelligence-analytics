import {
    CollectionVsSalesFiltersState,
    CollectionVsSalesLookups,
    CollectionVsSalesResponse,
} from "../types";

async function http<T>(url: string): Promise<T> {
    const res = await fetch(url, { method: "GET", cache: "no-store" });
    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.success) {
        const msg = data?.message || `Request failed (${res.status})`;
        throw new Error(msg);
    }

    return data.data as T;
}

export async function fetchCollectionVsSalesLookups(): Promise<CollectionVsSalesLookups> {
    return http<CollectionVsSalesLookups>("/api/bia/crm/sales-report/collection-vs-sales?mode=lookups");
}

export async function fetchCollectionVsSalesReport(
    filters: CollectionVsSalesFiltersState
): Promise<CollectionVsSalesResponse> {
    const sp = new URLSearchParams();
    sp.set("mode", "report");
    if (filters.startDate) sp.set("startDate", filters.startDate);
    if (filters.endDate) sp.set("endDate", filters.endDate);
    if (filters.salesmanId && filters.salesmanId !== "ALL") sp.set("salesmanId", filters.salesmanId);
    if (filters.paymentMethod && filters.paymentMethod !== "ALL") sp.set("paymentMethod", filters.paymentMethod);

    return http<CollectionVsSalesResponse>(`/api/bia/crm/sales-report/collection-vs-sales?${sp.toString()}`);
}
