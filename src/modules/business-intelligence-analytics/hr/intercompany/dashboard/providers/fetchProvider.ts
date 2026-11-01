import { IntercompanyDashboardData } from "../types";

const API_BASE = "/api/bia/hr/intercompany/dashboard";

export async function fetchIntercompanyDashboardData(
  force = false
): Promise<IntercompanyDashboardData> {
  const url = force ? `${API_BASE}?force=true` : API_BASE;
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

