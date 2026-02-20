import { FulfillmentRatePo } from "../types/fulfillment-rate.schema";

export async function fetchFulfillmentRateData(
  params?: Record<string, string>,
): Promise<FulfillmentRatePo[]> {
  const query = params ? `?${new URLSearchParams(params).toString()}` : "";
  const res = await fetch(
    `/api/bia/scm/supplier-reliability-scorecard/fulfillment-rate${query}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.statusText}`);
  }

  return res.json();
}
