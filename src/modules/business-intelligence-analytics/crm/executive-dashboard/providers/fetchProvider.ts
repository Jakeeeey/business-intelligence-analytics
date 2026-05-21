// src/modules/business-intelligence-analytics/crm/executive-dashboard/providers/fetchProvider.ts

/**
 * Fetch records from the Next.js API proxy route for a specific Spring Boot endpoint
 * with support for abort signals, dates, and optional filter parameters.
 */
export async function fetchDashboardEndpoint<T>(
  endpoint: "accounts-payable" | "disbursement-itemized" | "ar-per-supplier" | "running-inventory" | "sales-return" | "sales-report",
  startDate: string,
  endDate: string,
  signal?: AbortSignal,
  additionalParams?: Record<string, string>
): Promise<T[]> {
  const params = new URLSearchParams();
  params.append("endpoint", endpoint);
  params.append("startDate", startDate);
  params.append("endDate", endDate);

  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, val]) => {
      if (val) {
        params.append(key, val);
      }
    });
  }

  const url = `/api/bia/crm/executive-dashboard?${params.toString()}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      const errMsg = errData?.error || `Failed to fetch ${endpoint} data (Status ${res.status})`;
      const error = new Error(errMsg) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new Error(`Invalid response format from dashboard proxy for endpoint: ${endpoint}`);
    }

    return data as T[];
  } catch (error: unknown) {
    const errName = (error as { name?: unknown })?.name;
    if (errName === "AbortError") {
      throw error;
    }
    console.error(`Error in fetchDashboardEndpoint for ${endpoint}:`, error);
    throw error;
  }
}
