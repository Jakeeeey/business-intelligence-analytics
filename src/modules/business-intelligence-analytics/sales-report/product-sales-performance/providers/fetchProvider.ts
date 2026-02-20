// src/modules/business-intelligence-analytics/sales-report/product-sales-performance/providers/fetchProvider.ts
import type { ProductSaleRecord } from "../types";
import { generateCacheKey, getCacheData, setCacheData, clearExpiredCache } from "@/modules/business-intelligence-analytics/sales-report/product-sales-performance/utils/cache";

const CACHE_PREFIX = "product-sales-performance";

/**
 * Fetch product sales data with caching support
 * Returns cached data immediately if available, then fetches fresh data
 */
export async function fetchProductSalesData(
  startDate?: string,
  endDate?: string,
  options?: {
    onCacheData?: (data: ProductSaleRecord[]) => void;
    skipCache?: boolean;
  }
): Promise<ProductSaleRecord[]> {
  // Clear expired cache entries on each fetch
  clearExpiredCache(CACHE_PREFIX);
  
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
  }
  
  // Call Next.js API route (not Spring API directly to avoid CORS)
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  
  const url = `/api/bia/sales-report/product-sales-performance${params.toString() ? `?${params.toString()}` : ""}`;
  
  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.error || `Failed to fetch product sales data (${res.status})`);
    }

    const data = await res.json();
    
    if (!Array.isArray(data)) {
      throw new Error("Invalid product sales response format");
    }
    
    const records = data as ProductSaleRecord[];
    
    // Cache the fresh data
    setCacheData(cacheKey, records);
    
    return records;
  } catch (error: any) {
    console.error("Error fetching product sales data:", error);
    throw new Error(error?.message || "Failed to fetch product sales data");
  }
}
