import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.SPRING_API_BASE_URL || "http://goatedcodoer:8083";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerCode = searchParams.get("customerCode") || "";
    const customerName = searchParams.get("customerName") || "";
    const tagging = searchParams.get("tagging") || "";
    const minDaysNoSales = searchParams.get("minDaysNoSales") || "";

    const cookieStore = await cookies();
    const token =
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      request.cookies.get("vos_access_token")?.value ||
      cookieStore.get("vos_access_token")?.value ||
      request.cookies.get("access_token")?.value ||
      cookieStore.get("access_token")?.value ||
      cookieStore.get("springboot_token")?.value;

    const queryParams = new URLSearchParams();
    if (customerCode) queryParams.append("customerCode", customerCode);
    if (customerName) queryParams.append("customerName", customerName);
    if (tagging && tagging !== "ALL") queryParams.append("tagging", tagging);
    if (minDaysNoSales) queryParams.append("minDaysNoSales", minDaysNoSales);

    const qs = queryParams.toString();
    const cleanBase = BACKEND_URL.replace(/\/+$/, "");
    const targetUrl = `${cleanBase}/api/view-lost-customer-list${qs ? `?${qs}` : ""}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(targetUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        {
          error: `Backend error: ${res.status} ${res.statusText}`,
          details: errorText,
        },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("[Lost Customer Management Proxy Error]", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
