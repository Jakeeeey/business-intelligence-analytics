import { SlobAging } from "../../types/stock-health.schema";

export async function fetchAgingSlobData(): Promise<SlobAging[]> {
  const res = await fetch("/api/bia/scm/stock-health-monitor/aging-and-slob", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch Aging & SLOB: ${res.statusText}`);
  }

  return res.json();
}
