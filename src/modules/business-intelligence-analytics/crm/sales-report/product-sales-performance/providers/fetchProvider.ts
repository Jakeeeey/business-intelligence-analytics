// src/modules/business-intelligence-analytics/sales-report/product-sales-performance/providers/fetchProvider.ts
import type { ProductSaleRecord } from "../types";
import {
  generateCacheKey,
  getCacheData,
  setCacheData,
  clearExpiredCache,
} from "../utils/cache";
import {
  idbGetUnwrapped,
  idbSet,
  idbClearExpired,
} from "../utils/indexedDB";

const CACHE_PREFIX = "product-sales-performance";

/**
 * Fetch product sales data with caching support
 * Returns cached data immediately if available, then fetches fresh data
 */
export async function fetchProductSalesData(
  startDate?: string,
  endDate?: string,
  signal?: AbortSignal,
  options?: {
    onCacheData?: (data: ProductSaleRecord[]) => void;
    skipCache?: boolean;
  },
): Promise<ProductSaleRecord[]> {
  // Clear expired cache entries (localStorage + IndexedDB) on each fetch
  clearExpiredCache(CACHE_PREFIX);
  await idbClearExpired(CACHE_PREFIX);

  // Generate cache key based on parameters
  const cacheKey = generateCacheKey(CACHE_PREFIX, {
    startDate: startDate || "none",
    endDate: endDate || "none",
  });

  // Try to get cached data first (unless explicitly skipped)
  if (!options?.skipCache) {
    const cachedData = getCacheData<ProductSaleRecord[]>(cacheKey);
    if (cachedData && options?.onCacheData) {
      // Immediately return cached data via callback
      options.onCacheData(cachedData);
    }

    // Also attempt to load a summarized dataset from IndexedDB (smaller, precomputed)
    try {
      const idbSummary = await idbGetUnwrapped(`summary:${cacheKey}`);
      if (idbSummary && options?.onCacheData) {
        options.onCacheData(idbSummary as ProductSaleRecord[]);
      }
    } catch (err) {
      // ignore idb errors
      console.warn("IndexedDB summary read failed", err);
    }
  }
  // Call Next.js API route (not Spring API directly to avoid CORS)
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  const url = `/api/bia/sales-report/product-sales-performance${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      const httpErr = new Error(
        errData?.error || `Failed to fetch product sales data (${res.status})`,
      ) as Error & { status: number };
      httpErr.status = res.status;
      throw httpErr;
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid product sales response format");
    }

    const records = data as ProductSaleRecord[];

    // Cache the fresh data
    setCacheData(cacheKey, records);
    // Store raw and summarized in IndexedDB for offline/fast display
    try {
      await idbSet(`raw:${cacheKey}`, records);
      // produce a compact summary with ALL essential fields for LocationTab to work correctly
      const summary = records.map((r) => ({
        date: r.date,
        productName: r.productName,
        productId: r.productId,
        supplier: r.supplier,
        supplierId: r.supplierId,
        amount: r.amount,
        province: r.province,
        city: r.city,
        customerName: r.customerName,
        salesmanName: r.salesmanName,
        divisionName: r.divisionName,
        divisionId: r.divisionId,
        operationName: r.operationName,
        operationId: r.operationId,
      }));
      await idbSet(`summary:${cacheKey}`, summary);
    } catch (err) {
      // ignore idb write errors
      console.warn("IndexedDB write failed", err);
    }

    return records;
  } catch (error: unknown) {
    if ((error as any)?.name === "AbortError") throw error as Error;
    console.error("Error fetching product sales data:", error);
    const message = error instanceof Error ? error.message : String(error);
    const rethrow = new Error(
      message || "Failed to fetch product sales data",
    ) as Error & { status?: number };
    if (typeof (error as { status?: number }).status === "number") {
      rethrow.status = (error as { status: number }).status;
    }
    throw rethrow;
  }
}
