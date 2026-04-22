import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIRECTUS_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

function getDirectusHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (DIRECTUS_TOKEN) h["Authorization"] = `Bearer ${DIRECTUS_TOKEN}`;
  return h;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get("targetUrl");
    const directusCollection = searchParams.get("directusCollection");

    // 1. Handle Directus Proxy (CRUD for report configurations)
    if (directusCollection) {
      if (!DIRECTUS_BASE) {
        return NextResponse.json({ error: "Directus base URL not configured" }, { status: 500 });
      }

      const proxyParams = new URLSearchParams(searchParams.toString());
      proxyParams.delete("directusCollection");
      
      const target = `${DIRECTUS_BASE}/items/${encodeURIComponent(directusCollection)}${
        proxyParams.toString() ? `?${proxyParams.toString()}` : ""
      }`;

      const res = await fetch(target, { method: "GET", headers: getDirectusHeaders() });
      const data = await res.json();
      return NextResponse.json(data);
    }

    // 2. Handle Spring Boot Proxy (Dynamic Report Data)
    if (targetUrl) {
      const token = req.cookies.get("vos_access_token")?.value;
      const SPRING_API_BASE = process.env.SPRING_API_BASE_URL;

      if (!token) {
        return NextResponse.json({ error: "Unauthorized: No access token found in cookies" }, { status: 401 });
      }

      // Automatically prepend base URL if the provided targetUrl is relative
      let finalUrl = targetUrl;
      if (finalUrl.startsWith("/") && SPRING_API_BASE) {
        finalUrl = `${SPRING_API_BASE.replace(/\/$/, "")}${finalUrl}`;
      }

      const res = await fetch(finalUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        const errorText = await res.text();
        return NextResponse.json({ error: `Failed to fetch report data: ${errorText}` }, { status: res.status });
      }

      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Missing required parameters (targetUrl or directusCollection)" }, { status: 400 });
  } catch (error: any) {
    console.error("Dynamic Reports API Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const directusCollection = searchParams.get("directusCollection");

    if (!directusCollection) {
      return NextResponse.json({ error: "directusCollection is required for POST" }, { status: 400 });
    }

    const body = await req.json();
    const target = `${DIRECTUS_BASE}/items/${encodeURIComponent(directusCollection)}`;

    const res = await fetch(target, {
      method: "POST",
      headers: getDirectusHeaders(),
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save report" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const directusCollection = searchParams.get("directusCollection");
    const id = searchParams.get("id");

    if (!directusCollection || !id) {
      return NextResponse.json({ error: "directusCollection and id are required for PATCH" }, { status: 400 });
    }

    const body = await req.json();
    const target = `${DIRECTUS_BASE}/items/${encodeURIComponent(directusCollection)}/${id}`;

    const res = await fetch(target, {
      method: "PATCH",
      headers: getDirectusHeaders(),
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update report" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const directusCollection = searchParams.get("directusCollection");
    const id = searchParams.get("id");

    if (!directusCollection || !id) {
      return NextResponse.json({ error: "directusCollection and id are required for DELETE" }, { status: 400 });
    }

    const target = `${DIRECTUS_BASE}/items/${encodeURIComponent(directusCollection)}/${id}`;

    const res = await fetch(target, {
      method: "DELETE",
      headers: getDirectusHeaders(),
    });

    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete report" }, { status: 500 });
  }
}
