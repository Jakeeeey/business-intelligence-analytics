import { VProductMovementDto } from "../types";

export const fetchMovementReport = async (
    supplierId: string,
    fromDate: string,
    toDate: string
): Promise<VProductMovementDto[]> => {
    // Format dates to ISO Instant strings for Spring Boot
    const startIso = `${fromDate}T00:00:00Z`;
    const endIso = `${toDate}T23:59:59Z`;

    const url = `/api/bia/scm/logistics-performance/movement-reviewer?supplierId=${supplierId}&startDate=${startIso}&endDate=${endIso}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.success) {
        throw new Error(data.message || "Failed to fetch movement data");
    }

    return data.data; // Assumes your Spring Boot response structure maps 'data' to the content array
};