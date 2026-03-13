import { NextRequest, NextResponse } from "next/server";

const SPRING_API_BASE = process.env.SPRING_API_BASE_URL;

export async function GET(req: NextRequest) {
  try {
    // First check Authorization header, fallback to cookie
    const token =
      req.headers.get("authorization")?.replace("Bearer ", "") ||
      req.cookies.get("vos_access_token")?.value; // <-- read token from cookie

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: no token provided" },
        { status: 401 },
      );
    }

    // Extract startDate and endDate from query parameters
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build Spring API URL with query parameters
    const url = new URL(
      `${SPRING_API_BASE}/api/view-sales-product-performance/all`,
    );
    if (startDate) url.searchParams.append("startDate", startDate);
    if (endDate) url.searchParams.append("endDate", endDate);

    // Call Spring API
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.message || "Failed to fetch product sales" },
        { status: response.status },
      );
    }

    let records = [];
    if (Array.isArray(data)) records = data;
    else if (data.success && Array.isArray(data.data)) records = data.data;
    else if (data.data && Array.isArray(data.data)) records = data.data;
    // console.log("[Product Sales Performance API] Response received:", {
    //   status: response.status,
    //   ok: response.ok,
    //   dataType: Array.isArray(data) ? "array" : typeof data,
    //   dataLength: Array.isArray(data) ? data.length : data?.data?.length || "N/A",
    //   sample: Array.isArray(data) ? data[0] : data,
    //   url: url.toString(),
    //   tokenProvided: !!token,
    //   response:response,

    // });
    return NextResponse.json(records);
  } catch (error: unknown) {
    console.error("API Route Error:", error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: unknown }).message)
          : String(error ?? "Internal server error");

    return NextResponse.json(
      { error: message || "Internal server error" },
      { status: 500 },
    );
  }
}
