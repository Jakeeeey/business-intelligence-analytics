// src/modules/business-intelligence-analytics/scm/stock-out-monitoring/allocated-vs-ordered/providers/fetchProvider.ts
import { toast } from "sonner";
import type { AllocatedOrderedRecord } from "../types";
import {
  generateCacheKey,
  getCacheData,
  setCacheData,
  clearExpiredCache,
} from "../utils/cache";
import { idbGetUnwrapped, idbSet, idbClearExpired } from "../utils/indexedDB";


const CACHE_PREFIX = "allocated-vs-ordered";
const FILTER_PREFETCH_TOAST_ID = "avo-filter-prefetch";

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
  }

  // Option B: env token fallback (dev/service token)
  const env = process.env.NEXT_PUBLIC_DIRECTUS_TOKEN;
  return env ?? null;
}

/**
 * Fetch allocated vs ordered data with caching support.
 * Returns cached data immediately via onCacheData callback if available,
 * then fetches fresh data from /api/bia/scm/stock-out-monitoring/allocated-vs-ordered.
 */
export async function fetchAllocatedOrderedData(
  _startDate?: string,
  _endDate?: string,
  signal?: AbortSignal,
  options?: {
    onCacheData?: (data: AllocatedOrderedRecord[]) => void;
    skipCache?: boolean;
    filters?: FetchFilters;
    keysOnly?: boolean;
    supplierId?: number;
  },
): Promise<AllocatedOrderedRecord[]> {
  // NOTE: Date filtering is done entirely client-side.
  // _startDate and _endDate are intentionally unused here.
  clearExpiredCache(CACHE_PREFIX);
  await idbClearExpired(CACHE_PREFIX);

  if (options?.keysOnly) {
    toast.loading("Loading filter options...", {
      id: FILTER_PREFETCH_TOAST_ID,
    });
  }

  // Cache key only varies by supplierId — we always fetch all data for that scope
  const cacheKey = generateCacheKey(CACHE_PREFIX, {
    supplierId: options?.supplierId ?? "all",
  });

  if (!options?.skipCache) {
    const cachedData = getCacheData<AllocatedOrderedRecord[]>(cacheKey);
    if (cachedData && options?.onCacheData) {
      options.onCacheData(cachedData);
    }
    try {
      const idbSummary = await idbGetUnwrapped(`summary:${cacheKey}`);
      if (idbSummary && options?.onCacheData) {
        options.onCacheData(idbSummary as AllocatedOrderedRecord[]);
      }
    } catch (e) {
      console.warn("IndexedDB summary read failed", e);
    }
  }

  // Build URL — no date params; filtering is client-side
  const params = new URLSearchParams();
  if (options?.supplierId)
    params.append("supplierId", String(options.supplierId));

  const url = `/api/bia/scm/stock-out-monitoring/allocated-vs-ordered${
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
          `Failed to fetch allocated vs ordered data (${res.status})`,
      ) as Error & { status: number };
      httpErr.status = res.status;
      throw httpErr;
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid allocated vs ordered response format");
    }

    const records = data as AllocatedOrderedRecord[];

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
