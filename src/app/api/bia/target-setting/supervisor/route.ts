import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPSTREAM = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
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
    return NextResponse.json({ error: "NEXT_PUBLIC_API_BASE_URL is not set" }, { status: 500 });
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

  if (!res.ok) return { ok: false as const, status: res.status, json, url };
  return { ok: true as const, status: res.status, json, url };
}

async function proxy(req: NextRequest, path: string, method: string, body?: any) {
  const missing = requireUpstream();
  if (missing) return missing;

  const url = new URL(`${UPSTREAM}${path}`);
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
      { error: "Upstream request failed", upstream_status: r.status, upstream_body: r.json, upstream_url: r.url },
      { status: r.status }
    );
  }

  return NextResponse.json(r.json, { status: 200 });
}

/* ---------- resolve ts_supervisor_id (relation id) ---------- */
const SUPERVISOR_USER_FIELD = "supervisor_user_id"; // change if needed

async function resolveTsSupervisorId(params: { userId: string; fiscalPeriod: string }) {
  const url = new URL(`${UPSTREAM}/items/target_setting_supervisor`);
  url.searchParams.set("limit", "-1");
  url.searchParams.set("fields", `id,${SUPERVISOR_USER_FIELD},fiscal_period`);
  url.searchParams.set(`filter[${SUPERVISOR_USER_FIELD}][_eq]`, params.userId);
  url.searchParams.set("filter[fiscal_period][_eq]", params.fiscalPeriod);
  url.searchParams.set("sort", "-id");

  const r = await upstreamJson(url.toString());
  if (!r.ok) {
    return {
      ok: false as const,
      status: r.status,
      error: { error: "Upstream request failed", upstream_status: r.status, upstream_body: r.json, upstream_url: r.url },
    };
  }

  const hit = (r.json?.data ?? [])?.[0];
  if (!hit?.id) {
    return {
      ok: false as const,
      status: 400,
      error: {
        error: "Missing supervisor target",
        message:
          "No matching target_setting_supervisor record found for this user and fiscal period. Create the supervisor target first.",
        details: { user_id: params.userId, fiscal_period: params.fiscalPeriod },
      },
    };
  }

  return { ok: true as const, id: Number(hit.id) };
}

/* ---------- SERVER GUARD: cannot exceed supplier target ---------- */
function toNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function getSupplierTargetAmount(params: { fiscalPeriod: string; supplierId: number }) {
  const url = new URL(`${UPSTREAM}/items/target_setting_supplier`);
  url.searchParams.set("limit", "-1");
  url.searchParams.set("fields", "id,fiscal_period,supplier_id,target_amount");
  url.searchParams.set("filter[fiscal_period][_eq]", params.fiscalPeriod);
  url.searchParams.set("filter[supplier_id][_eq]", String(params.supplierId));
  url.searchParams.set("sort", "-id");

  const r = await upstreamJson(url.toString());
  if (!r.ok) return { ok: false as const, status: r.status, error: r };
  const hit = (r.json?.data ?? [])?.[0];
  return { ok: true as const, amount: toNum(hit?.target_amount ?? 0) };
}

async function getExistingAllocations(params: { fiscalPeriod: string; supplierId: number }) {
  const url = new URL(`${UPSTREAM}/items/target_setting_salesman`);
  url.searchParams.set("limit", "-1");
  url.searchParams.set("fields", "id,target_amount,fiscal_period,supplier_id");
  url.searchParams.set("filter[fiscal_period][_eq]", params.fiscalPeriod);
  url.searchParams.set("filter[supplier_id][_eq]", String(params.supplierId));

  const r = await upstreamJson(url.toString());
  if (!r.ok) return { ok: false as const, status: r.status, error: r };
  return { ok: true as const, rows: (r.json?.data ?? []) as any[] };
}

async function enforceNotExceedSupplierTarget(args: {
  fiscalPeriod: string;
  supplierId: number;
  newAmount: number;
  editingId?: number | null;
}) {
  const targetRes = await getSupplierTargetAmount({ fiscalPeriod: args.fiscalPeriod, supplierId: args.supplierId });
  if (!targetRes.ok) {
    return NextResponse.json(
      {
        error: "Unable to validate supplier target",
        upstream_status: targetRes.status,
        upstream_body: targetRes.error.json,
        upstream_url: targetRes.error.url,
      },
      { status: targetRes.status }
    );
  }

  const supplierTarget = targetRes.amount;
  if (supplierTarget <= 0 && args.newAmount > 0) {
    return NextResponse.json(
      { error: "Supplier target missing", message: "Supplier target is missing or zero. Set supplier target first." },
      { status: 400 }
    );
  }

  const allocRes = await getExistingAllocations({ fiscalPeriod: args.fiscalPeriod, supplierId: args.supplierId });
  if (!allocRes.ok) {
    return NextResponse.json(
      {
        error: "Unable to validate allocations",
        upstream_status: allocRes.status,
        upstream_body: allocRes.error.json,
        upstream_url: allocRes.error.url,
      },
      { status: allocRes.status }
    );
  }

  const otherAllocated = allocRes.rows.reduce((sum, r) => {
    if (args.editingId && Number(r.id) === Number(args.editingId)) return sum;
    return sum + toNum(r.target_amount);
  }, 0);

  const newTotal = otherAllocated + args.newAmount;
  if (newTotal > supplierTarget) {
    const remaining = supplierTarget - otherAllocated;
    return NextResponse.json(
      {
        error: "Allocation exceeds supplier target",
        message: `Cannot exceed Supplier Target. Remaining available is ₱${remaining.toLocaleString("en-PH")}.`,
        details: {
          supplier_target: supplierTarget,
          allocated_excluding_current: otherAllocated,
          attempted_amount: args.newAmount,
          attempted_total: newTotal,
        },
      },
      { status: 400 }
    );
  }

  return null;
}

