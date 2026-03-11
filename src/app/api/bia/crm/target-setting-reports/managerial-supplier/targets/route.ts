import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIRECTUS_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || "";

function directusHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${DIRECTUS_TOKEN}`,
  };
}

async function fetchDirectus<T>(path: string): Promise<T> {
  const url = `${DIRECTUS_BASE}${path}`;
  const res = await fetch(url, { cache: "no-store", headers: directusHeaders() });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Directus error (${res.status}): ${text}`);
  }

  return (await res.json()) as T;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate"); // YYYY-MM-DD
    const endDate = searchParams.get("endDate");     // YYYY-MM-DD

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Missing startDate or endDate" }, { status: 400 });
    }

    const divisionId = searchParams.get("divisionId");

    // 1. Fetch TSD (target_setting_division) filtered by fiscal_period and optional divisionId
    let tsdUrl = `/items/target_setting_division?filter[fiscal_period][_between]=[${startDate},${endDate}]&limit=-1`;
    if (divisionId) {
      tsdUrl += `&filter[division_id][_eq]=${divisionId}`;
    }

    const tsdRes = await fetchDirectus<{ data: Record<string, unknown>[] }>(tsdUrl);
    const tsdData = tsdRes.data || [];

    if (tsdData.length === 0) {
      return NextResponse.json({ supplierTargets: [], salesmanTargets: [] });
    }

    const tsdIds = tsdData.map(d => d.id);

    // 2. Fetch Supplier Targets (target_setting_supplier) by tsd_id
    // Directus _in filter uses comma-separated values
    const tssUrl = `/items/target_setting_supplier?filter[tsd_id][_in]=${tsdIds.join(",")}&filter[fiscal_period][_between]=[${startDate},${endDate}]&limit=-1&fields=id,tsd_id,supplier_id,target_amount,fiscal_period`;
    const tssRes = await fetchDirectus<{ data: Record<string, unknown>[] }>(tssUrl);
    const tssData = tssRes.data || [];

    // 3. Fetch Salesman Targets (target_setting_salesman)
    // Based on target_setting_supervisor (which usually links to TS Supplier)
    // Actually, following the user's flow: target_setting_division -> target_setting_supplier -> target_setting_supervisor -> target_setting_salesman

    const tssIds = tssData.map(s => s.id);
    let supervisorTargets: Record<string, unknown>[] = [];
    let salesmanTargets: Record<string, unknown>[] = [];

    if (tssIds.length > 0) {
      const tspUrl = `/items/target_setting_supervisor?filter[tss_id][_in]=${tssIds.join(",")}&filter[fiscal_period][_between]=[${startDate},${endDate}]&limit=-1&fields=id,tss_id,supervisor_user_id,target_amount,fiscal_period`;
      const tspRes = await fetchDirectus<{ data: Record<string, unknown>[] }>(tspUrl);
      supervisorTargets = tspRes.data || [];

      const tspIds = supervisorTargets.map(s => s.id);
      if (tspIds.length > 0) {
        const tslUrl = `/items/target_setting_salesman?filter[ts_supervisor_id][_in]=${tspIds.join(",")}&filter[fiscal_period][_between]=[${startDate},${endDate}]&limit=-1&fields=id,ts_supervisor_id,salesman_id,supplier_id,target_amount,fiscal_period`;
        const tslRes = await fetchDirectus<{ data: Record<string, unknown>[] }>(tslUrl);
        salesmanTargets = tslRes.data || [];
      }
    }

    return NextResponse.json({
      divisionTargets: tsdData,
      supplierTargets: tssData,
      supervisorTargets: supervisorTargets,
      salesmanTargets: salesmanTargets
    });

  } catch (error: unknown) {
    const errorObj = error as Error & { message?: string };
    console.error("[Managerial Targets API Error]:", errorObj.message);
    return NextResponse.json({ error: errorObj.message }, { status: 500 });
  }
}
