import { CustomerRawRecord, StoreTypeRecord, UserRecord } from "../types";

export interface NewCustomerApiResponse {
    customers: CustomerRawRecord[];
    storeTypes: StoreTypeRecord[];
    users: UserRecord[];
}

export const fetchNewCustomerData = async (
    startDate?: string,
    endDate?: string
): Promise<NewCustomerApiResponse> => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    params.append("_t", String(Date.now()));

    const res = await fetch(`/api/bia/crm/sales-report/new-customer?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
    });

    if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Failed to fetch new customers (${res.status})`);
    }

    const json = await res.json();
    return {
        customers: Array.isArray(json.customers) ? json.customers : [],
        storeTypes: Array.isArray(json.storeTypes) ? json.storeTypes : [],
        users: Array.isArray(json.users) ? json.users : [],
    };
};