/* ---------- Salesmen by supervisor (existing) ---------- */
async function handleSalesmenBySupervisor(req: NextRequest) {
  const token = req.cookies.get("vos_access_token")?.value ?? null;
  const sub = getJwtSub(token);
  if (!sub) return NextResponse.json({ data: [] }, { status: 200 });

  const spdUrl = new URL(`${UPSTREAM}/items/supervisor_per_division`);
  spdUrl.searchParams.set("limit", "-1");
  spdUrl.searchParams.set("fields", "id,supervisor_id");
  spdUrl.searchParams.set("filter[supervisor_id][_eq]", sub);

  const spdRes = await upstreamJson(spdUrl.toString());
  if (!spdRes.ok) {
    return NextResponse.json(
      { error: "Upstream request failed", upstream_status: spdRes.status, upstream_body: spdRes.json, upstream_url: spdRes.url },
      { status: spdRes.status }
    );
  }

  const spdIds = Array.from(new Set((spdRes.json?.data ?? []).map((r: any) => Number(r.id)).filter(Boolean)));
  if (!spdIds.length) return NextResponse.json({ data: [] }, { status: 200 });

  const spsUrl = new URL(`${UPSTREAM}/items/salesman_per_supervisor`);
  spsUrl.searchParams.set("limit", "-1");
  spsUrl.searchParams.set("fields", "salesman_id,supervisor_per_division_id,is_deleted");
  spsUrl.searchParams.set("filter[is_deleted][_eq]", "0");
  spsUrl.searchParams.set("filter[supervisor_per_division_id][_in]", spdIds.join(","));

  const spsRes = await upstreamJson(spsUrl.toString());
  if (!spsRes.ok) {
    return NextResponse.json(
      { error: "Upstream request failed", upstream_status: spsRes.status, upstream_body: spsRes.json, upstream_url: spsRes.url },
      { status: spsRes.status }
    );
  }

  const salesmanIds = Array.from(new Set((spsRes.json?.data ?? []).map((r: any) => Number(r.salesman_id)).filter(Boolean)));
  if (!salesmanIds.length) return NextResponse.json({ data: [] }, { status: 200 });

  const smUrl = new URL(`${UPSTREAM}/items/salesman`);
  smUrl.searchParams.set("limit", "-1");
  smUrl.searchParams.set("filter[id][_in]", salesmanIds.join(","));
  smUrl.searchParams.set("fields", "id,salesman_name,salesman_code,isActive,division_id");

  const smRes = await upstreamJson(smUrl.toString());
  if (!smRes.ok) {
    return NextResponse.json(
      { error: "Upstream request failed", upstream_status: smRes.status, upstream_body: smRes.json, upstream_url: smRes.url },
      { status: smRes.status }
    );
  }

  const data = (smRes.json?.data ?? []) as any[];
  data.sort((a, b) => String(a?.salesman_name ?? "").localeCompare(String(b?.salesman_name ?? "")));
  return NextResponse.json({ data }, { status: 200 });
}

/* ---------- Suppliers by supervisor (NEW) ---------- */
async function handleSupervisorSuppliers(req: NextRequest) {
  const token = req.cookies.get("vos_access_token")?.value ?? null;
  const sub = getJwtSub(token);
  if (!sub) return NextResponse.json({ data: [] }, { status: 200 });

  // 1. Get assignments from target_setting_supervisor
  const tssUrl = new URL(`${UPSTREAM}/items/target_setting_supervisor`);
  tssUrl.searchParams.set("limit", "-1");
  tssUrl.searchParams.set("fields", "id,tss_id");
  tssUrl.searchParams.set("filter[supervisor_user_id][_eq]", sub);
  tssUrl.searchParams.set("filter[status][_neq]", "ARCHIVED"); // optional safety

  const tssRes = await upstreamJson(tssUrl.toString());
  if (!tssRes.ok) {
    return NextResponse.json(
      { error: "Upstream request failed", upstream_status: tssRes.status, upstream_body: tssRes.json, upstream_url: tssRes.url },
      { status: tssRes.status }
    );
  }

  // 2. Extract Supplier Allocation IDs (tss_id points to target_setting_supplier.id)
  const supplierAllocationIds = Array.from(new Set((tssRes.json?.data ?? []).map((r: any) => Number(r.tss_id)).filter((n: number) => Number.isFinite(n) && n > 0)));

  if (!supplierAllocationIds.length) {
    return NextResponse.json({ data: [] }, { status: 200 });
  }

  // 3. Fetch target_setting_supplier records
  const tsSupplierUrl = new URL(`${UPSTREAM}/items/target_setting_supplier`);
  tsSupplierUrl.searchParams.set("limit", "-1");
  tsSupplierUrl.searchParams.set("filter[id][_in]", supplierAllocationIds.join(","));

  const tsSupplierRes = await upstreamJson(tsSupplierUrl.toString());
  if (!tsSupplierRes.ok) {
    return NextResponse.json(
      { error: "Upstream request failed", upstream_status: tsSupplierRes.status, upstream_body: tsSupplierRes.json, upstream_url: tsSupplierUrl.toString() },
      { status: tsSupplierRes.status }
    );
  }

  return NextResponse.json({ data: tsSupplierRes.json?.data ?? [] }, { status: 200 });
}

