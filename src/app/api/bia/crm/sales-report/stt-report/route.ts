// src/app/api/bia/sales-report/stt-report/route.ts
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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    // const branches = searchParams.getAll("branches");
    // const salesmen = searchParams.getAll("salesman");
    // const statuses = searchParams.getAll("statuses");
    // const suppliers = searchParams.getAll("suppliers");

    const url = new URL(
      `${SPRING_API_BASE}/api/view-sales-report-itemized/filtered`,
    );
    if (startDate) url.searchParams.append("startDate", startDate);
    if (endDate) url.searchParams.append("endDate", endDate);

    // NOTE: Do not forward multi-value filters (branches/salesman/statuses/suppliers)
    // to the Spring API. The frontend will fetch the full date-range result and
    // apply multi-value filtering client-side to avoid incompatibilities with
    // the backend's expected single-value filter parameters.

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    // Read as text first so non-JSON responses (HTML errors, empty body) don't throw
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
            "Failed to fetch sales report itemized data",
        },
        { status: response.status },
      );
    }

    let records: unknown[] = [];
    if (Array.isArray(data)) {
      records = data;
    } else if (data && typeof data === "object") {
      // Check if response has a .data property
      if (Array.isArray(data.data)) {
        records = data.data;
      }
    }

    return NextResponse.json(records);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Internal server error";
    console.error("Sales Report Summary API Route Error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
