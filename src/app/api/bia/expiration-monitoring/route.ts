import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const SPRING_API_BASE = process.env.SPRING_API_BASE_URL || "";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    
    // Remove 'action' from query params to forward the rest
    searchParams.delete("action");
    const queryStr = searchParams.toString();
    
    let targetEndpoint = "";
    if (action === "filter") {
      targetEndpoint = `/api/view-product-expiration-monitoring/filter${queryStr ? `?${queryStr}` : ""}`;
    } else {
      targetEndpoint = `/api/view-product-expiration-monitoring/all`;
    }

    const url = `${SPRING_API_BASE.replace(/\/+$/, "")}${targetEndpoint}`;

    // Forward auth token if necessary
    const cookieStore = await cookies();
    const token = cookieStore.get("vos_access_token")?.value;
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      console.error(`[Expiration-API] Error fetching from Spring: ${response.statusText} (${response.status}) at ${url}`);
      return NextResponse.json({ error: `Failed to fetch: ${response.statusText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Expiration-API] Server error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
