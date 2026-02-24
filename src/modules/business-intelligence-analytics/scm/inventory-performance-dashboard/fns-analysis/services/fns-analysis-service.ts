// src/modules/.../fns-analysis/services/fns-analysis-service.ts
import type { FnsAnalysisResponse } from "../types";

/**
 * Generic HTTP helper for internal Next.js API calls.
 * Throws on non-OK responses with the server's error message.
 */
async function http<T>(url: string): Promise<T> {
    const res = await fetch(url, { method: "GET", cache: "no-store", credentials: "include" });
    const body = await res.json().catch(() => null);

    if (!res.ok) {
        const msg = body?.error || body?.message || `Request failed (${res.status})`;
        throw new Error(msg);
    }

    return body as T;
}

/**
 * Fetches the enriched FNS analysis data from our local API route.
 * The route proxies to Spring Boot with auth and returns ranked,
 * classified inventory rows plus KPI summary thresholds.
 */
export async function getFnsAnalysisData(): Promise<FnsAnalysisResponse> {
    return http<FnsAnalysisResponse>(
        "/api/bia/scm/inventory-performance-dashboard/fns-analysis",
    );
}
