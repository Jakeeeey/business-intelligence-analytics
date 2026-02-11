import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIRECTUS_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || process.env.DIRECTUS_SERVICE_TOKEN || "";

function requireEnv() {
  if (!DIRECTUS_BASE) return "NEXT_PUBLIC_API_BASE_URL is not set";
  if (!DIRECTUS_TOKEN) return "DIRECTUS_STATIC_TOKEN (or DIRECTUS_SERVICE_TOKEN) is not set";
  return null;
}

function directusHeaders(extra?: Record<string, string>) {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extra ?? {}),
  };
  if (DIRECTUS_TOKEN) h.Authorization = `Bearer ${DIRECTUS_TOKEN}`;
  return h;
}

async function fetchDirectusRaw(path: string, init?: RequestInit) {
  const url = `${DIRECTUS_BASE}${path}`;
  const res = await fetch(url, { cache: "no-store", headers: directusHeaders(), ...(init ?? {}) });

  const text = await res.text().catch(() => "");
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    return {
      ok: false as const,
      status: res.status,
      bodyText: text,
      bodyJson: json,
      url,
    };
  }

  return { ok: true as const, status: res.status, json, url };
}

function getAuthedUserIdMaybe(): number | null {
  const _c = cookies();
  void _c;
  return null;
}

// ✅ Helpers for backend enforcement
async function getDivisionTargetAmount(tsd_id: number): Promise<number> {
  const res = await fetchDirectusRaw(`/items/target_setting_division/${tsd_id}?fields=id,target_amount`);
  if (!res.ok) throw new Error("Failed to read division target.");
  return Number(res.json?.data?.target_amount ?? 0);
}

async function listSupplierAllocationsForDivision(tsd_id: number): Promise<Array<{ id: number; target_amount: number }>> {
  const res = await fetchDirectusRaw(
    `/items/target_setting_supplier?limit=-1&fields=id,target_amount&filter[tsd_id][_eq]=${encodeURIComponent(String(tsd_id))}`,
  );
  if (!res.ok) throw new Error("Failed to read supplier allocations.");
  const data = res.json?.data ?? [];
  return (data as any[]).map((x) => ({ id: Number(x.id), target_amount: Number(x.target_amount) || 0 }));
}

function sumAllocations(rows: Array<{ id: number; target_amount: number }>) {
  return rows.reduce((s, r) => s + (Number(r.target_amount) || 0), 0);
}

/**
 * GET: returns raw datasets (NO VIEW TABLES) so frontend can JOIN.
 */
export async function GET() {
  const envErr = requireEnv();
  if (envErr) return NextResponse.json({ error: envErr }, { status: 500 });

  const paths = {
    executive: "/items/target_setting_executive?limit=-1",
    divisionTargets: "/items/target_setting_division?limit=-1",
    supplierTargets: "/items/target_setting_supplier?limit=-1",
    divisions: "/items/division?limit=-1",
    suppliers: "/items/suppliers?limit=-1",
  };

  const [a, b, c, d, e] = await Promise.all([
    fetchDirectusRaw(paths.executive),
    fetchDirectusRaw(paths.divisionTargets),
    fetchDirectusRaw(paths.supplierTargets),
    fetchDirectusRaw(paths.divisions),
    fetchDirectusRaw(paths.suppliers),
  ]);

  const failures = [a, b, c, d, e].filter((x) => !x.ok) as Array<any>;
  if (failures.length) {
    const first = failures[0];
    return NextResponse.json(
      {
        error: "Upstream request failed",
        details: {
          upstream_status: first.status,
          upstream_url: first.url,
          upstream_body: first.bodyJson ?? first.bodyText ?? "",
        },
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      target_setting_executive: (a as any).json?.data ?? [],
      target_setting_division: (b as any).json?.data ?? [],
      target_setting_supplier: (c as any).json?.data ?? [],
      division: (d as any).json?.data ?? [],
      suppliers: (e as any).json?.data ?? [],
    },
  });
}

/**
 * POST: Create supplier allocation
 * body: { tsd_id, supplier_id, target_amount }
 */
