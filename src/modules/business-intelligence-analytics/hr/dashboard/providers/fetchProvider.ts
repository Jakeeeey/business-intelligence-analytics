import { HrDashboardData, HrDashboardFilters } from "../types";

const API_BASE = "/api/bia/hr/dashboard";

export async function fetchHrDashboardData(
  filters: HrDashboardFilters,
  signal?: AbortSignal
): Promise<HrDashboardData> {
  const query = new URLSearchParams();
  if (filters.department && filters.department !== "ALL") {
    query.append("department", filters.department);
  }
  if (filters.status && filters.status !== "ALL") {
    query.append("status", filters.status);
  }
  if (filters.gender && filters.gender !== "ALL") {
    query.append("gender", filters.gender);
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
        `Failed to fetch HR dashboard data (${res.status})`
    );
  }

  return res.json();
}
