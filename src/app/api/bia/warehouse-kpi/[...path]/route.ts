import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const reports = new Set(["summary", "inventory-accuracy", "picking-accuracy", "stocking-level-accuracy", "receiving-accuracy", "loading-readiness", "location-compliance", "housekeeping", "sop-safety", "damage-loss"]);

async function proxy(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  const { path } = await context.params;
  if (path.some(segment => !/^[a-zA-Z0-9-]+$/.test(segment))) {
    return NextResponse.json({ message: "Invalid route." }, { status: 400 });
  }
  if (!reports.has(path[0])) {
    return NextResponse.json({ message: "Unknown warehouse endpoint." }, { status: 404 });
  }
  if (req.method !== "GET") return NextResponse.json({ message: "Read-only endpoint." }, { status: 405 });
  const base = process.env.SPRING_API_BASE_URL;
  if (!base) return NextResponse.json({ message: "Spring backend is not configured." }, { status: 503 });
  const upstreamPath = `/api/bia/warehouse-kpi/${path.join("/")}`;
  const url = new URL(`${base.replace(/\/$/, "")}${upstreamPath}`);
  url.search = req.nextUrl.search;
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if ((from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) || (to && !/^\d{4}-\d{2}-\d{2}$/.test(to)) || (from && to && from > to)) {
    return NextResponse.json({ message: "Provide a valid date range (YYYY-MM-DD)." }, { status: 400 });
  }
  try {
    if (process.env.NODE_ENV === "development") {
      console.log(`[warehouse-kpi proxy] ${req.method} ${path.join("/")} search=${req.nextUrl.search}`);
      console.log(`[warehouse-kpi proxy] upstream URL: ${url}`);
    }
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
      redirect: "error",
    });
    const body = await response.text();
    if (process.env.NODE_ENV === "development") {
      console.log(`[warehouse-kpi proxy] upstream status=${response.status} body=${body.slice(0, 500)}`);
    }
    return new NextResponse(response.status === 204 ? null : body, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") || "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ message: "Warehouse service is unavailable or timed out. Please retry." }, { status: 502 });
  }
}

export { proxy as GET };
