import { PHWarehouseApiResponse } from "../types";

export async function fetchPhysicalInventorySchedule(
  year: number,
  month: number
): Promise<PHWarehouseApiResponse> {
  const url = `/api/bia/scm/ph-warehouse?year=${year}&month=${month}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch inventory schedule (Status: ${response.status})`);
  }

  return response.json();
}

