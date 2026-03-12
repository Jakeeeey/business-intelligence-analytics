import { scmProxyRequest } from "@/modules/business-intelligence-analytics/scm/stock-health-monitor/stock-out-risk/utils/proxy";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const endpoint = "/api/view-stock-out-risk/all";
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  const query = params.toString();
  const finalEndpoint = query ? `${endpoint}?${query}` : endpoint;

  const result = await scmProxyRequest(finalEndpoint);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data);
}
