import type { AuditTrailFilters, AuditTrailResponse } from "./../types";

const API_BASE = "/api/bia/crm/target-setting/audit-trail";

/**
 * Local request helper — uses native fetch against our own Next.js API routes.
 * Authentication is handled server-side via cookies; no client token needed.
 */
async function request<T>(method: string, endpoint: string, body?: Record<string, unknown>): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const res = await fetch(endpoint, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
  }

  if (res.status === 204) return {} as T;
  const json = await res.json();
  return (json.data !== undefined ? json.data : json) as T;
}

export async function getAuditLogs(filters: AuditTrailFilters): Promise<AuditTrailResponse> {
  const params = new URLSearchParams({
    page: filters.page.toString(),
    limit: filters.limit.toString(),
    sort_by: filters.sort_by,
    sort_order: filters.sort_order,
    search: filters.search,
    fiscal_period: filters.fiscal_period,
    trigger_event: filters.trigger_event,
  });

  const res = await fetch(`${API_BASE}?${params.toString()}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
  }

  // Return the full JSON (includes both `data` and `meta` properties)
  return res.json();
}
