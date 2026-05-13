import { NextRequest, NextResponse } from "next/server";

const DIRECTUS_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || "";

function directusHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${DIRECTUS_TOKEN}`,
  };
}

/**
 * GET /api/bia/crm/target-setting-reports/managerial-supplier/customer-targets
 * Query Params:
 * - salesmanId
 * - startDate (YYYY-MM-DD)
 * - endDate (YYYY-MM-DD)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const salesmanIds = searchParams.get("salesmanIds")?.split(",") || [];
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const viewType = searchParams.get("viewType") || "customer";

    if (salesmanIds.length === 0 || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    if (viewType === "area") {
      const sIdsIds = salesmanIds.map(id => Number(id)).filter(id => !isNaN(id));
      if (sIdsIds.length === 0) return NextResponse.json([]);

      const targetMonth = startDate.substring(0, 7); 

      const settingUrl = `${DIRECTUS_BASE}/items/salesman_target_setting?fields=*&limit=-1`;
      const areaUrl = `${DIRECTUS_BASE}/items/salesman_target_area_sales?fields=*&limit=-1`;
      
      const [settingRes, areaRes] = await Promise.all([
          fetch(settingUrl, { cache: "no-store", headers: directusHeaders() }),
          fetch(areaUrl, { cache: "no-store", headers: directusHeaders() })
      ]);

      if (!settingRes.ok || !areaRes.ok) return NextResponse.json([]);

      const { data: allSettings } = await settingRes.json();
      const { data: allAreas } = await areaRes.json();

      const validSettingIds = (allSettings || [])
        .filter((s: Record<string, unknown>) => {
            const sFrom = (s.date_range_from as string || "").substring(0, 7);
            const sTo = (s.date_range_to as string || "").substring(0, 7);
            return targetMonth >= sFrom && targetMonth <= sTo;
        })
        .map((s: Record<string, unknown>) => s.id as number);

      if (validSettingIds.length === 0) return NextResponse.json([]);

      const matchingTargets = (allAreas || [])
        .filter((item: Record<string, unknown>) => {
            const rawTid = item.target_setting_id || item.target_setting || item.targetSetting;
            const areaSettingId = Number(typeof rawTid === 'object' && rawTid !== null ? (rawTid as Record<string, unknown>).id : rawTid);
            return validSettingIds.includes(areaSettingId);
        })
        .map((item: Record<string, unknown>) => ({
            province: (item.province as string) || "",
            city: (item.city as string) || "",
            target_amount: Number((item.target_amount as number) || (item.targetAmount as number) || (item.amount as number) || 0)
        }));

      return NextResponse.json(matchingTargets);
    }

    const filter = JSON.stringify({
      _and: [
        { target_setting_id: { salesman_id: { _in: salesmanIds } } },
        { target_setting_id: { date_range_from: { _gte: startDate } } },
        { target_setting_id: { date_range_from: { _lte: endDate } } }
      ]
    });

    const fields = "target_amount,customer_id.store_name,customer_id.store_type.store_type,target_setting_id.status";
    const url = `${DIRECTUS_BASE}/items/salesman_target_customer_sales?filter=${encodeURIComponent(filter)}&fields=${fields}&limit=-1`;

    const res = await fetch(url, {
      cache: "no-store",
      headers: directusHeaders(),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Directus error: ${text}` }, { status: res.status });
    }

    const { data } = await res.json();
    
    const targetMap: Record<string, number> = {};
    (data || []).forEach((item: Record<string, unknown>) => {
      const customer = item.customer_id as Record<string, unknown> | undefined;
      const storeName = customer?.store_name as string | undefined;
      const storeType = (customer?.store_type as Record<string, unknown> | undefined)?.store_type as string | undefined;

      const key = viewType === "storeType" ? (storeType || "OTHERS") : storeName;
      if (key) {
        targetMap[key] = (targetMap[key] || 0) + (item.target_amount as number || 0);
      }
    });

    return NextResponse.json(targetMap);

  } catch (error) {
    const err = error as Error;
    console.error("[Customer Targets API Error]:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
