// src/modules/business-intelligence-analytics/sales-report/product-returns-performance/providers/fetchProvider.ts
import type { ProductReturnRecord } from "../types";
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

const CACHE_PREFIX = "product-returns-performance";

export type FetchFilters = {
  branches?: string[];
  salesmen?: string[];
  statuses?: string[];
  suppliers?: string[];
};

/**
 * Fetch product return data with caching support.
 * Passes all filters server-side. Returns cached data immediately via callback if available.
 */
export async function fetchProductReturnsData(
  startDate?: string,
  endDate?: string,
  signal?: AbortSignal,
  options?: {
    onCacheData?: (data: ProductReturnRecord[]) => void;
    skipCache?: boolean;
    filters?: FetchFilters;
  },
): Promise<ProductReturnRecord[]> {
  // Clear expired cache entries (localStorage + IndexedDB) on each fetch
  clearExpiredCache(CACHE_PREFIX);
  await idbClearExpired(CACHE_PREFIX);

  const filters = options?.filters ?? {};

  // Cache key includes all active filters so each unique filter combo has its own cache
  const cacheKey = generateCacheKey(CACHE_PREFIX, {
    startDate: startDate || "none",
    endDate: endDate || "none",
    branches: (filters.branches ?? []).slice().sort().join("|") || "all",
    salesmen: (filters.salesmen ?? []).slice().sort().join("|") || "all",
    statuses: (filters.statuses ?? []).slice().sort().join("|") || "all",
    suppliers: (filters.suppliers ?? []).slice().sort().join("|") || "all",
  });

  // Try to get cached data first (unless explicitly skipped)
  if (!options?.skipCache) {
    const cachedData = getCacheData<ProductReturnRecord[]>(cacheKey);
    if (cachedData && options?.onCacheData) {
      const normalize = (r: ProductReturnRecord) => ({
        ...r,
        supplier:
          (r.supplier && String(r.supplier).trim()) || "Unknown Supplier",
        productName:
          (r.productName && String(r.productName).trim()) || "Unknown Product",
        customerName:
          (r.customerName && String(r.customerName).trim()) ||
          "Unknown Customer",
        salesmanName:
          (r.salesmanName && String(r.salesmanName).trim()) ||
          "Unknown Salesman",
        city: (r.city && String(r.city).trim()) || "Unknown City",
        province:
          (r.province && String(r.province).trim()) || "Unknown Province",
      });
      options.onCacheData(
        Array.isArray(cachedData) ? cachedData.map(normalize) : cachedData,
      );
    }

    // Also attempt to load a summarized dataset from IndexedDB
    try {
      const idbSummary = await idbGetUnwrapped(`summary:${cacheKey}`);
      if (idbSummary && options?.onCacheData) {
        // idbSummary is a compact summary; normalize any blank fields
        const normalize = (r: any) => ({
          ...r,
          supplier:
            (r.supplier && String(r.supplier).trim()) || "Unknown Supplier",
          productName:
            (r.productName && String(r.productName).trim()) ||
            "Unknown Product",
          customerName:
            (r.customerName && String(r.customerName).trim()) ||
            "Unknown Customer",
          salesmanName:
            (r.salesmanName && String(r.salesmanName).trim()) ||
            "Unknown Salesman",
          city: (r.city && String(r.city).trim()) || "Unknown City",
          province:
            (r.province && String(r.province).trim()) || "Unknown Province",
        });
        options.onCacheData(
          Array.isArray(idbSummary)
            ? idbSummary.map(normalize)
            : (idbSummary as ProductReturnRecord[]),
        );
      }
    } catch (err) {
      console.warn("IndexedDB summary read failed", err);
    }
  }

  // Build URL with all filter params
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  (filters.branches ?? []).forEach((b) => params.append("branches", b));
  (filters.salesmen ?? []).forEach((s) => params.append("salesman", s));
  (filters.statuses ?? []).forEach((s) => params.append("statuses", s));
  (filters.suppliers ?? []).forEach((s) => params.append("suppliers", s));

  const url = `/api/bia/sales-report/product-returns-performance${
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
        errData?.error ||
          `Failed to fetch product returns data (${res.status})`,
      ) as Error & { status: number };
      httpErr.status = res.status;
      throw httpErr;
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid product returns response format");
    }

    const normalize = (r: ProductReturnRecord): ProductReturnRecord => ({
      ...r,
      supplier: (r.supplier && String(r.supplier).trim()) || "Unknown Supplier",
      productName:
        (r.productName && String(r.productName).trim()) || "Unknown Product",
      customerName:
        (r.customerName && String(r.customerName).trim()) || "Unknown Customer",
      salesmanName:
        (r.salesmanName && String(r.salesmanName).trim()) || "Unknown Salesman",
      city: (r.city && String(r.city).trim()) || "Unknown City",
      province: (r.province && String(r.province).trim()) || "Unknown Province",
    });

    const records = Array.isArray(data)
      ? (data as ProductReturnRecord[]).map(normalize)
      : (data as ProductReturnRecord[]);

    // Cache the fresh data (normalized)
    setCacheData(cacheKey, records);
    // Store raw and summarized in IndexedDB for offline/fast display
    try {
      await idbSet(`raw:${cacheKey}`, records);
      // produce a compact summary with ALL essential fields for LocationTab to work correctly
      const summary = records.map((r) => ({
        date: r.date,
        productName: r.productName,
        supplier: r.supplier,
        amount: r.amount,
        province: r.province,
        city: r.city,
        customerName: r.customerName,
        salesmanName: r.salesmanName,
        // include brand/category/division/operation so cached summaries can rebuild filters
        productBrand: r.productBrand,
        productCategory: r.productCategory,
        divisionName: r.divisionName,
        operationName: r.operationName,
        supplierId: r.supplierId,
        productId: r.productId,
      }));
      await idbSet(`summary:${cacheKey}`, summary);
    } catch (err) {
      // ignore idb write errors
      console.warn("IndexedDB write failed", err);
    }

    return records;
  } catch (error: unknown) {
    // If the request was aborted, propagate silently (caller handles AbortError)
    if ((error as any)?.name === "AbortError" || signal?.aborted) {
      throw error as Error;
    }

    console.error("Error fetching product returns data:", error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error ?? {});
    const rethrow = new Error(
      message || "Failed to fetch product returns data",
    ) as Error & { status?: number };
    if (typeof (error as { status?: number }).status === "number") {
      rethrow.status = (error as { status: number }).status;
    }
    throw rethrow;
  }
}
