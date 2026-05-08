import { NextRequest, NextResponse } from "next/server";
import { VSalesPerformanceDataDto } from "@/modules/business-intelligence-analytics/crm/target-setting-reports/supervisor-kpi/types";

const SPRING_BASE = (process.env.SPRING_API_BASE_URL || "").replace(/\/+$/, "");

/**
 * Fetch all sales data from Spring Boot
 */
async function fetchAllSalesData(token?: string, startDate?: string, endDate?: string): Promise<VSalesPerformanceDataDto[]> {
  if (!SPRING_BASE) return [];

  const url = new URL(`${SPRING_BASE}/api/view-sales-performance/all`);
  if (startDate) url.searchParams.append("startDate", startDate);
  if (endDate) url.searchParams.append("endDate", endDate);

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url.toString(), {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!res.ok) return [];
    const resJson = await res.json();
    return Array.isArray(resJson) ? resJson : (resJson.data || []);
  } catch (e) {
    console.error("Spring Fetch Error (All) - Customer Peak:", e);
    return [];
  }
}

/**
 * GET /api/bia/crm/target-setting-reports/supervisor-kpi/customer-peak
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const names = searchParams.get("names")?.split("|") || [];
    const salesmanIds = searchParams.get("ids")?.split(",").map(Number) || [];
    const viewType = searchParams.get("viewType") || "customer";
    const storeTypeFilter = searchParams.get("storeType");

    if (salesmanIds.length === 0) {
      return NextResponse.json({ error: "salesmanIds is required" }, { status: 400 });
    }

    const token = req.cookies.get("vos_access_token")?.value;
    
    const allTimeStartDate = "2000-01-01";
    const today = new Date().toISOString().split("T")[0];

    const allData = await fetchAllSalesData(token, allTimeStartDate, today);

    if (!Array.isArray(allData) || allData.length === 0) {
      return NextResponse.json({});
    }

    const salesmanIdsSet = new Set(salesmanIds);
    const namesSet = names.length > 0 ? new Set(names) : null;

    const monthlyMap: Record<string, Record<string, number>> = {};
    const metadataMap: Record<string, Record<string, unknown>> = {};

    allData.forEach((item: VSalesPerformanceDataDto) => {
        if (!salesmanIdsSet.has(Number(item.salesmanId))) return;

        let groupName = "Unknown";
        let rawCode = "";
        
        if (viewType === "area") {
            groupName = `${(item.province as string || "").trim()}, ${(item.city as string || "").trim()}`.replace(/^, |, $/g, "") || "Unknown Area";
            rawCode = `${(item.province as string || "").trim()}::${(item.city as string || "").trim()}`;
        } else if (viewType === "storeType") {
            groupName = (item.storeTypeLabel || "OTHERS").trim();
            rawCode = groupName;
        } else {
            rawCode = (item.customerCode || item.storeName || "Unknown").trim();
            groupName = (item.storeName || "Unknown Customer").trim();
        }

        if (namesSet && !namesSet.has(groupName)) return;
        
        const itemStoreType = (item.storeTypeLabel || "OTHERS").trim();
        if (storeTypeFilter) {
            const filterNorm = storeTypeFilter.trim().toLowerCase();
            const itemNorm = itemStoreType.toLowerCase();
            if (itemNorm !== filterNorm) {
                // If the filter is "DISTRIBUTOR" but item is "LOCAL KEY ACCOUNT", skip.
                return;
            }
        }

        const dateStr = item.transactionDate;
        if (!dateStr) return;

        const monthKey = dateStr.substring(0, 7);
        const groupKey = rawCode;
        
        if (!monthlyMap[groupKey]) {
            monthlyMap[groupKey] = {};
            metadataMap[groupKey] = {
                name: groupName,
                customerCode: rawCode,
                storeTypeLabel: itemStoreType,
                sId: Number(item.salesmanId),
                supId: Number(item.supplierId),
                province: item.province,
                city: item.city,
                peakMonth: "",
                peakMonthAmt: -1
            };
        }

        monthlyMap[groupKey][monthKey] = (monthlyMap[groupKey][monthKey] || 0) + (item.netAmount || 0);
        
        const currentMonthAmt = monthlyMap[groupKey][monthKey];
        const meta = metadataMap[groupKey] as { 
            name: string; 
            peakMonthAmt: number; 
            peakMonth: string;
            customerCode: string;
            storeTypeLabel: string;
            sId: number;
            supId: number;
            province?: string;
            city?: string;
        };
        
        if (currentMonthAmt > meta.peakMonthAmt) {
            meta.peakMonthAmt = currentMonthAmt;
            meta.peakMonth = monthKey;
            meta.name = groupName;
        }
    });

    const finalMap: Record<string, { total: number; peak: number; metadata: Record<string, unknown> }> = {};
    
    Object.entries(monthlyMap).forEach(([groupKey, months]) => {
        const monthlyTotals = Object.values(months);
        const peak = monthlyTotals.length > 0 ? Math.max(...monthlyTotals) : 0;
        const meta = metadataMap[groupKey];
        const displayName = (meta.name as string) || groupKey;

        finalMap[displayName] = {
            total: monthlyTotals.reduce((a, b) => a + b, 0),
            peak: peak,
            metadata: meta
        };
    });
    
    return NextResponse.json(finalMap);

  } catch (error) {
    const err = error as Error;
    console.error("[Customer Peak API Error]:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
