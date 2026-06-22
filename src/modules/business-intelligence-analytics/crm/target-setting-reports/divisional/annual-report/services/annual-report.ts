import {
  DashboardResponseSchema,
  type DashboardResponse,
} from "../types/annual-report.schema";

/**
 * Fetches the annual report dashboard data (summary + monthly aggregates).
 * Calls the local Next.js API route which proxies to Sales and Purchase backends.
 * @param params - Query parameters: dateFrom, dateTo, customerName, supplierName, year
 * @returns {Promise<DashboardResponse>} Aggregated dashboard data with summary and monthly breakdown
 * @throws {ERR_API_FAIL} When the API request fails or returns a non-OK status
 * @throws {ERR_VALIDATION_FAILED} When the response fails Zod schema validation
 */
export async function fetchDashboardData(
  params: Record<string, string> = {},
): Promise<DashboardResponse> {
  const query = new URLSearchParams({
    ...params,
    _t: Date.now().toString(),
  }).toString();
  const url = `/api/bia/crm/target-setting-reports/divisional/annual-report${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `ERR_API_FAIL: Failed to fetch annual report data: ${response.statusText}`,
    );
  }

  const rawData = await response.json();
  return DashboardResponseSchema.parse(rawData);
}
