import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const UPSTREAM_BASE = process.env.UPSTREAM_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

function buildUpstreamUrl(req: NextRequest, subpath: string) {
  const upstream = (UPSTREAM_BASE || "").replace(/\/+$/, "");
  const url = new URL(`${upstream}/${subpath}`);
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.append(k, v));
  return url;
}

function pickForwardHeaders(req: NextRequest) {
  const headers = new Headers();
  const ct = req.headers.get("content-type");
  if (ct) headers.set("content-type", ct);

  // Inject the static token for Directus metadata calls
  const staticToken = process.env.DIRECTUS_STATIC_TOKEN;
  const auth = req.headers.get("authorization");

  if (staticToken) {
    headers.set("authorization", `Bearer ${staticToken}`);
  } else if (auth) {
    headers.set("authorization", auth);
  }

  return headers;
}

async function proxy(req: NextRequest) {
  const DIRECTUS_COLLECTION = "items/suppliers";

  if (!UPSTREAM_BASE) {
    return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
  }

  const url = buildUpstreamUrl(req, DIRECTUS_COLLECTION);

  // Force optimization & strict filters for the dropdown
  url.searchParams.set("limit", "-1");
  url.searchParams.set("filter[isActive][_eq]", "1");
  url.searchParams.set("filter[nonBuy][_eq]", "0"); // <-- MUST be 0 to match your SQL View
  url.searchParams.set("sort", "supplier_name");
  url.searchParams.set("fields", "id,supplier_name");

  try {
    const method = req.method;
    const body = ["GET", "HEAD"].includes(method) ? undefined : await req.arrayBuffer();

    const upstreamRes = await fetch(url.toString(), {
      method,
      headers: pickForwardHeaders(req),
      body,
      cache: "no-store"
    });

    const data = await upstreamRes.arrayBuffer();
    return new NextResponse(data, {
      status: upstreamRes.status,
      headers: { "content-type": upstreamRes.headers.get("content-type") || "application/json" }
    });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 502 });
  }
}

export async function GET(req: NextRequest) { return proxy(req); }
export async function OPTIONS() { return new NextResponse(null, { status: 204 }); }