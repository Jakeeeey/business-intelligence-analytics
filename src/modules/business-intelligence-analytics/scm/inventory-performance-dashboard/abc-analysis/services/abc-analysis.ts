import { AbcAnalysisResponse } from "../types/abc-analysis.schema";

export async function fetchAbcAnalysisData(
    params?: Record<string, string>,
): Promise<AbcAnalysisResponse> {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    // Updated endpoint to include inventory-performance-dashboard
    const res = await fetch(`/api/bia/scm/inventory-performance-dashboard/abc-analysis${query}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch ABC Analysis data: ${res.statusText}`);
    }

    return res.json();
}
