import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIRECTUS_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

function getDirectusHeaders(): Headers {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  if (DIRECTUS_TOKEN) {
    headers.set("Authorization", `Bearer ${DIRECTUS_TOKEN}`);
  }
  return headers;
}

async function fetchFromDirectus(collection: string, extraParams = "") {
  const target = `${DIRECTUS_BASE}/items/${collection}?limit=-1${extraParams}`;
  const response = await fetch(target, {
    method: "GET",
    headers: getDirectusHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Directus error on ${collection}: ${response.status} - ${text}`);
  }

  const json = await response.json();
  return json.data || [];
}

export async function GET() {
  try {
    if (!DIRECTUS_BASE) {
      return NextResponse.json(
        { error: "Directus API base URL is not configured" },
        { status: 500 }
      );
    }

    // Fetch orders (only Delivered status), customers, salesmen, and suppliers
    const [salesOrders, customers, salesmen, suppliers] = await Promise.all([
      fetchFromDirectus("sales_order", "&filter[order_status][_eq]=Delivered"),
      fetchFromDirectus("customer"),
      fetchFromDirectus("salesman"),
      fetchFromDirectus("suppliers"),
    ]);

    return NextResponse.json({
      salesOrders,
      customers,
      salesmen,
      suppliers,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("CRM Monthly Sales Report API Route Error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
