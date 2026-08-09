import { NextRequest, NextResponse } from "next/server";

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

export async function GET(req: NextRequest) {
  try {
    if (!DIRECTUS_BASE) {
      return NextResponse.json(
        { error: "Directus API base URL is not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (type) {
      if (type !== "customer_prospect" && type !== "salesman" && type !== "store_type") {
        return NextResponse.json(
          { error: "Invalid type parameter requested" },
          { status: 400 }
        );
      }
      const extra = type === "customer_prospect" ? "&filter[prospect_status][_eq]=pending" : "";
      const data = await fetchFromDirectus(type, extra);
      return NextResponse.json(data);
    }

    // Default: fetch all in parallel
    const [customerProspects, salesmen, storeTypes] = await Promise.all([
      fetchFromDirectus("customer_prospect", "&filter[prospect_status][_eq]=pending"),
      fetchFromDirectus("salesman"),
      fetchFromDirectus("store_type"),
    ]);

    return NextResponse.json({
      customerProspects,
      salesmen,
      storeTypes,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("Prospecting BIA API Route Error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
