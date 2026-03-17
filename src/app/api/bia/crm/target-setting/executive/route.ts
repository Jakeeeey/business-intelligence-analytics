import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Use the user-provided env var, or fallback
const UPSTREAM_BASE = process.env.UPSTREAM_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

function buildUpstreamUrl(req: NextRequest, subpath: string) {
  const upstream = (UPSTREAM_BASE || "").replace(/\/+$/, "");
  const url = new URL(`${upstream}/${subpath}`);
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.append(k, v));
  return url;
}

function withCors(res: NextResponse, req: NextRequest) {
  const origin = req.headers.get("origin") || "*";
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Vary", "Origin");
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

function pickForwardHeaders(req: NextRequest) {
  const headers = new Headers();
  const ct = req.headers.get("content-type");
  if (ct) headers.set("content-type", ct);
  const auth = req.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  return headers;
}

async function proxy(req: NextRequest) {
  const scope = req.nextUrl.searchParams.get("scope");

  // Map this route to the Directus item
  let DIRECTUS_COLLECTION = "items/target_setting_executive";
  if (scope === "division") {
    DIRECTUS_COLLECTION = "items/target_setting_division";
  } else if (scope === "supervisor") {
    DIRECTUS_COLLECTION = "items/target_setting_supervisor";
  } else if (scope === "supplier") {
    DIRECTUS_COLLECTION = "items/target_setting_supplier";
  } else if (scope === "salesman") {
    DIRECTUS_COLLECTION = "items/target_setting_salesman";
  }

  // Remove scope from params to avoid sending it to Directus
  req.nextUrl.searchParams.delete("scope");

  // If we had dynamic segments like [id], we'd need to parse them from context.
  // But here we are at /api/bia/crm/target-setting/executive
  // To handle /api/bia/crm/target-setting/executive/123 (ID updates), we need to check the pathname
  // The route file is `src/app/api/bia/crm/target-setting/executive/route.ts`.
  // This typically handles `/api/bia/crm/target-setting/executive`.
  // It does NOT handle `/api/bia/crm/target-setting/executive/123`.
  // To handle IDs, we need a dynamic route `[...ids]` or `[id]` folder.
  // OR we use search params? But REST usually uses ID in path.
  // The Generic Proxy handled this with `[...path]`.
  // Since I am making a specific route file, if I want to support ID, I need `route.ts` in `executive/[id]` too?
  // OR I can make this file `executive/[[...path]]/route.ts`?
  // The user specified `src\app\api\bia\target-setting\executive\route.ts`.
  // If I only put it there, I cannot PATCH `/executive/123` unless I used query params for ID or something non-standard.
  // WAIT. `fetchProvider.ts` uses PATCH `/items/target_setting_executive/${id}`.
  // If I change fetchProvider to `/api/bia/crm/target-setting/executive/${id}`, checking `route.ts` here won't work for that path.

  // To support this strictly as requested, I should make `executive` a folder with `route.ts` (for list/create) AND `[id]/route.ts` (for item ops).
  // OR use `[...slug]` to catch all.
  // "create proxy server on .../executive/route.ts" might imply "route.ts" inside the executive folder. 
  // Next.js App Router: `route.ts` handles the exact path match.
  // It doesn't capture subpaths automatically unless it's a dynamic segment.

  // I will assume for now I need to handle list/create here.
  // For update (PATCH /id), I need `[id]/route.ts`.
  // I'll create `src/app/api/bia/crm/target-setting/executive/[id]/route.ts` as well.

  if (!UPSTREAM_BASE) {
    return NextResponse.json({ error: "Configuration Error: No Upstream URL" }, { status: 500 });
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
    const headers = new Headers(upstreamRes.headers);
    // Ensure we don't pass encoding that might confuse invalidation
    headers.delete("content-encoding");
    headers.delete("content-length");

    return new NextResponse(data, {
      status: upstreamRes.status,
      headers: {
        "content-type": headers.get("content-type") || "application/json",
        ...Object.fromEntries(headers)
      }
    });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 502 });
  }
}

export async function GET(req: NextRequest) { return proxy(req); }
export async function POST(req: NextRequest) { return proxy(req); }
export async function OPTIONS(req: NextRequest) {
  const res = new NextResponse(null, { status: 204 });
  return withCors(res, req);
}
