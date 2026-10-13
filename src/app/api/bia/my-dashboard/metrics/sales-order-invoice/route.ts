import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "vos_access_token";

interface CachedInvoicePayload {
    data: {
        count: number;
        totalAmount: number;
        status: string;
    };
    timestamp: number;
}

let serverInvoiceCache: CachedInvoicePayload | null = null;
const SERVER_CACHE_TTL_MS = 60000; // 60s default server TTL

export async function GET(request: NextRequest) {
    const cookieStore = await cookies();
    const token =
        request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
        cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const force = request.nextUrl.searchParams.get("force") === "true";
    if (!force && serverInvoiceCache && Date.now() - serverInvoiceCache.timestamp < SERVER_CACHE_TTL_MS) {
        return NextResponse.json(serverInvoiceCache.data);
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
    const staticToken = process.env.DIRECTUS_STATIC_TOKEN;

    if (!baseUrl) {
        return NextResponse.json({ error: "Directus API base URL not configured" }, { status: 500 });
    }

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (staticToken) {
        headers["Authorization"] = `Bearer ${staticToken}`;
    }

    try {
        const query = `${baseUrl}/items/sales_order?aggregate[count]=order_id&aggregate[sum]=total_amount&filter[order_status][_eq]=${encodeURIComponent("For Invoicing")}`;
        const res = await fetch(query, {
            method: "GET",
            headers,
            cache: "no-store",
        });

        if (!res.ok) {
            console.error("[Sales Order Invoice Metric] Directus error:", res.status);
            return NextResponse.json({ error: "Failed to fetch metric" }, { status: res.status });
        }

        const json = await res.json();
        const agg = json.data?.[0] || {};
        const count = Number(agg.count?.order_id ?? 0);
        const totalAmount = Number(agg.sum?.total_amount ?? 0);

        const payload = {
            count,
            totalAmount,
            status: "For Invoicing",
        };

        serverInvoiceCache = { data: payload, timestamp: Date.now() };

        return NextResponse.json(payload);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[Sales Order Invoice Metric] Error:", message);
        return NextResponse.json({ error: "Internal Server Error", message }, { status: 500 });
    }
}
