// src/modules/business-intelligence-analytics/sales-report/product-sales-performance/providers/fetchProvider.ts
import type { ProductSaleRecord } from "../types";

export async function fetchProductSalesData(startDate?: string, endDate?: string): Promise<ProductSaleRecord[]> {
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
    
    return data as ProductSaleRecord[];
  } catch (error: any) {
    console.error("Error fetching product sales data:", error);
    throw new Error(error?.message || "Failed to fetch product sales data");
  }
}
