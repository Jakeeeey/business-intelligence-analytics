// src/app/api/bia/scm/consolidator-audit/route.ts
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
    const apiParams = new URLSearchParams();

    // Forward all filtering parameters
    const paramKeys = [
      "startDate",
      "endDate",
      "pdpNo",
      "pdpStatus",
      "consolidatorNo",
      "consolidatorStatus",
      "dpNo",
      "dpStatus",
    ];

    paramKeys.forEach((key) => {
      const val = searchParams.get(key);
      if (val !== null && val !== undefined && val !== "") {
        apiParams.append(key, val);
      }
    });

    const endpoint = `${SPRING_API_BASE}/api/vw-pdp-consolidation-dp-tags/filter?${apiParams.toString()}`;
    const url = new URL(endpoint);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const text = await response.text();
    let data: unknown = null;
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
      const errObj = data as Record<string, unknown> | null;
      return NextResponse.json(
        {
          error:
            errObj?.message ||
            errObj?.error ||
            "Failed to fetch consolidator audit data",
        },
        { status: response.status },
      );
    }

    let records: unknown[] = [];
    if (Array.isArray(data)) {
      records = data;
    } else if (data && typeof data === "object") {
      const dataObj = data as Record<string, unknown>;
      if (Array.isArray(dataObj.data)) {
        records = dataObj.data;
      }
    }

    return NextResponse.json(records);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Internal server error";
    console.error("Consolidator Audit API Route Error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
