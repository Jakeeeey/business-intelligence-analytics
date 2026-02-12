import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Upstream Directus
 * .env.local: NEXT_PUBLIC_API_BASE_URL=http://goatedcodoer:8056
 */
const UPSTREAM = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");

/**
 * Service token (Directus static token)
 * .env.local: DIRECTUS_STATIC_TOKEN=xxxx
 */
const STATIC_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || "";

/* ---------------- JWT decode (payload only) ---------------- */
function base64UrlDecode(input: string) {
  const pad = "=".repeat((4 - (input.length % 4)) % 4);
  const base64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf8");
}

function getJwtSub(token: string | null) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    const sub = payload?.sub;
    if (sub == null) return null;
    return String(sub);
  } catch {
    return null;
  }
}

/* ---------------- Upstream helpers ---------------- */
function requireUpstream() {
  if (!UPSTREAM) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_API_BASE_URL is not set" },
      { status: 500 }
    );
  }
  return null;
}

function authHeaders() {
  const h: Record<string, string> = {};
  if (STATIC_TOKEN) h.Authorization = `Bearer ${STATIC_TOKEN}`;
  return h;
}

async function upstreamJson(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { ...(init?.headers || {}), ...authHeaders() },
    cache: "no-store",
  });

  const text = await res.text().catch(() => "");
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  if (!res.ok) {
    return {
      ok: false as const,
      status: res.status,
      json,
      url,
    };
  }

  return {
    ok: true as const,
    status: res.status,
    json,
    url,
  };
}

async function proxy(req: NextRequest, path: string, method: string, body?: any) {
  const missing = requireUpstream();
  if (missing) return missing;

  const url = new URL(`${UPSTREAM}${path}`);

  // forward query params except our internal controls
  req.nextUrl.searchParams.forEach((v, k) => {
    if (k === "resource" || k === "id") return;
    url.searchParams.append(k, v);
  });

  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }

  const r = await upstreamJson(url.toString(), init);
  if (!r.ok) {
    return NextResponse.json(
      {
        error: "Upstream request failed",
        upstream_status: r.status,
        upstream_body: r.json,
        upstream_url: r.url,
      },
      { status: r.status }
    );
  }

  return NextResponse.json(r.json, { status: 200 });
}

/**
 * ✅ SALES MEN by supervisor (JWT.sub = user_id)
 * Join chain:
 *   sub(user_id)
 *   -> supervisor_per_division (filter[supervisor_id][_eq]=sub) => ids[]
 *   -> salesman_per_supervisor (filter[supervisor_per_division_id][_in]=ids, is_deleted=0) => salesmanIds[]
 *   -> salesman (filter[id][_in]=salesmanIds)
 */
