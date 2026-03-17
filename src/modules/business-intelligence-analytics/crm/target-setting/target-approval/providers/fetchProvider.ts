import type {
  TargetSettingExecutive,
  SubmitApprovalDTO,
  TargetApprover,
} from "../types";

const PROXY_BASE = "/api/bia/crm/target-setting/target-approval";

/**
 * Local request helper — uses native fetch against our own Next.js API routes.
 * Authentication is handled server-side via cookies; no client token needed.
 */
async function request<T>(method: string, endpoint: string, body?: Record<string, unknown>): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const res = await fetch(endpoint, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
  }

  if (res.status === 204) return {} as T;
  const json = await res.json();
  return (json.data !== undefined ? json.data : json) as T;
}

export async function checkApproverStatus(): Promise<{ isApprover: boolean; approver: TargetApprover | null }> {
  try {
    const params = new URLSearchParams({ path: "auth/check" });
    return await request<{ isApprover: boolean; approver: TargetApprover | null }>("GET", `${PROXY_BASE}?${params.toString()}`);
  } catch {
    return { isApprover: false, approver: null };
  }
}

export async function getExecutiveTargetByPeriod(period: string): Promise<TargetSettingExecutive | null> {
  const params = new URLSearchParams({ path: "executive", period });
  const res = await fetch(`${PROXY_BASE}?${params.toString()}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  return json?.data?.[0] || null;
}

export async function getApprovalRecord(period: string, recordId?: string | number): Promise<Record<string, unknown>> {
  const params = new URLSearchParams({ path: "record", period });
  if (recordId !== undefined && recordId !== null) {
    params.set("record_id", String(recordId));
  }
  const res = await fetch(`${PROXY_BASE}?${params.toString()}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function submitApproval(data: SubmitApprovalDTO): Promise<Record<string, unknown>> {
  const params = new URLSearchParams({ path: "submit" });
  return request<Record<string, unknown>>("POST", `${PROXY_BASE}?${params.toString()}`, data as unknown as Record<string, unknown>);
}
