// src/modules/business-intelligence-analytics/scm/consolidator-audit/providers/fetchProvider.ts
import type { ConsolidatorAuditRecord, ConsolidatorAuditFilters } from "../types";

export function getAccessToken(): string | null {
  if (typeof window !== "undefined") {
    const t = window.localStorage.getItem("access_token");
    if (t) return t;
  }
  return null;
}

/**
 * Fetch consolidator audit data based on parameters.
 */
export async function fetchConsolidatorAuditData(
  filters: ConsolidatorAuditFilters,
  signal?: AbortSignal,
): Promise<ConsolidatorAuditRecord[]> {
  const params = new URLSearchParams();
  
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.pdpNo) params.append("pdpNo", filters.pdpNo);
  if (filters.pdpStatus) params.append("pdpStatus", filters.pdpStatus);
  if (filters.consolidatorNo) params.append("consolidatorNo", filters.consolidatorNo);
  if (filters.consolidatorStatus) params.append("consolidatorStatus", filters.consolidatorStatus);
  if (filters.dpNo) params.append("dpNo", filters.dpNo);
  if (filters.dpStatus) params.append("dpStatus", filters.dpStatus);

  const url = `/api/bia/scm/consolidator-audit?${params.toString()}`;

  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    signal,
    credentials: "same-origin",
    headers,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    const httpErr = new Error(
      errData?.error || `Failed to fetch consolidator audit data (${res.status})`
    ) as Error & { status: number };
    httpErr.status = res.status;
    throw httpErr;
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("Invalid response format for consolidator audit data");
  }

  return data as ConsolidatorAuditRecord[];
}