async function handleSalesmenBySupervisor(req: NextRequest) {
  const missing = requireUpstream();
  if (missing) return missing;

  const token = req.cookies.get("vos_access_token")?.value ?? null;
  const sub = getJwtSub(token); // user_id

  if (!sub) {
    // no logged in user => empty
    return NextResponse.json({ data: [] }, { status: 200 });
  }

  // 1) supervisor_per_division rows for this user
  const spdUrl = new URL(`${UPSTREAM}/items/supervisor_per_division`);
  spdUrl.searchParams.set("limit", "-1");
  spdUrl.searchParams.set("fields", "id,supervisor_id");
  spdUrl.searchParams.set("filter[supervisor_id][_eq]", sub);

  const spdRes = await upstreamJson(spdUrl.toString());
  if (!spdRes.ok) {
    return NextResponse.json(
      {
        error: "Upstream request failed",
        upstream_status: spdRes.status,
        upstream_body: spdRes.json,
        upstream_url: spdRes.url,
      },
      { status: spdRes.status }
    );
  }

  const spdRows = (spdRes.json?.data ?? []) as Array<{ id: number }>;
  const spdIds = Array.from(new Set(spdRows.map((r) => Number(r.id)).filter(Boolean)));

  if (!spdIds.length) {
    // user is not a supervisor in any division => empty
    return NextResponse.json({ data: [] }, { status: 200 });
  }

  // 2) salesman_per_supervisor mappings for those supervisor_per_division IDs
  const spsUrl = new URL(`${UPSTREAM}/items/salesman_per_supervisor`);
  spsUrl.searchParams.set("limit", "-1");
  spsUrl.searchParams.set("fields", "id,salesman_id,supervisor_per_division_id,is_deleted");
  spsUrl.searchParams.set("filter[is_deleted][_eq]", "0");
  spsUrl.searchParams.set("filter[supervisor_per_division_id][_in]", spdIds.join(","));

  const spsRes = await upstreamJson(spsUrl.toString());
  if (!spsRes.ok) {
    return NextResponse.json(
      {
        error: "Upstream request failed",
        upstream_status: spsRes.status,
        upstream_body: spsRes.json,
        upstream_url: spsRes.url,
      },
      { status: spsRes.status }
    );
  }

  const spsRows = (spsRes.json?.data ?? []) as Array<{ salesman_id: number }>;
  const salesmanIds = Array.from(
    new Set(spsRows.map((r) => Number(r.salesman_id)).filter(Boolean))
  );

  if (!salesmanIds.length) {
    return NextResponse.json({ data: [] }, { status: 200 });
  }

  // 3) fetch salesman rows
  const smUrl = new URL(`${UPSTREAM}/items/salesman`);
  smUrl.searchParams.set("limit", "-1");
  smUrl.searchParams.set("filter[id][_in]", salesmanIds.join(","));
  smUrl.searchParams.set("fields", "id,salesman_name,salesman_code,isActive,division_id");

  const smRes = await upstreamJson(smUrl.toString());
  if (!smRes.ok) {
    return NextResponse.json(
      {
        error: "Upstream request failed",
        upstream_status: smRes.status,
        upstream_body: smRes.json,
        upstream_url: smRes.url,
      },
      { status: smRes.status }
    );
  }

  // Optional: stable sort by name
  const data = (smRes.json?.data ?? []) as Array<any>;
  data.sort((a, b) => String(a?.salesman_name ?? "").localeCompare(String(b?.salesman_name ?? "")));

  return NextResponse.json({ data }, { status: 200 });
}

/* ---------------- Routes ---------------- */
export async function GET(req: NextRequest) {
  const missing = requireUpstream();
  if (missing) return missing;

  const resource = req.nextUrl.searchParams.get("resource") || "";

  if (resource === "salesmen") {
    return handleSalesmenBySupervisor(req);
  }

  if (resource === "suppliers") {
    return proxy(req, `/items/suppliers`, "GET");
  }

  if (resource === "ts_supplier") {
    return proxy(req, `/items/target_setting_supplier`, "GET");
  }

  if (resource === "allocations") {
    return proxy(req, `/items/target_setting_salesman`, "GET");
  }

  return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const resource = req.nextUrl.searchParams.get("resource") || "";
  if (resource !== "allocations") {
    return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
  }
  const body = await req.json();
  return proxy(req, `/items/target_setting_salesman`, "POST", body);
}

export async function PATCH(req: NextRequest) {
  const resource = req.nextUrl.searchParams.get("resource") || "";
  const id = req.nextUrl.searchParams.get("id");
  if (resource !== "allocations" || !id) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const body = await req.json();
  return proxy(req, `/items/target_setting_salesman/${encodeURIComponent(id)}`, "PATCH", body);
}

export async function DELETE(req: NextRequest) {
  const resource = req.nextUrl.searchParams.get("resource") || "";
  const id = req.nextUrl.searchParams.get("id");
  if (resource !== "allocations" || !id) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  return proxy(req, `/items/target_setting_salesman/${encodeURIComponent(id)}`, "DELETE");
}
