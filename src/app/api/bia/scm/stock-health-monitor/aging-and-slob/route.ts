import { scmProxyRequest } from "@/lib/scm-proxy";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await scmProxyRequest("/api/view-slob-aging/all");

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data);
}
