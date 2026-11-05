export type RecordData = Record<string, unknown>;
export interface SummaryCard { key: string; title: string; weight: number; scorePercent: number | null; included: boolean }
export interface Summary { overallPercent: number | null; targetPercent: number; meetsTarget: boolean | null; weightCovered: number; cardsIncluded: number; cardsTotal: number; cards: SummaryCard[] }
export interface Branch { id: string; name: string }

let refreshing: Promise<boolean> | undefined;

export async function sessionFetch(url: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, options);
  if (response.status !== 401) return response;
  // API requests do not pass through the protected page's session-refresh flow.
  refreshing ??= fetch("/api/auth/refresh", { method: "POST", credentials: "same-origin" })
    .then(result => result.ok)
    .catch(() => false)
    .finally(() => { refreshing = undefined; });
  if (await refreshing) {
    options?.signal?.throwIfAborted();
    return fetch(url, options);
  }
  return response;
}

export async function warehouseRequest<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await sessionFetch(`/api/bia/warehouse-kpi/${path}`, { signal, cache: "no-store" });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || `Request failed (${response.status}).`);
  if (data === null) throw new Error("The service returned an invalid response.");
  return data as T;
}

export function percent(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(2)}%` : "--"; }
export function label(key: string) { return key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ").replace(/^./, c => c.toUpperCase()); }
export function display(value: unknown): string {
  if (value === null || value === undefined) return "--";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString("en-PH", { maximumFractionDigits: 4 });
  if (Array.isArray(value)) return value.map(display).join(", ");
  if (typeof value === "object") return Object.entries(value as RecordData).map(([key, val]) => `${label(key)}: ${display(val)}`).join("; ");
  return String(value);
}
