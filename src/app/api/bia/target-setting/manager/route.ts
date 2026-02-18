// src/app/api/bia/target-setting/manager/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIRECTUS_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || "";

function requireEnv() {
  if (!DIRECTUS_BASE) return "NEXT_PUBLIC_API_BASE_URL is not set";
  if (!DIRECTUS_TOKEN) return "DIRECTUS_STATIC_TOKEN is not set";
  return null;
}

function directusHeaders(extra?: Record<string, string>) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${DIRECTUS_TOKEN}`,
    ...(extra ?? {}),
  };
}

async function fetchDirectus<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${DIRECTUS_BASE}${path}`;
  const res = await fetch(url, { cache: "no-store", headers: directusHeaders(), ...(init ?? {}) });

  const text = await res.text().catch(() => "");
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }

  if (!res.ok) {
    const msg =
      json?.errors?.[0]?.message ||
      json?.error ||
      json?.message ||
      text ||
      `Upstream failed (${res.status})`;
    throw new Error(msg);
  }

  return json as T;
}

function normalizeStatus(v: any) {
  const s = String(v ?? "").trim().toUpperCase();
  const allowed = new Set(["DRAFT", "SUBMITTED", "PENDING", "APPROVED", "REJECTED", "SET"]);
  return (allowed.has(s) ? s : "SET") as any;
}

function dateOnly(v: any) {
  const s = String(v ?? "").trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

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
    const n = Number(sub);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}
/* ---------------------------------------------------------- */

async function resolveExecutiveContextByTsdId(tsd_id: number) {
  const divRes = await fetchDirectus<{ data: any[] }>(
    `/items/target_setting_division?filter[id][_eq]=${encodeURIComponent(String(tsd_id))}&limit=1`,
  );
  const div = divRes.data?.[0];
  if (!div) throw new Error("Division target (target_setting_division) not found.");

  const tse_id = Number(div.tse_id);
  if (!tse_id) throw new Error("Missing tse_id on target_setting_division.");

  const execRes = await fetchDirectus<{ data: any[] }>(
    `/items/target_setting_executive?filter[id][_eq]=${encodeURIComponent(String(tse_id))}&limit=1`,
  );
  const exec = execRes.data?.[0];
  if (!exec) throw new Error("Executive target (target_setting_executive) not found.");

  return {
    exec,
    tse_id,
    fiscal_period: dateOnly(exec.fiscal_period),
    status: normalizeStatus(exec.status),
  };
}

async function findSupervisorRowsByTssId(tss_id: number) {
  const q =
    `/items/target_setting_supervisor?limit=-1` +
    `&filter[tss_id][_eq]=${encodeURIComponent(String(tss_id))}`;
  const r = await fetchDirectus<{ data: any[] }>(q);
  return r.data ?? [];
}

