import {
  CustomerAnnualSalesApiResponse,
  CustomerAnnualSalesApiResponseSchema,
} from "../types/customer-annual-sales.schema";

export async function fetchCustomerAnnualSales(
  params: Record<string, string> = {}
): Promise<CustomerAnnualSalesApiResponse> {
  const query = new URLSearchParams(params).toString();

  const url = `/api/bia/crm/customer-annual-sales${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `ERR_API_FAIL: Failed to fetch customer annual sales: ${response.statusText}`
    );
  }

  const rawData = await response.json();
  return CustomerAnnualSalesApiResponseSchema.parse(rawData);
}
