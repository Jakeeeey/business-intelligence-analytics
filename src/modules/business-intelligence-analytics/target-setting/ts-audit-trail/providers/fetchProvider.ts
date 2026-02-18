import { http } from "@/lib/http/client";
import type { AuditTrailFilters, AuditTrailResponse } from "./../types";

const API_BASE = "/api/bia/target-setting/audit-trail";

export async function getAuditLogs(filters: AuditTrailFilters): Promise<AuditTrailResponse> {
  const params = new URLSearchParams({
    page: filters.page.toString(),
    limit: filters.limit.toString(),
    sort_by: filters.sort_by,
    sort_order: filters.sort_order,
    search: filters.search,
    fiscal_period: filters.fiscal_period,
    trigger_event: filters.trigger_event
  });

  const res = await http.get(API_BASE, {
    params: Object.fromEntries(params),
    skipBaseUrl: true
  });
  return res.data;
}
