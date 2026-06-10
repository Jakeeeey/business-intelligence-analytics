import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SPRING_API_BASE_URL = process.env.SPRING_API_BASE_URL || "http://100.81.225.79:8086";
const COOKIE_NAME = "vos_access_token";

export async function GET(req: NextRequest) {
    const cookieStore = await cookies();
    const token =
        req.headers.get("authorization")?.replace("Bearer ", "") ||
        cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
        return NextResponse.json(
            { ok: false, message: "Unauthorized: Missing access token" },
            { status: 401 },
        );
    }

    if (!SPRING_API_BASE_URL) {
        console.error("[PDAR-API] SPRING_API_BASE_URL is not defined");
        return NextResponse.json(
            { ok: false, error: "Server Configuration Error" },
            { status: 500 },
        );
    }

    const { searchParams } = new URL(req.url);
    const baseUrl = SPRING_API_BASE_URL.replace(/\/+$/, "");

    // Use the view-table naming convention (view-*) that Spring Boot
    // security whitelists for JWT Bearer auth
    const targetUrl = new URL(`${baseUrl}/api/view-post-dispatch-drill-down/filter`);

    searchParams.forEach((value, key) => {
        targetUrl.searchParams.append(key, value);
    });

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };

    console.log("[PDAR-API] Calling:", targetUrl.toString());

    try {
        let springRes = await fetch(targetUrl.toString(), {
            method: "GET",
            headers,
            cache: "no-store",
        });

        let text = await springRes.text().catch(() => "");
        console.log("[PDAR-API] Response status:", springRes.status, "body:", text.slice(0, 200));

        // Fallback: try /all suffix if /filter doesn't work
        if (!springRes.ok) {
            const fallbackUrl = new URL(`${baseUrl}/api/view-post-dispatch-drill-down/all`);
            searchParams.forEach((value, key) => {
                fallbackUrl.searchParams.append(key, value);
            });
            console.log("[PDAR-API] Trying fallback:", fallbackUrl.toString());

            springRes = await fetch(fallbackUrl.toString(), {
                method: "GET",
                headers,
                cache: "no-store",
            });
            text = await springRes.text().catch(() => "");
            console.log("[PDAR-API] Fallback status:", springRes.status, "body:", text.slice(0, 200));
        }

        if (!springRes.ok) {
            console.error(`[PDAR-API] Upstream error ${springRes.status}:`, text.slice(0, 300));
            let errMsg = `Upstream error ${springRes.status}`;
            try {
                const parsed = JSON.parse(text);
                if (parsed.message) errMsg = parsed.message;
                else if (parsed.error) errMsg = parsed.error;
                else errMsg = text;
            } catch {
                if (text) errMsg = text;
            }
            return NextResponse.json({ ok: false, error: errMsg }, { status: springRes.status });
        }

        const data = text ? JSON.parse(text) : [];
        return NextResponse.json(data);
    } catch (err: unknown) {
        console.error("[PDAR-API] Request failed:", (err as Error).message);
        return NextResponse.json(
            { ok: false, error: "Gateway Error" },
            { status: 502 },
        );
    }
}
