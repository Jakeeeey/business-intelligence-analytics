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

    // Extract Params
    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get("supplierId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const size = searchParams.get("size") || "10000"; // High limit for pivot table

    if (!supplierId || !startDate || !endDate) {
        return NextResponse.json({ ok: false, message: "Missing required parameters" }, { status: 400 });
    }

    // Construct Spring URL mapping to the Product Movements Controller
    const targetUrl = new URL(`${springBaseUrl}/api/view-product-movements/by-supplier-and-date`);
    targetUrl.searchParams.append("supplierId", supplierId);
    targetUrl.searchParams.append("startDate", startDate);
    targetUrl.searchParams.append("endDate", endDate);
    targetUrl.searchParams.append("size", size);

    try {
        const springRes = await fetch(targetUrl.toString(), {
            headers: { "Authorization": `Bearer ${token}` },
            cache: "no-store",
        });

        if (!springRes.ok) return NextResponse.json({ ok: false }, { status: springRes.status });

        // Return exactly what Spring returns (matches your Spring Boot response map)
        return NextResponse.json(await springRes.json());
    } catch {
        return NextResponse.json({ ok: false }, { status: 502 });
    }
}