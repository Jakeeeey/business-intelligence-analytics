import { NextRequest, NextResponse } from "next/server";

const SPRING_BASE = (process.env.SPRING_API_BASE_URL || "http://100.81.225.79:8086").replace(/\/+$/, "");

/**
 * GET /api/bia/crm/target-setting-reports/supervisor-kpi/customer-products
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

    let urlPath = "/api/sales-kpi";
    if (viewType === "area") {
        urlPath = "/api/sales-kpi-per-area";
    }
    
    const url = new URL(`${SPRING_BASE}${urlPath}`);
    
    // Pass parameters based on viewType
    if (viewType === "customer") {
        url.searchParams.append("customerCode", identifier || "");
    } else if (viewType === "area" && identifier) {
        // identifier is "Province::City" (Preserves Casing from rawData)
        const parts = identifier.split("::");
        const province = (parts[0] || "").trim();
        const city = (parts[1] || "").trim();
        url.searchParams.append("province", province);
        url.searchParams.append("city", city);
    }
    
    url.searchParams.append("salesmanId", salesmanId || "");
    url.searchParams.append("supplierId", supplierId || "");
    url.searchParams.append("startDate", startDate || "");
    url.searchParams.append("endDate", endDate || "");

    const token =
      req.headers.get("authorization")?.replace("Bearer ", "") ||
      req.cookies.get("vos_access_token")?.value;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let res = await fetch(url.toString(), {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      cache: "no-store",
    });

    let data = [];
    if (res.ok) {
        data = await res.json();
    }

    // FALLBACK: If Area view primary endpoint returned nothing, try the general endpoint and filter manually
    if (viewType === "area" && (!data || data.length === 0)) {
        const fallbackUrl = new URL(`${SPRING_BASE}/api/sales-kpi`);
        fallbackUrl.searchParams.append("salesmanId", salesmanId || "");
        fallbackUrl.searchParams.append("supplierId", supplierId || "");
        fallbackUrl.searchParams.append("startDate", startDate || "");
        fallbackUrl.searchParams.append("endDate", endDate || "");
        
        const fallbackRes = await fetch(fallbackUrl.toString(), {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            cache: "no-store",
        });
        
        if (fallbackRes.ok) {
            const allSales = await fallbackRes.json();
            const parts = (identifier || "").split("::");
            const provinceSearch = (parts[0] || "").toLowerCase().trim();
            const citySearch = (parts[1] || "").toLowerCase().trim();
            
            data = allSales.filter((item: any) => {
                const itemProv = (item.province || item.provinceName || "").toLowerCase().trim();
                const itemCity = (item.city || item.cityName || "").toLowerCase().trim();
                
                if (provinceSearch && citySearch) {
                    return itemProv.includes(provinceSearch) && itemCity.includes(citySearch);
                }
                return itemProv.includes(provinceSearch) || itemCity.includes(citySearch);
            });
        }
    }

    // 3. AGGREGATE PRODUCS: Sum values for the same productId
    if (Array.isArray(data) && data.length > 0) {
        const aggregatedMap = new Map<number, any>();
        
        data.forEach((item: any) => {
            const pId = Number(item.productId);
            if (!pId) return;
            
            if (!aggregatedMap.has(pId)) {
                aggregatedMap.set(pId, { 
                    ...item,
                    totalQuantity: 0,
                    quantityInBox: 0,
                    quantityInPiece: 0,
                    netAmount: 0
                });
            }
            
            const agg = aggregatedMap.get(pId);
            agg.totalQuantity += Number(item.totalQuantity || 0);
            agg.quantityInBox += Number(item.quantityInBox || 0);
            agg.quantityInPiece += Number(item.quantityInPiece || 0);
            agg.netAmount += Number(item.netAmount || 0);
        });
        
        data = Array.from(aggregatedMap.values());
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("[Customer Products API Error]:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
