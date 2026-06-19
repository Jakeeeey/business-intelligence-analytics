import type {
  LeadTimeApiResponse,
  LeadTimeRecord,
} from "../types";

const API_BASE = "/api/bia/crm/customer-lead-time-tracker";

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

export async function fetchLeadTimeData(
  params: { from: string; to: string; customerCode: string; poNo: string },
  signal?: AbortSignal,
): Promise<LeadTimeRecord[]> {
  const search = new URLSearchParams();
  if (params.from) search.append("startDate", params.from);
  if (params.to) search.append("endDate", params.to);
  if (params.customerCode) search.append("customerCode", params.customerCode);
  if (params.poNo) search.append("poNo", params.poNo);

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
  console.log("Raw Lead Time Data from API:", data);
  return ensureArray(data);
}

export async function fetchLeadTimeCustomers(
  signal?: AbortSignal,
): Promise<{ customer_code: string; customer_name: string }[]> {
  const CACHE_KEY = "bia_customer_list_cache";
  const CACHE_TIME_KEY = "bia_customer_list_cache_time";
  const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

  // 1. Try to load from cache
  try {
    const cachedTime = sessionStorage.getItem(CACHE_TIME_KEY);
    if (cachedTime && Date.now() - Number(cachedTime) < CACHE_DURATION_MS) {
      const cachedData = sessionStorage.getItem(CACHE_KEY);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    }
  } catch {
    // Ignore storage errors (e.g., incognito mode limits)
  }

  const url = "/api/bia/crm/sales-report/stt-report?directusCollection=customer&fields=customer_code,customer_name&limit=-1";

  // 2. Fetch from server if no valid cache
  const res = await fetch(url, {
    method: "GET",
    // Using default cache behavior instead of "no-store"
    signal,
  });

  if (!res.ok) {
    return [];
  }

  const data = (await parseJsonSafely(res)) as { data?: { customer_code: string; customer_name: string }[] } | { customer_code: string; customer_name: string }[];
  let result: { customer_code: string; customer_name: string }[] = [];
  if (data && 'data' in data && Array.isArray(data.data)) {
    result = data.data;
  } else if (Array.isArray(data)) {
    result = data;
  }

  // 3. Save to cache if we got data
  if (result.length > 0) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(result));
      sessionStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    } catch {
      // Ignore quota exceeded errors
    }
  }

  return result;
}
