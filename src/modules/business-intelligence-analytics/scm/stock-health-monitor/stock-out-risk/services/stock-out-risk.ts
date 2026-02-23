import { StockOutRisk } from "../../types/stock-health.schema";

export async function fetchStockOutRiskData(startDate?: string, endDate?: string): Promise<StockOutRisk[]> {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  
  const query = params.toString();
  const url = `/api/bia/scm/stock-health-monitor/stock-out-risk${query ? `?${query}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch Stock-out Risk: ${res.statusText}`);
  }

  return res.json();
}
