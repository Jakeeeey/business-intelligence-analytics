import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const cookieStore = await cookies();
    const token = cookieStore.get("vos_access_token")?.value;

    if (!token) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

    const springBaseUrl = process.env.SPRING_API_BASE_URL;
    if (!springBaseUrl) return NextResponse.json({ ok: false, message: "Server config missing" }, { status: 500 });

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const cleanBase = springBaseUrl.replace(/\/$/, "");
    const targetUrl = new URL(`${cleanBase}/api/view-sales-performance/all`);
    
    if (startDate) targetUrl.searchParams.append("startDate", startDate);
    if (endDate) targetUrl.searchParams.append("endDate", endDate);

    try {
        const springRes = await fetch(targetUrl.toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            cache: "no-store",
        });

        if (!springRes.ok) return NextResponse.json({ ok: false }, { status: springRes.status });

        const data = await springRes.json();
        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json({ ok: false }, { status: 502 });
    }
}