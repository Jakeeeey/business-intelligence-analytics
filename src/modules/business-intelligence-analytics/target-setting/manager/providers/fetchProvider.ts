import type {
  CreateSupplierAllocationDto,
  ManagerBootstrapResponse,
  TargetSettingSupplier,
  UpdateSupplierAllocationDto,
} from "../types";

async function safeJson(res: Response) {
  const text = await res.text().catch(() => "");
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function toErrorMessage(payload: any, fallback: string) {
  // expected API error shape:
  // { error: "...", details: { upstream_body, upstream_status, upstream_url } }
  const msg = payload?.error || payload?.message || fallback;
  const upstream = payload?.details?.upstream_body;
  if (upstream?.errors?.[0]?.message) return upstream.errors[0].message;
  if (typeof upstream === "string" && upstream.trim()) return `${msg}: ${upstream}`;
  return msg;
}

export async function bootstrapManagerTargets(): Promise<ManagerBootstrapResponse> {
  const res = await fetch("/api/bia/target-setting/manager", { cache: "no-store" });
  const json = await safeJson(res);

  if (!res.ok) {
    throw new Error(toErrorMessage(json, "Failed to load target setting data."));
  }

  return (json?.data ?? {}) as ManagerBootstrapResponse;
}

export async function createSupplierAllocation(dto: CreateSupplierAllocationDto): Promise<TargetSettingSupplier> {
  const res = await fetch("/api/bia/target-setting/manager", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  const json = await safeJson(res);

  if (!res.ok) {
    throw new Error(toErrorMessage(json, "Failed to create supplier allocation."));
  }

  return (json?.data ?? json) as TargetSettingSupplier;
}

export async function updateSupplierAllocation(dto: UpdateSupplierAllocationDto): Promise<TargetSettingSupplier> {
  const res = await fetch("/api/bia/target-setting/manager", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  const json = await safeJson(res);

  if (!res.ok) {
    throw new Error(toErrorMessage(json, "Failed to update supplier allocation."));
  }

  return (json?.data ?? json) as TargetSettingSupplier;
}

export async function deleteSupplierAllocation(id: number): Promise<void> {
  const res = await fetch(`/api/bia/target-setting/manager?id=${encodeURIComponent(String(id))}`, { method: "DELETE" });
  const json = await safeJson(res);

  if (!res.ok) {
    throw new Error(toErrorMessage(json, "Failed to delete supplier allocation."));
  }
}
