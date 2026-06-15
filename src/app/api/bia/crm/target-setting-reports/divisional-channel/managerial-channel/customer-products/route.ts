import { NextRequest, NextResponse } from "next/server";
import { ProductSalesDetail } from "@/modules/business-intelligence-analytics/crm/target-setting-reports/managerial-supplier/types";

const SPRING_BASE = (process.env.SPRING_API_BASE_URL || "").replace(/\/+$/, "");

/**
 * GET /api/bia/crm/target-setting-reports/managerial-supplier/customer-products
 * Proxy to SpringBoot /api/sales-kpi or /api/sales-kpi-per-area
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const identifier = searchParams.get("customerCode");
    const viewType = searchParams.get("viewType") || "customer";
    const salesmanId = searchParams.get("salesmanId");
    const supplierId = searchParams.get("supplierId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!salesmanId || !supplierId || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const token =
      req.headers.get("authorization")?.replace("Bearer ", "") ||
      req.cookies.get("vos_access_token")?.value;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAreaKey = identifier?.includes("::");
    let urlPath = "/api/sales-kpi";
    
    if (viewType === "area" && isAreaKey) {
        urlPath = "/api/sales-kpi-per-area";
    }

    const url = new URL(`${SPRING_BASE}${urlPath}`);
    
    if (viewType === "customer" || (viewType === "area" && !isAreaKey)) {
        url.searchParams.append("customerCode", identifier || "");
    } else if (viewType === "area" && identifier && isAreaKey) {
        const parts = identifier.split("::");
        url.searchParams.append("province", (parts[0] || "").trim());
        url.searchParams.append("city", (parts[1] || "").trim());
    }

    url.searchParams.append("salesmanId", salesmanId || "");
    url.searchParams.append("supplierId", supplierId || "");
    url.searchParams.append("startDate", startDate || "");
    url.searchParams.append("endDate", endDate || "");

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      cache: "no-store",
    });

    let currentData: Record<string, unknown>[] = [];
    if (res.ok) {
        currentData = await res.json();
    }

    const now = new Date();
    const historyStart = new Date();
    historyStart.setMonth(now.getMonth() - 6);
    historyStart.setDate(1);

    const hStartStr = historyStart.toISOString().split('T')[0];
    const hEndStr = now.toISOString().split('T')[0];

    const hUrl = new URL(`${SPRING_BASE}/api/sales-kpi`);
    hUrl.searchParams.append("salesmanId", salesmanId || "");
    hUrl.searchParams.append("supplierId", supplierId || "");
    hUrl.searchParams.append("startDate", hStartStr);
    hUrl.searchParams.append("endDate", hEndStr);
    
    if (viewType === "customer" || (viewType === "area" && !isAreaKey)) {
        hUrl.searchParams.append("customerCode", identifier || "");
    }

    const hRes = await fetch(hUrl.toString(), {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        cache: "no-store",
    });

    const highestSalesMap = new Map<number, number>();
    const historicalMetadata = new Map<number, Record<string, unknown>>();
    
    if (hRes.ok) {
        let hData: Record<string, unknown>[] = await hRes.json();
        
        const sIds = (salesmanId || "").split(',').map(id => Number(id.trim()));
        const sIdsSet = new Set(sIds);
        
        hData = hData.filter(item => sIdsSet.has(Number(item.salesmanId)));

        if (viewType === "area" && isAreaKey) {
            const parts = (identifier || "").split("::");
            const pSearch = (parts[0] || "").toLowerCase().trim();
            const cSearch = (parts[1] || "").toLowerCase().trim();
            hData = hData.filter(item => {
                const prov = (String(item.province || item.provinceName || "")).toLowerCase().trim();
                const city = (String(item.city || item.cityName || "")).toLowerCase().trim();
                return pSearch && cSearch ? (prov.includes(pSearch) && city.includes(cSearch)) : (prov.includes(pSearch) || city.includes(cSearch));
            });
        }

        const productMonthSum = new Map<string, number>();
        hData.forEach(item => {
            const pId = Number(item.productId);
            if (!pId) return;
            
            if (!historicalMetadata.has(pId)) {
                historicalMetadata.set(pId, item);
            }

            const transactionDate = String(item.transactionDate || "");
            const monthKey = `${pId}-${transactionDate.substring(0, 7)}`;
            productMonthSum.set(monthKey, (productMonthSum.get(monthKey) || 0) + Number(item.netAmount || 0));
        });

        productMonthSum.forEach((sum, key) => {
            const pId = Number(key.split('-')[0]);
            if (!highestSalesMap.has(pId) || sum > highestSalesMap.get(pId)!) {
                highestSalesMap.set(pId, sum);
            }
        });
    }

    const aggregatedMap = new Map<number, ProductSalesDetail>();

    historicalMetadata.forEach((item, pId) => {
        aggregatedMap.set(pId, {
            ...(item as unknown as ProductSalesDetail),
            totalQuantity: 0,
            quantityInBox: 0,
            quantityInPiece: 0,
            netAmount: 0,
            highestMonthlySales: highestSalesMap.get(pId) || 0
        } as ProductSalesDetail);
    });

    if (Array.isArray(currentData)) {
        currentData.forEach(item => {
            const pId = Number(item.productId as string);
            if (!pId) return;

            if (!aggregatedMap.has(pId)) {
                aggregatedMap.set(pId, {
                    ...(item as unknown as ProductSalesDetail),
                    totalQuantity: 0,
                    quantityInBox: 0,
                    quantityInPiece: 0,
                    netAmount: 0,
                    highestMonthlySales: highestSalesMap.get(pId) || 0
                } as ProductSalesDetail);
            }

            const agg = aggregatedMap.get(pId)!;
            agg.totalQuantity += Number(item.totalQuantity as number || 0);
            agg.quantityInBox += Number(item.quantityInBox as number || 0);
            agg.quantityInPiece += Number(item.quantityInPiece as number || 0);
            agg.netAmount += Number(item.netAmount as number || 0);
        });
    }

    return NextResponse.json(Array.from(aggregatedMap.values()));

  } catch (error) {
    console.error("[Customer Products API Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