async function upsertSupervisorRow(args: {
  tss_id: number;
  target_amount: number;
  fiscal_period: string | null;
  status: string;
  supervisor_user_id?: number | null;
}) {
  const existing = await findSupervisorRowsByTssId(args.tss_id);

  const payload: any = {
    tss_id: args.tss_id,
    target_amount: args.target_amount,
    fiscal_period: args.fiscal_period,
    status: args.status,
  };

  if (typeof args.supervisor_user_id !== "undefined") {
    payload.supervisor_user_id = args.supervisor_user_id;
  }

  if (existing.length > 0) {
    const id = existing[0].id;
    await fetchDirectus(`/items/target_setting_supervisor/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return { id, mode: "update" as const };
  }

  const created = await fetchDirectus<{ data: any }>(`/items/target_setting_supervisor`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return { id: created?.data?.id ?? null, mode: "create" as const };
}

export async function GET(req: NextRequest) {
  try {
    const envErr = requireEnv();
    if (envErr) return NextResponse.json({ error: envErr }, { status: 500 });

    // ✅ Logged-in user id from cookie JWT
    const token = req.cookies.get("vos_access_token")?.value ?? null;
    const current_user_id = getJwtSub(token);

    const [
      exec,
      div,
      supp,
      supv,
      divisions,
      suppliers,
      users,
      supervisorPerDivision,
      divisionSalesHead,
    ] = await Promise.all([
      fetchDirectus<{ data: any[] }>(`/items/target_setting_executive?limit=-1`),
      fetchDirectus<{ data: any[] }>(`/items/target_setting_division?limit=-1`),
      fetchDirectus<{ data: any[] }>(`/items/target_setting_supplier?limit=-1`),
      fetchDirectus<{ data: any[] }>(`/items/target_setting_supervisor?limit=-1`),
      fetchDirectus<{ data: any[] }>(`/items/division?limit=-1`),
      fetchDirectus<{ data: any[] }>(`/items/suppliers?limit=-1`),
      fetchDirectus<{ data: any[] }>(`/items/user?limit=-1`),

      // ✅ new
      fetchDirectus<{ data: any[] }>(`/items/supervisor_per_division?limit=-1`),

      // ✅ Manager division mapping
      fetchDirectus<{ data: any[] }>(`/items/division_sales_head?limit=-1`),
    ]);

    return NextResponse.json({
      current_user_id, // ✅ add this so frontend can filter by the real logged-in user

      target_setting_executive: exec.data ?? [],
      target_setting_division: div.data ?? [],
      target_setting_supplier: supp.data ?? [],
      target_setting_supervisor: supv.data ?? [],
      division: divisions.data ?? [],
      suppliers: suppliers.data ?? [],
      users: users.data ?? [],

      supervisor_per_division: supervisorPerDivision.data ?? [],
      division_sales_head: divisionSalesHead.data ?? [],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to load manager targets." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const envErr = requireEnv();
    if (envErr) return NextResponse.json({ error: envErr }, { status: 500 });

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "").toUpperCase();
    if (action !== "UPSERT_SUPPLIER") return NextResponse.json({ error: "Invalid action." }, { status: 400 });

    const tsd_id = Number(body.tsd_id);
    const supplier_id = Number(body.supplier_id);
    const target_amount = Number(body.target_amount);

    const supervisor_user_id =
      body.supervisor_user_id === null || typeof body.supervisor_user_id === "undefined"
        ? null
        : Number(body.supervisor_user_id);

    if (!tsd_id || !supplier_id || !Number.isFinite(target_amount) || target_amount <= 0) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    if (!supervisor_user_id || !Number.isFinite(supervisor_user_id)) {
      return NextResponse.json({ error: "Please select Supervisor." }, { status: 400 });
    }

    const ctx = await resolveExecutiveContextByTsdId(tsd_id);

    const supplierPayload = {
      tsd_id,
      supplier_id,
      target_amount,
      fiscal_period: ctx.fiscal_period,
      status: ctx.status,
    };

    if (ctx.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Cannot create allocation because the Division Target is already approved, set, or rejected." },
        { status: 403 },
      );
    }

    // Always create a new target_setting_supplier row (1 supplier → many supervisors)
    const created = await fetchDirectus<{ data: any }>(`/items/target_setting_supplier`, {
      method: "POST",
      body: JSON.stringify(supplierPayload),
    });
    const tssId = Number(created?.data?.id);

    // Always create a new target_setting_supervisor row linked to this allocation
    await fetchDirectus(`/items/target_setting_supervisor`, {
      method: "POST",
      body: JSON.stringify({
        tss_id: tssId,
        target_amount,
        fiscal_period: ctx.fiscal_period,
        status: ctx.status,
        supervisor_user_id,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to save allocation." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const envErr = requireEnv();
    if (envErr) return NextResponse.json({ error: envErr }, { status: 500 });

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "").toUpperCase();
    if (action !== "UPDATE_SUPPLIER") return NextResponse.json({ error: "Invalid action." }, { status: 400 });

    const id = Number(body.id);
    const target_amount = Number(body.target_amount);
    const supervisor_user_id =
      body.supervisor_user_id === null || typeof body.supervisor_user_id === "undefined"
        ? undefined
        : Number(body.supervisor_user_id);

    if (!id || !Number.isFinite(target_amount) || target_amount <= 0) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const tssRes = await fetchDirectus<{ data: any[] }>(
      `/items/target_setting_supplier?filter[id][_eq]=${encodeURIComponent(String(id))}&limit=1`,
    );
    const tss = tssRes.data?.[0];
    if (!tss) return NextResponse.json({ error: "Supplier allocation not found." }, { status: 404 });

    const tsd_id = Number(tss.tsd_id);
    const ctx = await resolveExecutiveContextByTsdId(tsd_id);

    if (ctx.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Cannot update target unless it is in DRAFT status." },
        { status: 403 },
      );
    }

    await fetchDirectus(`/items/target_setting_supplier/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        target_amount,
        fiscal_period: ctx.fiscal_period,
        status: ctx.status,
      }),
    });

    await upsertSupervisorRow({
      tss_id: id,
      target_amount,
      fiscal_period: ctx.fiscal_period,
      status: ctx.status,
      supervisor_user_id,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to update allocation." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const envErr = requireEnv();
    if (envErr) return NextResponse.json({ error: envErr }, { status: 500 });

    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

    const tssRes = await fetchDirectus<{ data: any[] }>(
      `/items/target_setting_supplier?filter[id][_eq]=${encodeURIComponent(String(id))}&limit=1`,
    );
    const tss = tssRes.data?.[0];
    if (!tss) return NextResponse.json({ error: "Allocator not found." }, { status: 404 });

    const status = normalizeStatus(tss.status);
    if (status !== "DRAFT") {
      return NextResponse.json(
        { error: "Cannot delete target unless it is in DRAFT status." },
        { status: 403 },
      );
    }

    const supRows = await findSupervisorRowsByTssId(id);
    for (const r of supRows) {
      // Cascade delete: remove salesman allocations linked to this supervisor target
      const childRes = await fetchDirectus<{ data: any[] }>(
        `/items/target_setting_salesman?filter[ts_supervisor_id][_eq]=${r.id}&fields=id`,
      );
      const childIds = (childRes.data ?? []).map((c) => c.id);

      if (childIds.length > 0) {
        await fetchDirectus(`/items/target_setting_salesman`, {
          method: "DELETE",
          body: JSON.stringify(childIds),
        });
      }

      await fetchDirectus(`/items/target_setting_supervisor/${r.id}`, { method: "DELETE" });
    }

    await fetchDirectus(`/items/target_setting_supplier/${id}`, { method: "DELETE" });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to delete allocation." }, { status: 500 });
  }
}
