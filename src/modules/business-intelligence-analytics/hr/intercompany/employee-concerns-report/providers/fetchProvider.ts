import { IntercompanyConcernsData } from "../types";

const API_BASE = "/api/bia/hr/intercompany/employee-concerns-report";

export interface FetchConcernsParams {
  force?: boolean;
}

export async function fetchIntercompanyConcernsData(
  params?: FetchConcernsParams
): Promise<IntercompanyConcernsData> {
  const query = new URLSearchParams();
  if (params?.force) {
    query.set("force", "true");
  }

  const queryString = query.toString();
  const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    let errorMsg = `Failed to fetch employee concerns (HTTP ${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson?.error) errorMsg = errJson.error;
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

