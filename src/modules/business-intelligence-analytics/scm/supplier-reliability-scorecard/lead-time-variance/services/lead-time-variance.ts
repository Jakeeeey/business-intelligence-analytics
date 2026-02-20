import {
  LeadTimeVariancePo,
  LeadTimeVarianceResponseSchema,
} from "../types/lead-time-variance.schema";

/**
 * Service function to fetch Lead Time Variance data from the local API route.
 *
 * @param params - Optional query parameters (e.g., from, to, limit)
 * @returns Promise<LeadTimeVariancePo[]>
 */
export async function fetchLeadTimeVarianceData(
  params: Record<string, string> = {},
): Promise<LeadTimeVariancePo[]> {
  const query = new URLSearchParams(params).toString();
  const url = `/api/bia/scm/supplier-reliability-scorecard/lead-time-variance${query ? `?${query}` : ""}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch lead time variance data: ${response.statusText}`,
      );
    }

    const rawData = await response.json();
    return LeadTimeVarianceResponseSchema.parse(rawData);
  } catch (error) {
    console.error("Error fetching lead time variance data:", error);
    throw error;
  }
}
