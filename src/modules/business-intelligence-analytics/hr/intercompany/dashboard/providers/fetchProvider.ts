import { DashboardFilters, IntercompanyDashboardData } from "../types";

const API_BASE = "/api/bia/hr/intercompany/dashboard";

export async function fetchIntercompanyDashboardData(
  force = false,
  filters?: Partial<DashboardFilters>
): Promise<IntercompanyDashboardData> {
  const params = new URLSearchParams();
  if (force) params.set("force", "true");
  if (filters?.company && filters.company !== "ALL") {
    params.set("company", filters.company);
  }
  if (filters?.dateRange && filters.dateRange !== "all") {
    params.set("dateRange", filters.dateRange);
  }
  if (filters?.startDate) params.set("startDate", filters.startDate);
  if (filters?.endDate) params.set("endDate", filters.endDate);

  const qs = params.toString();
  const url = qs ? `${API_BASE}?${qs}` : API_BASE;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(
      errorJson.error ||
        `Failed to fetch intercompany dashboard data: ${res.statusText}`
    );
  }

  return res.json();
}
