// src/app/api/bia/scm/stock-out-monitoring/allocated-vs-ordered/route.ts
import { NextRequest, NextResponse } from "next/server";

const SPRING_API_BASE = process.env.SPRING_API_BASE_URL;

export async function GET(req: NextRequest) {
  try {
    const token =
      req.headers.get("authorization")?.replace("Bearer ", "") ||
      req.cookies.get("vos_access_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: no token provided" },
        { status: 401 },
      );
    }

    if (!SPRING_API_BASE) {
      return NextResponse.json(
        { error: "Spring API base URL is not configured" },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get("supplierId");

    // Use supplier-specific endpoint when supplierId provided, otherwise fetch all
    // Date filtering is done client-side; do NOT pass date params to the Spring API
    const endpoint = supplierId
      ? `${SPRING_API_BASE}/api/v1/order-discrepancies/supplier/${supplierId}`
      : `${SPRING_API_BASE}/api/v1/order-discrepancies/all`;

    const url = new URL(endpoint);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const text = await response.text();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      const preview = text.slice(0, 300);
      return NextResponse.json(
        {
          error: response.ok
            ? `Unexpected non-JSON response from data server: ${preview}`
            : preview || "Failed to fetch data",
        },
        { status: response.ok ? 502 : response.status },
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.message ||
            data?.error ||
            "Failed to fetch allocated vs ordered data",
        },
        { status: response.status },
      );
    }

    let records: unknown[] = [];
    if (Array.isArray(data)) {
      records = data;
    } else if (data && typeof data === "object") {
      if (Array.isArray(data.data)) {
        records = data.data;
      }
    }

    return NextResponse.json(records);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Internal server error";
    console.error("Allocated vs Ordered API Route Error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
