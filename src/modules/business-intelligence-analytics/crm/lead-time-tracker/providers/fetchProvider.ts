import type {
  LeadTimeApiResponse,
  LeadTimeProductOption,
  LeadTimeRecord,
} from "../types";

const API_BASE = "/api/bia/crm/lead-time-tracker";

async function parseJsonSafely(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Unexpected non-JSON response: ${text.slice(0, 200)}`);
  }
}

function ensureArray(data: LeadTimeApiResponse): LeadTimeRecord[] {
  if (Array.isArray(data)) return data as LeadTimeRecord[];
  if (
    (data as { data?: unknown }).data &&
    Array.isArray((data as { data?: unknown }).data)
  ) {
    return (data as { data: LeadTimeRecord[] }).data;
  }
  if (
    data &&
    typeof data === "object" &&
    "poNo" in (data as Record<string, unknown>)
  ) {
    return [data as LeadTimeRecord];
  }
  return [];
}

export async function fetchLeadTimeProducts(
  signal?: AbortSignal,
): Promise<LeadTimeProductOption[]> {
  // Use Directus-backed server route which proxies the Directus static token.
  // The lead-time-report route supports proxying to Directus when the
  // `directusCollection` query param is provided.
  const directusParams = new URLSearchParams({
    directusCollection: "products",
    // Request only common product fields we map below to reduce payload
    fields:
      "id,name,productName,product_name,productId,product_id,productCode,product_code,label,description",
  });

  const res = await fetch(
    `/api/bia/crm/lead-time-tracker?${directusParams.toString()}`,
    {
      method: "GET",
      cache: "no-store",
      signal,
    },
  );

  // http://localhost:3000/api/bia/crm/lead-time-report?directusCollection=products&fields=product_name&limit=-1
  if (!res.ok) {
    const parsed = await res.json().catch(() => null);
    const message =
      parsed?.error ||
      parsed?.message ||
      `Failed to fetch lead time filters (${res.status})`;
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  const data = (await parseJsonSafely(res)) as LeadTimeApiResponse;
  const records = ensureArray(data);

  // Map records to product options.
  // Some Directus responses may only include `product_name` (no id) —
  // accept those by falling back to using the name as a stable id and
  // deduplicating by name so the UI shows the expected list.
  const mapped = records
    .map((item) => {
      const name =
        (item as never as { name?: string })?.name ||
        (item as never as { productName?: string })?.productName ||
        (item as never as { product_name?: string })?.product_name ||
        (item as never as { label?: string })?.label ||
        "Unknown Product";

      const rawId =
        (item as never as { id?: string })?.id ??
        (item as never as { productId?: string })?.productId ??
        (item as never as { product_id?: string })?.product_id ??
        (item as never as { productCode?: string })?.productCode ??
        null;

      const id = rawId ? String(rawId) : name;

      return {
        id,
        name,
        code:
          (item as never as { code?: string })?.code ||
          (item as never as { productCode?: string })?.productCode ||
          (item as never as { product_code?: string })?.product_code ||
          undefined,
        description:
          (item as never as { description?: string })?.description || null,
      };
    })
    .filter((opt) => opt.name);

  // Dedupe by name to avoid duplicate entries coming from Directus
  // (responses often return repeated names when limit=-1 is requested).
  const seen = new Set<string>();
  const unique = mapped.filter((opt) => {
    const key = opt.name.trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchLeadTimeData(
  params: { from: string; to: string; productName?: string | string[] | null },
  signal?: AbortSignal,
): Promise<LeadTimeRecord[]> {
  const search = new URLSearchParams();
  if (params.from) search.append("startDate", params.from);
  if (params.to) search.append("endDate", params.to);
  if (params.productName) {
    if (Array.isArray(params.productName)) {
      params.productName.forEach((n) => search.append("productName", n));
    } else {
      search.append("productName", params.productName);
    }
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
      `Failed to fetch lead time data (${res.status})`;
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  const data = (await parseJsonSafely(res)) as LeadTimeApiResponse;
  return ensureArray(data);
}
