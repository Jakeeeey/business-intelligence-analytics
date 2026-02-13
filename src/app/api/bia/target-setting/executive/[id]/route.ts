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
  const auth = req.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  return headers;
}

async function proxy(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scope = req.nextUrl.searchParams.get("scope");

  let DIRECTUS_COLLECTION = `items/target_setting_executive/${id}`;
  if (scope === "division") {
    DIRECTUS_COLLECTION = `items/target_setting_division/${id}`;
  }

  // Remove scope
  req.nextUrl.searchParams.delete("scope");

  if (!UPSTREAM_BASE) {
    return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
  }

  const url = buildUpstreamUrl(req, DIRECTUS_COLLECTION);

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

export async function GET(req: NextRequest, context: any) { return proxy(req, context); }
export async function PATCH(req: NextRequest, context: any) { return proxy(req, context); }
export async function DELETE(req: NextRequest, context: any) { return proxy(req, context); }
export async function OPTIONS(req: NextRequest) { return new NextResponse(null, { status: 204 }); }
