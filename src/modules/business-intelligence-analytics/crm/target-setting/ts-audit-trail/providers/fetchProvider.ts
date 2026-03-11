import type { AuditTrailFilters, AuditTrailResponse } from "./../types";

const API_BASE = "/api/bia/crm/target-setting/audit-trail";



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
