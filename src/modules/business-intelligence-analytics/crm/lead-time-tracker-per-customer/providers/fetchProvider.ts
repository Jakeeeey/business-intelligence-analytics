import type {
  CustomerLeadTimeApiResponse,
  CustomerLeadTimeRecord,
  CustomerOption,
} from "../types";

const API_BASE = "/api/bia/crm/lead-time-tracker-per-customer";

async function parseJsonSafely(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Unexpected non-JSON response: ${text.slice(0, 200)}`);
  }
}

function ensureArray(data: CustomerLeadTimeApiResponse): CustomerLeadTimeRecord[] {
  if (Array.isArray(data)) return data as CustomerLeadTimeRecord[];
  if (
    (data as { data?: unknown }).data &&
    Array.isArray((data as { data?: unknown }).data)
  ) {
    return (data as { data: CustomerLeadTimeRecord[] }).data;
  }
  if (
    data &&
    typeof data === "object" &&
    "customerCode" in (data as Record<string, unknown>)
  ) {
    return [data as CustomerLeadTimeRecord];
  }
  return [];
}

/**
 * Fetch customer options from Directus via our route proxy.
 */
export async function fetchCustomerOptions(
  signal?: AbortSignal,
): Promise<CustomerOption[]> {
  const directusParams = new URLSearchParams({
    directusCollection: "customer",
    fields: "customer_code,customer_name",
    limit: "-1",
  });

  const res = await fetch(
    `${API_BASE}?${directusParams.toString()}`,
    {
      method: "GET",
      cache: "no-store",
      signal,
    },
  );

  if (!res.ok) {
    const parsed = await res.json().catch(() => null);
    const message =
      parsed?.error ||
      parsed?.message ||
      `Failed to fetch customer options (${res.status})`;
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  const data = (await parseJsonSafely(res)) as CustomerLeadTimeApiResponse;
  const records = ensureArray(data);

  const mapped = records
    .map((item) => {
      const raw = item as unknown as Record<string, unknown>;
      const code =
        String(
          raw["customer_code"] ??
            raw["customerCode"] ??
            raw["code"] ??
            "",
        ).trim();
      const name =
        String(
          raw["customer_name"] ??
            raw["customerName"] ??
            raw["name"] ??
            "",
        ).trim();
      return { code, name };
    })
    .filter((opt) => opt.code || opt.name);

  // Dedupe by code
  const seen = new Set<string>();
  const unique = mapped.filter((opt) => {
    const key = opt.code || opt.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Fetch customer lead time data from Spring API via our route.
 */
export async function fetchCustomerLeadTimeData(
  params: {
    from: string;
    to: string;
    customerCode?: string | null;
    poNo?: string | null;
  },
  signal?: AbortSignal,
): Promise<CustomerLeadTimeRecord[]> {
  const search = new URLSearchParams();
  if (params.from) search.append("startDate", params.from);
  if (params.to) search.append("endDate", params.to);
  if (params.customerCode) {
    search.append("customerCode", params.customerCode);
  }
  if (params.poNo) {
    search.append("poNo", params.poNo);
  }

  const url = `${API_BASE}${search.toString() ? `?${search.toString()}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (!res.ok) {
    const parsed = await res.json().catch(() => null);
    const message =
      parsed?.error ||
      parsed?.message ||
      `Failed to fetch customer lead time data (${res.status})`;
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  const data = (await parseJsonSafely(res)) as CustomerLeadTimeApiResponse;
  return ensureArray(data);
}
