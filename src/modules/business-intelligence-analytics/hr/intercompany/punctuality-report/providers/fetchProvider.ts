import { IntercompanyPunctualityData, IntercompanyPunctualityFilters } from "../types";

const API_BASE = "/api/bia/hr/intercompany/punctuality-report";

export async function fetchIntercompanyPunctualityData(
  filters: Partial<IntercompanyPunctualityFilters> & { force?: boolean },
  signal?: AbortSignal
): Promise<IntercompanyPunctualityData> {
  const query = new URLSearchParams();
  if (filters.startDate && filters.endDate) {
    query.append("startDate", filters.startDate);
    query.append("endDate", filters.endDate);
  } else if (filters.date) {
    query.append("date", filters.date);
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
        `Failed to fetch intercompany punctuality data (${res.status})`
    );
  }

  return res.json();
}
