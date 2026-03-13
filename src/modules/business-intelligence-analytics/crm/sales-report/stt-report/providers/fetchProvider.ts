// src/modules/business-intelligence-analytics/sales-report/sales-report-summary/providers/fetchProvider.ts
import { toast } from "sonner";
import type { STTReportRecord } from "../types";
import {
  generateCacheKey,
  getCacheData,
  setCacheData,
  clearExpiredCache,
} from "../utils/cache";
import { idbGetUnwrapped, idbSet, idbClearExpired } from "../utils/indexedDB";
// import { getAccessToken } from "@/lib/auth/token";

const CACHE_PREFIX = "sales-report-summary";
// Stable toast ID so React StrictMode double-invocations don't create duplicate spinners
const FILTER_PREFETCH_TOAST_ID = "stt-filter-prefetch";

export type FetchFilters = {
  branches?: string[];
  salesmen?: string[];
  statuses?: string[];
  suppliers?: string[];
};

/**
 * Fetch sales report itemized data with caching support.
 * Passes all filters server-side. Returns cached data immediately via callback if available,
 * then fetches fresh data.
 */

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

export async function fetchSTTReportData(
  startDate?: string,
  endDate?: string,
  signal?: AbortSignal,
  options?: {
    onCacheData?: (data: STTReportRecord[]) => void;
    skipCache?: boolean;
    filters?: FetchFilters;
    // When true, request a lightweight payload containing only key fields
    // (used for prefetching filter dropdown values).
    keysOnly?: boolean;
  },
): Promise<STTReportRecord[]> {
  clearExpiredCache(CACHE_PREFIX);
  await idbClearExpired(CACHE_PREFIX);

  // Show a persistent loading indicator while filter options are being fetched.
  // Using a stable ID means React StrictMode's double-invocation just refreshes
  // the same toast instead of creating a dangling spinner.
  if (options?.keysOnly) {
    toast.loading("Loading Filter options...", {
      id: FILTER_PREFETCH_TOAST_ID,
    });
  }

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

  if (!options?.skipCache) {
    const cachedData = getCacheData<STTReportRecord[]>(cacheKey);
    if (cachedData && options?.onCacheData) {
      options.onCacheData(cachedData);
    }

    try {
      const idbSummary = await idbGetUnwrapped(`summary:${cacheKey}`);
      if (idbSummary && options?.onCacheData) {
        options.onCacheData(idbSummary as STTReportRecord[]);
      }
    } catch (e) {
      console.warn("IndexedDB summary read failed", e);
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

  // Server route currently lives at /api/bia/sales-report/stt-report
  const url = `/api/bia/sales-report/stt-report${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  // console.log("[Sales Report Summary] Fetching from:", url);
  // console.log("[Sales Report Summary] Date range:", startDate, "to", endDate);
  // console.log("[Sales Report Summary] Filters:", filters);
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
        errData?.error || `Failed to fetch sales report data (${res.status})`,
      ) as Error & { status: number };
      httpErr.status = res.status;
      throw httpErr;
    }

    const data = await res.json();

    // console.log("[Sales Report Summary] Response received:", {
    //   status: res.status,
    //   ok: res.ok,
    //   dataType: Array.isArray(data) ? "array" : typeof data,
    //   dataLength: Array.isArray(data)
    //     ? data.length
    //     : data?.data?.length || "N/A",
    //   sample: Array.isArray(data) ? data[0] : data,
    // });

    if (!Array.isArray(data)) {
      throw new Error("Invalid sales report response format");
    }

    const records = data as STTReportRecord[];

    // If caller requested keys-only prefetch, skip caching/indexedDB writes
    // because the payload may be a lightweight shape used only for filter values.
    if (options?.keysOnly) {
      toast.success("Filter options loaded.", {
        id: FILTER_PREFETCH_TOAST_ID,
        duration: 3000,
      });
      return records;
    }

    setCacheData(cacheKey, records);

    try {
      await idbSet(`raw:${cacheKey}`, records);
      // Compact summary for offline/cache display
      const summary = records.map((r) => ({
        invoiceId: r.invoiceId,
        invoiceNo: r.invoiceNo,
        invoiceDate: r.invoiceDate,
        customerCode: r.customerCode,
        customerName: r.customerName,
        salesman: r.salesman,
        branch: r.branch,
        transactionStatus: r.transactionStatus,
        paymentStatus: r.paymentStatus,
        totalAmount: r.totalAmount,
        collection: r.collection,
        divisionName: r.divisionName,
        productName: r.productName,
        productSupplier: r.productSupplier,
        productCategory: r.productCategory,
        productBrand: r.productBrand,
        productQuantity: r.productQuantity,
        productTotalAmount: r.productTotalAmount,
        productNetAmount: r.productNetAmount,
        productSalesAmount: r.productSalesAmount,
        returnQuantity: r.returnQuantity,
        returnTotalAmount: r.returnTotalAmount,
        returnNetAmount: r.returnNetAmount,
      }));
      await idbSet(`summary:${cacheKey}`, summary);
    } catch (err) {
      console.warn("IndexedDB write failed", err);
    }

    return records;
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string; status?: number };
    const isAbort =
      (error as { name?: string })?.name === "AbortError" || signal?.aborted;
    if (options?.keysOnly) {
      if (isAbort) {
        toast.dismiss(FILTER_PREFETCH_TOAST_ID);
      } else {
        toast.error("Failed to load filter options", {
          id: FILTER_PREFETCH_TOAST_ID,
          duration: 3000,
        });
        if (err.status === 401) {
          toast.error("Unauthorized. Please log in again.", {
            id: FILTER_PREFETCH_TOAST_ID,
            duration: 3000,
          });
        }else if (err.status === 500) {
          toast.error(`Server is down. Please contact the administrator.`, {
            id: FILTER_PREFETCH_TOAST_ID,
            duration: 3000,
          });
        }
      }
    }
    if (isAbort) throw error as Error;
    const msg =
      error instanceof Error
        ? error.message
        : "Failed to fetch sales report data";
    console.error("Error fetching sales report data:", error);
    const rethrow = new Error(msg) as Error & { status?: number };
    if (typeof (error as { status?: number }).status === "number") {
      rethrow.status = (error as { status?: number }).status as number;
    }
    throw rethrow;
  }
}
