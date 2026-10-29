import { PHAuditApiResponse } from "../types";

export async function fetchPhysicalInventoryAuditSchedule(
  year: number,
  month: number
): Promise<PHAuditApiResponse> {
  const url = `/api/bia/scm/ph-audit?year=${year}&month=${month}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch inventory audit schedule (Status: ${response.status})`);
  }

  return response.json();
}

