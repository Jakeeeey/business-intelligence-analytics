import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SPRING_API_BASE_URL = process.env.SPRING_API_BASE_URL;
const COOKIE_NAME = "vos_access_token";

export async function GET(req: NextRequest) {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
        return NextResponse.json(
            { ok: false, message: "Unauthorized: Missing access token" },
            { status: 401 },
        );
    }

    const { searchParams } = new URL(req.url);
    if (!SPRING_API_BASE_URL) {
        console.error("[ABC-API] SPRING_API_BASE_URL is not defined in environment variables");
        return NextResponse.json(
            { ok: false, error: "Server Configuration Error" },
            { status: 500 },
        );
    }

    const targetUrl = new URL(
        `${SPRING_API_BASE_URL.replace(/\/$/, "")}/api/view-abc-analysis-product/all`,
    );

    // Map parameters: from -> startDate, to -> endDate
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (from) targetUrl.searchParams.append("startDate", from);
    if (to) targetUrl.searchParams.append("endDate", to);

    // Pass other query params if any
    searchParams.forEach((value, key) => {
        if (key !== "from" && key !== "to") {
            targetUrl.searchParams.append(key, value);
        }
    });

    try {
        const springRes = await fetch(targetUrl.toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
        });

        if (!springRes.ok) {
            console.error("[ABC-API] Upstream error:", springRes.status, springRes.statusText);
            return NextResponse.json({ ok: false, status: springRes.status }, { status: springRes.status });
        }

        const data = await springRes.json();
        return NextResponse.json(data);
    } catch (err: any) {
        console.error("[ABC-API] Request failed:", err.message);
        return NextResponse.json(
            { ok: false, error: "Gateway Error" },
            { status: 502 },
        );
    }
}
