import { NextRequest, NextResponse } from "next/server";

const UPSTREAM = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
const STATIC_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || "";

async function fetchDirectus(path: string) {
  const url = `${UPSTREAM}/${path.startsWith("/") ? path.slice(1) : path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${STATIC_TOKEN}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Directus error: ${res.status}`);
  }
  return await res.json();
}

/**
 * GET /api/bia/crm/target-setting-reports/supervisor-kpi/customer-peak
 * Query Params: storeNames (comma separated)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeNames = searchParams.get("storeNames")?.split(",") || [];

    if (storeNames.length === 0) {
      return NextResponse.json({});
    }

    // This is a heavy operation if there are many invoices. 
    // Ideally, the 'all' view would already contain this, but it doesn't.
    // For now, we fetch aggregated peak sales per storeName from sales_invoice.
    // However, sales_invoice usually has customer_code, not storeName.
    // We need to fetch the customer mapping first.

    // 1. Get customer codes for these store names
    const filter = JSON.stringify({
        store_name: { _in: storeNames }
    });
    const customersRes = await fetchDirectus(`items/customer?filter=${filter}&fields=customer_code,store_name&limit=-1`);
    const customers = customersRes.data || [];
    const nameToCode = new Map<string, string>(customers.map((c: any) => [c.store_name, c.customer_code]));
    const codes = customers.map((c: any) => c.customer_code).filter(Boolean);

    if (codes.length === 0) {
      return NextResponse.json({});
    }

    // 2. Fetch total accumulated sales since the beginning for these customers
    const aggregateQuery = JSON.stringify({
        customer_code: { _in: codes },
        transaction_status: { _eq: "POSTED" }
    });
    
    // We can use Directus aggregation for a simple SUM grouped by customer_code
    // But since limit is 32k and we have multiple customers, we'll fetch or aggregate
    const aggregateParams = new URLSearchParams({
        filter: aggregateQuery,
        aggregate: JSON.stringify({ sum: ["net_amount"] }),
        groupBy: "customer_code"
    });

    const aggRes = await fetchDirectus(`items/sales_invoice?${aggregateParams.toString()}`);
    const aggData = aggRes.data || [];

    const finalMap: Record<string, number> = {};
    const codeToTotal = new Map<string, number>(
        aggData.map((d: any) => [d.customer_code, Number(d.sum.net_amount) || 0])
    );

    // Map back to storeName
    storeNames.forEach(name => {
        const code = nameToCode.get(name);
        if (code) {
          finalMap[name] = codeToTotal.get(code) || 0;
        }
    });

    return NextResponse.json(finalMap);

  } catch (error: any) {
    console.error("[Customer Peak API Error]:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
