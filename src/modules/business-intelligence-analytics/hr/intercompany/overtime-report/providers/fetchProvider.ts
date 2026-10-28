import { IntercompanyOvertimeData, IntercompanyOvertimeFilters } from "../types";

const API_BASE = "/api/bia/hr/intercompany/overtime-report";

export async function fetchIntercompanyOvertimeData(
  filters: Partial<IntercompanyOvertimeFilters> & { force?: boolean },
  signal?: AbortSignal
): Promise<IntercompanyOvertimeData> {
  const query = new URLSearchParams();
  if (filters.startDate && filters.endDate) {
    query.append("startDate", filters.startDate);
    query.append("endDate", filters.endDate);
  }
  if (filters.dates && filters.dates.length > 0) {
    query.append("dates", filters.dates.join(","));
  }
  if (filters.force) {
    query.append("force", "true");
  }

  const qs = query.toString();
  const url = `${API_BASE}${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    signal,
    cache: "no-store",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.error ||
        errorData?.message ||
        `Failed to fetch intercompany overtime data (${res.status})`
    );
  }

  return res.json();
}
