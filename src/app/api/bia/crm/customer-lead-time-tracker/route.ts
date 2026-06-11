import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.SPRING_API_BASE_URL || "http://localhost:8083";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const customerCode = searchParams.get("customerCode");
    const poNo = searchParams.get("poNo");

    const cookieStore = await cookies();
    const token = 
      request.headers.get("authorization")?.replace("Bearer ", "") || 
      cookieStore.get("vos_access_token")?.value;

    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);
    if (customerCode) queryParams.append("customerCode", customerCode);
    if (poNo) queryParams.append("poNo", poNo);

    const qs = queryParams.toString();
    const targetUrl = `${BACKEND_URL}/api/view-so-customer-lead-time/filter${qs ? `?${qs}` : ""}`;

    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Backend error: ${res.status} ${res.statusText}`, details: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();
    console.log("[Customer Lead Time Proxy] Backend returned data:", JSON.stringify(data).slice(0, 500), "...");
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("[Customer Lead Time Proxy Error]", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
