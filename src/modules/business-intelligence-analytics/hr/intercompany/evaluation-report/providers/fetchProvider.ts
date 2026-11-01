import { IntercompanyEvaluationData } from "../types";

const API_BASE = "/api/bia/hr/intercompany/evaluation-report";

export async function fetchIntercompanyEvaluationData(
  force = false
): Promise<IntercompanyEvaluationData> {
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
      errorJson.error || `Failed to fetch evaluation data: ${res.statusText}`
    );
  }

  return res.json();
}

