import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const cookieStore = await cookies();
    const token = cookieStore.get("vos_access_token")?.value;

    if (!token) return NextResponse.json({ ok: false }, { status: 401 });

    const springBaseUrl = process.env.SPRING_API_BASE_URL?.replace(/\/$/, "");
    if (!springBaseUrl) return NextResponse.json({ ok: false }, { status: 500 });

    // Extract Dates
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Construct Spring URL mapping to the Unfulfilled Orders Controller
    const targetUrl = new URL(`${springBaseUrl}/api/v-unfulfilled-orders`);
    if (startDate) targetUrl.searchParams.append("startDate", startDate);
    if (endDate) targetUrl.searchParams.append("endDate", endDate);

    try {
        const springRes = await fetch(targetUrl.toString(), {
            headers: { "Authorization": `Bearer ${token}` },
            cache: "no-store",
        });

        if (!springRes.ok) return NextResponse.json({ ok: false }, { status: springRes.status });

        // Return exactly what Spring returns (the raw JSON array), matching your pattern
        return NextResponse.json(await springRes.json());
    } catch (err) {
        return NextResponse.json({ ok: false }, { status: 502 });
    }
}