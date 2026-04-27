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
 * GET /api/bia/crm/target-setting-reports/supervisor-kpi/customer-targets
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
    const names = searchParams.get("names")?.split("|") || [];

    if (salesmanIds.length === 0 || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Helper for fuzzy name matching
    const normalize = (s: string) => (s || "").toLowerCase()
        .replace(/city of /g, "")
        .replace(/ city/g, "")
        .replace(/province of /g, "")
        .replace(/ province/g, "")
        .replace(/\(capital\)/g, "")
        .replace(/[^a-z0-9]/g, "")
        .trim();

    if (viewType === "area") {
      // MEGA BRUTE FORCE: Fetch EVERYTHING with fields=* to find the hidden data
      const sIdsIds = salesmanIds.map(id => Number(id)).filter(id => !isNaN(id));
      if (sIdsIds.length === 0) return NextResponse.json([]);

      const targetMonth = startDate.substring(0, 7); 

      // Fetch ALL fields to avoid missing aliased fields
      const settingUrl = `${DIRECTUS_BASE}/items/salesman_target_setting?fields=*&limit=-1`;
      const areaUrl = `${DIRECTUS_BASE}/items/salesman_target_area_sales?fields=*&limit=-1`;
      
      const [settingRes, areaRes] = await Promise.all([
          fetch(settingUrl, { cache: "no-store", headers: directusHeaders() }),
          fetch(areaUrl, { cache: "no-store", headers: directusHeaders() })
      ]);

      if (!settingRes.ok || !areaRes.ok) return NextResponse.json([]);

      const { data: allSettings } = await settingRes.json();
      const { data: allAreas } = await areaRes.json();

      // INVESTIGATIVE FETCH: Just match by month to see if ANY data exists for this period
      const validSettingIds = (allSettings || [])
        .filter((s: any) => {
            const sFrom = (s.date_range_from || "").substring(0, 7);
            const sTo = (s.date_range_to || "").substring(0, 7);
            return targetMonth >= sFrom && targetMonth <= sTo;
        })
        .map((s: any) => s.id);

      if (validSettingIds.length === 0) return NextResponse.json([]);

      // Map targets raw for frontend to match
      const matchingTargets = (allAreas || [])
        .filter((item: any) => {
            // Check all possible target setting ID fields
            const rawTid = item.target_setting_id || item.target_setting || item.targetSetting;
            const areaSettingId = Number(typeof rawTid === 'object' ? rawTid?.id : rawTid);
            return validSettingIds.includes(areaSettingId);
        })
        .map((item: any) => ({
            province: item.province || "",
            city: item.city || "",
            // Use target_amount as primary, but check variations if empty
            target_amount: Number(item.target_amount || item.targetAmount || item.amount || 0)
        }));

      return NextResponse.json(matchingTargets);
    }

    // Default: Query salesman_target_customer_sales with relational filters
    const filter = JSON.stringify({
      _and: [
        { target_setting_id: { salesman_id: { _in: salesmanIds } } },
        { target_setting_id: { date_range_from: { _gte: startDate } } },
        { target_setting_id: { date_range_from: { _lte: endDate } } }
      ]
    });

    const fields = "target_amount,customer_id.store_name,target_setting_id.status";
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
    
    // Map to { [storeName]: targetAmount }
    const targetMap: Record<string, number> = {};
    (data || []).forEach((item: any) => {
      const storeName = item.customer_id?.store_name;
      if (storeName) {
        targetMap[storeName] = (targetMap[storeName] || 0) + (item.target_amount || 0);
      }
    });

    return NextResponse.json(targetMap);

  } catch (error: any) {
    console.error("[Customer Targets API Error]:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
