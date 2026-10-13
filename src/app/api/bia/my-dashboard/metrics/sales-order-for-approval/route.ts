import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "vos_access_token";

export async function GET(request: NextRequest) {
    const cookieStore = await cookies();
    const token =
        request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
        cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        const query = `${baseUrl}/items/sales_order?aggregate[count]=order_id&aggregate[sum]=total_amount&filter[order_status][_eq]=For Approval`;
        const res = await fetch(query, {
            method: "GET",
            headers,
            next: { revalidate: 0 },
        });

        if (!res.ok) {
            console.error("[Sales Order For Approval Metric] Directus error:", res.status);
            return NextResponse.json({ error: "Failed to fetch metric" }, { status: res.status });
        }

        const json = await res.json();
        const agg = json.data?.[0] || {};
        const count = Number(agg.count?.order_id ?? 0);
        const totalAmount = Number(agg.sum?.total_amount ?? 0);

        return NextResponse.json({
            count,
            totalAmount,
            status: "For Approval",
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[Sales Order For Approval Metric] Error:", message);
        return NextResponse.json({ error: "Internal Server Error", message }, { status: 500 });
    }
}
