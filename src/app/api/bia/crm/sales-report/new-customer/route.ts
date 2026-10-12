import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const env = (process as unknown as { env: Record<string, string | undefined> }).env;
const DIRECTUS_BASE = (env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const DIRECTUS_TOKEN = env.DIRECTUS_STATIC_TOKEN;

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
    // Directus requires limit to be a non-negative number
    const target = `${DIRECTUS_BASE}/items/${collection}?limit=10000${extraParams}`;
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
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        let customerFilter = "&sort=-date_entered";
        if (startDate && endDate) {
            customerFilter += `&filter[date_entered][_between]=${startDate}T00:00:00,${endDate}T23:59:59`;
        } else if (startDate) {
            customerFilter += `&filter[date_entered][_gte]=${startDate}T00:00:00`;
        } else if (endDate) {
            customerFilter += `&filter[date_entered][_lte]=${endDate}T23:59:59`;
        }

        // Fetch customers, store types, and users in parallel
        const [customers, storeTypes, users] = await Promise.all([
            fetchFromDirectus("customer", customerFilter).catch(() =>
                // Fallback without date filter if directus between syntax differs
                fetchFromDirectus("customer", "&sort=-date_entered")
            ),
            fetchFromDirectus("store_type").catch(() => []),
            fetchFromDirectus("user").catch(() => []),
        ]);

        return NextResponse.json({
            customers,
            storeTypes,
            users,
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Internal server error";
        console.error("New Customer API Route Error:", error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
