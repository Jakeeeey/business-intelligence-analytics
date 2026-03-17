// src/lib/directus.ts
import { NextRequest } from "next/server";

/**
 * Decode JWT payload without verification.
 * Extracts payload.sub as a number (or null).
 */
export function decodeJwtSub(token: string | null | undefined): number | null {
    if (!token) return null;

    const parts = token.split(".");
    if (parts.length < 2) return null;

    try {
        const payloadPart = parts[1];

        // base64url -> base64 with proper padding
        const payloadB64 = payloadPart
            .replace(/-/g, "+")
            .replace(/_/g, "/")
            .padEnd(Math.ceil(payloadPart.length / 4) * 4, "=");

        const json = Buffer.from(payloadB64, "base64").toString("utf8");
        const payload = JSON.parse(json);

        const sub = payload?.sub;
        const n = Number(sub);
        return Number.isFinite(n) ? n : null;
    } catch {
        return null;
    }
}

/**
 * ✅ Route Handlers should use req.cookies (not next/headers cookies()).
 */
export function getJwtSubFromReq(req: NextRequest): number | null {
    const token = req.cookies.get("vos_access_token")?.value ?? null;
    return decodeJwtSub(token);
}
