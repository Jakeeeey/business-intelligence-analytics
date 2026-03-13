// src/modules/business-intelligence-analytics/scm/stock-out-monitoring/orders-vs-consolidated/providers/fetchProvider.ts
import { toast } from "sonner";
import type { OrdersRecord } from "../types";
import {
  generateCacheKey,
  getCacheData,
  setCacheData,
  clearExpiredCache,
} from "../utils/cache";
import { idbGetUnwrapped, idbSet, idbClearExpired } from "../utils/indexedDB";
// import { getAccessToken } from "@/lib/auth/token";

const CACHE_PREFIX = "orders-vs-consolidated";
const FILTER_PREFETCH_TOAST_ID = "ovc-filter-prefetch";

export type FetchFilters = {
  suppliers?: string[];
  brands?: string[];
  categories?: string[];
  statuses?: string[];
};
export function getAccessToken(): string | null {
  // Option A (recommended): stored after login
  if (typeof window !== "undefined") {
    const t = window.localStorage.getItem("access_token");
    if (t) return t;
    console.log("access token:",  t);
  }

  // Option B: env token fallback (dev/service token)
  const env = process.env.NEXT_PUBLIC_DIRECTUS_TOKEN;
  return env ?? null;
}

/**
 * Fetch orders vs consolidated data with caching support.
 * Returns cached data immediately via onCacheData callback if available,
 * then fetches fresh data from /api/bia/scm/stock-out-monitoring/orders-vs-consolidated.
 *
 * NOTE: Date filtering is done entirely client-side.
 * startDate/endDate params are intentionally NOT sent to the API.
 */
export async function fetchOrdersConsolidatedData(
  _startDate?: string,
  _endDate?: string,
  signal?: AbortSignal,
  options?: {
    onCacheData?: (data: OrdersRecord[]) => void;
    skipCache?: boolean;
    filters?: FetchFilters;
    keysOnly?: boolean;
    supplierId?: number;
  },
): Promise<OrdersRecord[]> {
  clearExpiredCache(CACHE_PREFIX);
  await idbClearExpired(CACHE_PREFIX);

  if (options?.keysOnly) {
    toast.loading("Loading filter options...", {
      id: FILTER_PREFETCH_TOAST_ID,
    });
  }

  // Cache key only varies by supplierId — we always fetch all data for that scope.
  // Date filtering is done client-side so the cache remains reusable across date changes.
  const cacheKey = generateCacheKey(CACHE_PREFIX, {
    supplierId: options?.supplierId ?? "all",
  });

  if (!options?.skipCache) {
    const cachedData = getCacheData<OrdersRecord[]>(cacheKey);
    if (cachedData && options?.onCacheData) {
      options.onCacheData(cachedData);
    }
    try {
      const idbSummary = await idbGetUnwrapped(`summary:${cacheKey}`);
      if (idbSummary && options?.onCacheData) {
        options.onCacheData(idbSummary as OrdersRecord[]);
      }
    } catch (e) {
      console.warn("IndexedDB summary read failed", e);
    }
  }

  // Build URL — no date params; all filtering is client-side
  const params = new URLSearchParams();
  if (options?.supplierId)
    params.append("supplierId", String(options.supplierId));

  const url = `/api/bia/scm/stock-out-monitoring/orders-vs-consolidated${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  try {
    const token = getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal,
      credentials: "same-origin",
      headers,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      const httpErr = new Error(
        errData?.error ||
          `Failed to fetch orders vs consolidated data (${res.status})`,
      ) as Error & { status: number };
      httpErr.status = res.status;
      throw httpErr;
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid orders vs consolidated response format");
    }

    const records = data as OrdersRecord[];

    if (options?.keysOnly) {
      toast.success("Filter options loaded.", {
        id: FILTER_PREFETCH_TOAST_ID,
        duration: 3000,
      });
      return records;
    }

    setCacheData(cacheKey, records);

    try {
      await idbSet(`summary:${cacheKey}`, records);
    } catch (e) {
      console.warn("IndexedDB summary write failed", e);
    }

    return records;
  } catch (error) {
    if (options?.keysOnly) {
      toast.error("Failed to load filter options.", {
        id: FILTER_PREFETCH_TOAST_ID,
        duration: 4000,
      });
    }
    throw error;
  }
}
