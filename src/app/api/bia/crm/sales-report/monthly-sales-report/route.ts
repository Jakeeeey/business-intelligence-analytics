import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SPRING_BASE = (process.env.SPRING_API_BASE_URL || "").replace(/\/+$/, "");

export async function GET(req: NextRequest) {
  try {
    if (!SPRING_BASE) {
      return NextResponse.json(
        { error: "Spring API base URL is not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required query parameters: startDate and endDate" },
        { status: 400 }
      );
    }

    const url = new URL(`${SPRING_BASE}/api/view-sales-performance/all`);
    url.searchParams.append("startDate", startDate);
    url.searchParams.append("endDate", endDate);

    const token = req.cookies.get("vos_access_token")?.value ?? null;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url.toString(), {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Spring API error: ${res.status} - ${text}` },
        { status: res.status }
      );
    }

    const salesPerformance = await res.json();
    return NextResponse.json({ salesPerformance });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("CRM Monthly Sales Report API Route Error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
