import { IntercompanyManpowerData } from "../types";

const API_BASE = "/api/bia/hr/intercompany/manpower-report";

export async function fetchIntercompanyManpowerData(
  force = false
): Promise<IntercompanyManpowerData> {
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
      errorJson.error || `Failed to fetch manpower data: ${res.statusText}`
    );
  }

  return res.json();
}

