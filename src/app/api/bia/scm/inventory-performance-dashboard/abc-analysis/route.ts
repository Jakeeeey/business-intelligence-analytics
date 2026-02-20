import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SPRING_API_BASE_URL =
    process.env.SPRING_API_BASE_URL || "http://100.81.225.79:8083";
const COOKIE_NAME = "vos_access_token";

const AUTH_PAYLOAD_1 = {
    email: "ajsiapno60@men2corp.com",
    hashPassword: "6532132",
};

const AUTH_PAYLOAD_2 = {
    email: "ajsiapno60@men2corp.com",
    hashPassword: "andrei123",
};

async function performLogin() {
    const loginUrl = `${SPRING_API_BASE_URL.replace(/\/$/, "")}/auth/login`;

    console.log("[ABC-API] Attempting auto-login at:", loginUrl);

    // Try first password
    let response = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(AUTH_PAYLOAD_1),
    });

    if (!response.ok) {
        console.warn("[ABC-API] First login attempt failed, trying fallback...");
        // Try second password
        response = await fetch(loginUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(AUTH_PAYLOAD_2),
        });
    }

    if (!response.ok) {
        throw new Error(`Login failed (HTTP ${response.status})`);
    }

    const data = await response.json();
    const token = data.token || data.accessToken || data.access_token;

    if (!token) {
        throw new Error("No token returned from login API");
    }

    return token;
}

export async function GET(req: NextRequest) {
    const cookieStore = await cookies();
    let token = cookieStore.get(COOKIE_NAME)?.value;
    let loginPerformed = false;

    if (!token) {
        try {
            token = await performLogin();
            loginPerformed = true;
        } catch (err: any) {
            console.error("[ABC-API] Auto-login failed:", err.message);
            return NextResponse.json(
                { ok: false, message: `Unauthorized: ${err.message}` },
                { status: 401 },
            );
        }
    }

    const { searchParams } = new URL(req.url);
    const targetUrl = new URL(
        `${SPRING_API_BASE_URL.replace(/\/$/, "")}/api/view-abc-analysis-product/all`,
    );

    // Pass query params if any
    searchParams.forEach((value, key) => {
        targetUrl.searchParams.append(key, value);
    });

    try {
        let springRes = await fetch(targetUrl.toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
        });

        // If 401 and we haven't just logged in, try to relogin once
        if (springRes.status === 401 && !loginPerformed) {
            console.log("[ABC-API] Token expired (401), attempting re-login...");
            token = await performLogin();
            loginPerformed = true;

            springRes = await fetch(targetUrl.toString(), {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
            });
        }

        if (!springRes.ok) {
            console.error("[ABC-API] Upstream error:", springRes.status, springRes.statusText);
            return NextResponse.json({ ok: false, status: springRes.status }, { status: springRes.status });
        }

        const data = await springRes.json();
        const finalRes = NextResponse.json(data);

        // If login was performed, update the cookie
        if (loginPerformed && token) {
            finalRes.cookies.set({
                name: COOKIE_NAME,
                value: token,
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                path: "/",
                maxAge: 60 * 60 * 24, // 1 day
            });
        }

        return finalRes;
    } catch (err: any) {
        console.error("[ABC-API] Request failed:", err.message);
        return NextResponse.json(
            { ok: false, error: "Gateway Error" },
            { status: 502 },
        );
    }
}
