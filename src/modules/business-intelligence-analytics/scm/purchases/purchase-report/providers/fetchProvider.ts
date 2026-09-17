import {
    PurchaseReportFiltersState,
    PurchaseReportLookups,
    PurchaseReportResponse,
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

export async function fetchPurchaseReportLookups(): Promise<PurchaseReportLookups> {
    return http<PurchaseReportLookups>("/api/bia/scm/purchases/purchase-report?mode=lookups");
}

export async function fetchPurchaseReport(
    filters: PurchaseReportFiltersState
): Promise<PurchaseReportResponse> {
    const sp = new URLSearchParams();
    sp.set("mode", "report");
    if (filters.startDate) sp.set("startDate", filters.startDate);
    if (filters.endDate) sp.set("endDate", filters.endDate);
    if (filters.supplierId && filters.supplierId !== "ALL") sp.set("supplierId", filters.supplierId);
    if (filters.branchId && filters.branchId !== "ALL") sp.set("branchId", filters.branchId);
    if (filters.status && filters.status !== "ALL") sp.set("status", filters.status);

    return http<PurchaseReportResponse>(`/api/bia/scm/purchases/purchase-report?${sp.toString()}`);
}
