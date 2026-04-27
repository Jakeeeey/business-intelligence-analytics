import { NextRequest, NextResponse } from "next/server";

const SPRING_BASE = (process.env.SPRING_API_BASE_URL || "").replace(/\/+$/, "");

/**
 * Fetch all sales data from Spring Boot
 */
async function fetchAllSalesData(token?: string, startDate?: string, endDate?: string) {
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
 * Query Params: 
 * - storeNames (comma separated)
 * - salesmanIds (comma separated)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const names = searchParams.get("names")?.split("|") || [];
    const salesmanIds = searchParams.get("ids")?.split(",").map(Number) || [];
    const viewType = searchParams.get("viewType") || "customer";

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

    allData.forEach((item: any) => {
        // Filter by salesman first
        if (!salesmanIdsSet.has(Number(item.salesmanId))) return;

        // Grouping logic
        let groupName = "Unknown";
        if (viewType === "area") {
            // Province, City per user request
            groupName = `${(item.province || "").trim()}, ${(item.city || "").trim()}`.replace(/^, |, $/g, "") || "Unknown Area";
        } else {
            groupName = (item.storeName || "Unknown Customer").trim();
        }

        if (namesSet && !namesSet.has(groupName)) return;

        const dateStr = item.transactionDate;
        if (!dateStr) return;

        const monthKey = dateStr.substring(0, 7);
        
        if (!monthlyMap[groupName]) monthlyMap[groupName] = {};
        monthlyMap[groupName][monthKey] = (monthlyMap[groupName][monthKey] || 0) + (item.netAmount || 0);
    });

    const finalMap: Record<string, { total: number; peak: number }> = {};
    
    Object.entries(monthlyMap).forEach(([name, months]) => {
        const monthlyTotals = Object.values(months);
        finalMap[name] = {
            total: monthlyTotals.reduce((a, b) => a + b, 0),
            peak: monthlyTotals.length > 0 ? Math.max(...monthlyTotals) : 0
        };
    });

    return NextResponse.json(finalMap);

  } catch (error: any) {
    console.error("[Customer Peak API Error]:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