export async function POST(req: NextRequest) {
  const envErr = requireEnv();
  if (envErr) return NextResponse.json({ error: envErr }, { status: 500 });

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const tsd_id = Number(body?.tsd_id);
  const supplier_id = Number(body?.supplier_id);
  const target_amount = Number(body?.target_amount);

  if (!tsd_id || !supplier_id || !Number.isFinite(target_amount) || target_amount <= 0) {
    return NextResponse.json(
      { error: "Invalid payload. Required: tsd_id, supplier_id, target_amount (> 0)." },
      { status: 400 },
    );
  }

  // ✅ BACKEND ENFORCEMENT: must not exceed division target remaining
  try {
    const divisionTarget = await getDivisionTargetAmount(tsd_id);
    const existing = await listSupplierAllocationsForDivision(tsd_id);
    const allocated = sumAllocations(existing);

    const remaining = divisionTarget - allocated;
    if (remaining <= 0) {
      return NextResponse.json({ error: "Remaining is 0. You cannot allocate more for this division." }, { status: 400 });
    }
    if (target_amount > remaining) {
      return NextResponse.json(
        { error: `Cannot allocate more than remaining (${remaining}).` },
        { status: 400 },
      );
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Validation failed." }, { status: 500 });
  }

  const created_by = getAuthedUserIdMaybe() ?? body?.created_by ?? null;

  const payload: Record<string, any> = {
    tsd_id,
    supplier_id,
    target_amount,
  };
  if (created_by != null) payload.created_by = Number(created_by);

  const up = await fetchDirectusRaw(`/items/target_setting_supplier`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!up.ok) {
    return NextResponse.json(
      {
        error: "Upstream request failed",
        details: { upstream_status: up.status, upstream_url: up.url, upstream_body: up.bodyJson ?? up.bodyText ?? "" },
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, data: up.json?.data ?? up.json });
}

/**
 * PATCH: Update supplier allocation
 * body: { id, target_amount }
 */
export async function PATCH(req: NextRequest) {
  const envErr = requireEnv();
  if (envErr) return NextResponse.json({ error: envErr }, { status: 500 });

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const id = Number(body?.id);
  const target_amount = Number(body?.target_amount);

  if (!id || !Number.isFinite(target_amount) || target_amount <= 0) {
    return NextResponse.json({ error: "Invalid payload. Required: id, target_amount (> 0)." }, { status: 400 });
  }

  // ✅ BACKEND ENFORCEMENT: update must not push total above division target
  try {
    const current = await fetchDirectusRaw(`/items/target_setting_supplier/${id}?fields=id,tsd_id,target_amount`);
    if (!current.ok) {
      return NextResponse.json({ error: "Failed to read current allocation." }, { status: 502 });
    }

    const tsd_id = Number(current.json?.data?.tsd_id);
    if (!tsd_id) return NextResponse.json({ error: "Invalid current allocation (missing tsd_id)." }, { status: 400 });

    const divisionTarget = await getDivisionTargetAmount(tsd_id);
    const existing = await listSupplierAllocationsForDivision(tsd_id);

    const allocatedWithoutThis = sumAllocations(existing.filter((x) => x.id !== id));
    const newTotal = allocatedWithoutThis + target_amount;

    if (newTotal > divisionTarget) {
      const remaining = divisionTarget - allocatedWithoutThis;
      return NextResponse.json(
        { error: `Increase exceeds remaining (${remaining}).` },
        { status: 400 },
      );
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Validation failed." }, { status: 500 });
  }

  const up = await fetchDirectusRaw(`/items/target_setting_supplier/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ target_amount }),
  });

  if (!up.ok) {
    return NextResponse.json(
      {
        error: "Upstream request failed",
        details: { upstream_status: up.status, upstream_url: up.url, upstream_body: up.bodyJson ?? up.bodyText ?? "" },
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, data: up.json?.data ?? up.json });
}

/**
 * DELETE: /api/bia/target-setting/manager?id=123
 */
export async function DELETE(req: NextRequest) {
  const envErr = requireEnv();
  if (envErr) return NextResponse.json({ error: envErr }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));

  if (!id) return NextResponse.json({ error: "Missing id query param." }, { status: 400 });

  const up = await fetchDirectusRaw(`/items/target_setting_supplier/${id}`, { method: "DELETE" });

  if (!up.ok) {
    return NextResponse.json(
      {
        error: "Upstream request failed",
        details: { upstream_status: up.status, upstream_url: up.url, upstream_body: up.bodyJson ?? up.bodyText ?? "" },
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
