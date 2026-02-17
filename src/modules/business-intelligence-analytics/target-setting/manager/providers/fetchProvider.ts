//src/modules/business-intelligence-analytics/target-setting/manager/providers/fetchProvider.ts
"use client";

import type { ManagerBootstrapResponse } from "../types";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { cache: "no-store", ...(init ?? {}) });
  const text = await res.text().catch(() => "");
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }

  if (!res.ok) {
    const msg =
      json?.error ||
      json?.message ||
      (typeof json === "string" ? json : null) ||
      text ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return (json as T) ?? ({} as T);
}

export async function bootstrapManagerTargets(): Promise<ManagerBootstrapResponse> {
  return api<ManagerBootstrapResponse>("/api/bia/target-setting/manager");
}

export async function createSupplierAllocation(payload: {
  tsd_id: number;
  supplier_id: number;
  target_amount: number;
  // optional for later when you add supervisor selection UI
  supervisor_user_id?: number | null;
}): Promise<{ ok: true }> {
  await api("/api/bia/target-setting/manager", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "UPSERT_SUPPLIER", ...payload }),
  });
  return { ok: true };
}

export async function updateSupplierAllocation(payload: {
  id: number; // tss id
  target_amount: number;
  supervisor_user_id?: number | null;
}): Promise<{ ok: true }> {
  await api("/api/bia/target-setting/manager", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "UPDATE_SUPPLIER", ...payload }),
  });
  return { ok: true };
}

export async function deleteSupplierAllocation(id: number): Promise<{ ok: true }> {
  await api(`/api/bia/target-setting/manager?id=${encodeURIComponent(String(id))}`, {
    method: "DELETE",
  });
  return { ok: true };
}