/* ---------------- ROUTES ---------------- */
export async function GET(req: NextRequest) {
  const missing = requireUpstream();
  if (missing) return missing;

  const resource = req.nextUrl.searchParams.get("resource") || "";
  const id = req.nextUrl.searchParams.get("id");

  if (resource === "salesmen") return handleSalesmenBySupervisor(req);

  if (resource === "suppliers") return proxy(req, `/items/suppliers`, "GET");
  if (resource === "ts_supplier") return handleSupervisorSuppliers(req);
  if (resource === "allocations") return proxy(req, `/items/target_setting_salesman`, "GET");

  // ✅ NEW: divisions master list (for mapping division_id -> division_name)
  if (resource === "divisions") return proxy(req, `/items/division`, "GET");

  // ✅ resources for hierarchy log
  if (resource === "ts_executive") return proxy(req, `/items/target_setting_executive`, "GET");
  if (resource === "ts_supplier_by_tsd") return proxy(req, `/items/target_setting_supplier`, "GET");
  if (resource === "ts_division") {
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    return proxy(req, `/items/target_setting_division/${encodeURIComponent(id)}`, "GET");
  }

  return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const resource = req.nextUrl.searchParams.get("resource") || "";
  if (resource !== "allocations") return NextResponse.json({ error: "Unknown resource" }, { status: 400 });

  const token = req.cookies.get("vos_access_token")?.value ?? null;
  const sub = getJwtSub(token);
  if (!sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (!body?.fiscal_period) return NextResponse.json({ error: "Fiscal period is required." }, { status: 400 });
  if (body?.supplier_id == null) return NextResponse.json({ error: "Supplier is required." }, { status: 400 });
  if (body?.target_amount == null) return NextResponse.json({ error: "Target amount is required." }, { status: 400 });

  const guard = await enforceNotExceedSupplierTarget({
    fiscalPeriod: String(body.fiscal_period),
    supplierId: Number(body.supplier_id),
    newAmount: toNum(body.target_amount),
  });
  if (guard) return guard;

  const resolved = await resolveTsSupervisorId({ userId: sub, fiscalPeriod: String(body.fiscal_period) });
  if (!resolved.ok) return NextResponse.json(resolved.error, { status: resolved.status });

  const payload = { ...body, ts_supervisor_id: resolved.id };
  return proxy(req, `/items/target_setting_salesman`, "POST", payload);
}

export async function PATCH(req: NextRequest) {
  const resource = req.nextUrl.searchParams.get("resource") || "";
  const id = req.nextUrl.searchParams.get("id");
  if (resource !== "allocations" || !id) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const token = req.cookies.get("vos_access_token")?.value ?? null;
  const sub = getJwtSub(token);
  if (!sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (!body?.fiscal_period) return NextResponse.json({ error: "Fiscal period is required for update." }, { status: 400 });
  if (body?.supplier_id == null) return NextResponse.json({ error: "Supplier is required for update." }, { status: 400 });
  if (body?.target_amount == null) return NextResponse.json({ error: "Target amount is required for update." }, { status: 400 });

  const guard = await enforceNotExceedSupplierTarget({
    fiscalPeriod: String(body.fiscal_period),
    supplierId: Number(body.supplier_id),
    newAmount: toNum(body.target_amount),
    editingId: Number(id),
  });
  if (guard) return guard;

  const resolved = await resolveTsSupervisorId({ userId: sub, fiscalPeriod: String(body.fiscal_period) });
  if (!resolved.ok) return NextResponse.json(resolved.error, { status: resolved.status });

  const payload = { ...body, ts_supervisor_id: resolved.id };
  return proxy(req, `/items/target_setting_salesman/${encodeURIComponent(id)}`, "PATCH", payload);
}

export async function DELETE(req: NextRequest) {
  const resource = req.nextUrl.searchParams.get("resource") || "";
  const id = req.nextUrl.searchParams.get("id");
  if (resource !== "allocations" || !id) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  return proxy(req, `/items/target_setting_salesman/${encodeURIComponent(id)}`, "DELETE");
}
