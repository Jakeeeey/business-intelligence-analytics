// src/app/api/bia/scm/inventory-performance-dashboard/fns-analysis/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SPRING_API_BASE_URL =
    process.env.SPRING_API_BASE_URL;
const COOKIE_NAME = "vos_access_token";

/* ------------------------------------------------------------------ */
/*  GET Handler                                                       */
/* ------------------------------------------------------------------ */

/**
 * Fetches FNS pick-frequency data from Spring Boot and returns a
 * unified response for the client.
 *
 * All data (product name, supplier, branch) comes directly from
 * the Spring Boot response — no Directus enrichment needed.
 */
export async function GET(req: NextRequest) {
    try {
        // ── 1. Auth: read session cookie ────────────────────────────────
        const cookieStore = await cookies();
        const token = cookieStore.get(COOKIE_NAME)?.value;

        if (!token) {
            console.error("[fns-analysis] No vos_access_token cookie found");
            return NextResponse.json(
                { error: "Unauthorized: Missing session token", code: "AUTH_DENIED" },
                { status: 401 },
            );
        }

        // ── 2. Fetch FNS data from Spring Boot ─────────────────────────
        const springUrl = `${SPRING_API_BASE_URL}/api/view-fns-pick-frequency/all`;
        console.log("[fns-analysis] Fetching from Spring Boot:", springUrl);

        const springRes = await fetch(springUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
        });

        if (!springRes.ok) {
            const body = await springRes.text().catch(() => "");
            console.error("[fns-analysis] Spring Boot error:", springRes.status, body);
            return NextResponse.json(
                { error: `Spring Boot returned ${springRes.status}`, detail: body, code: "SPRING_ERROR" },
                { status: springRes.status },
            );
        }

        const fnsItems: any[] = await springRes.json();
        console.log("[fns-analysis] Spring Boot returned", fnsItems.length, "items");

        // ── 3. Enrich and build response ───────────────────────────────
        let fastCount = 0;
        let normalCount = 0;
        let slowCount = 0;
        let fastThreshold = 15;
        let normalThreshold = 5;

        // Sort by pickCount descending for ranking
        const sorted = [...fnsItems].sort(
            (a, b) => (Number(b?.outboundTxnCount) || 0) - (Number(a?.outboundTxnCount) || 0),
        );

        const enrichedRows = sorted.map((item, idx) => {
            const fnsClass = String(item?.fnsClass ?? "S") as "F" | "N" | "S";

            if (fnsClass === "F") fastCount++;
            else if (fnsClass === "N") normalCount++;
            else slowCount++;

            // Use thresholds from first available record
            if (idx === 0) {
                fastThreshold = Number(item?.fastThreshold) || 15;
                normalThreshold = Number(item?.normalThreshold) || 5;
            }

            return {
                rank: idx + 1,
                productName: String(item?.productDescription ?? item?.productName ?? "").trim() || "—",
                supplierName: String(item?.supplierName ?? "").trim() || "—",
                pickCount: Number(item?.outboundTxnCount) || 0,
                fnsClass,
                productId: Number(item?.productId) || 0,
                branchId: Number(item?.branchId) || 0,
                branchName: String(item?.branchName ?? "").trim() || "—",
            };
        });

        const totalCount = fastCount + normalCount + slowCount;

        return NextResponse.json({
            data: enrichedRows,
            summary: {
                fastCount,
                normalCount,
                slowCount,
                totalCount,
                fastThreshold,
                normalThreshold,
            },
        });
    } catch (error) {
        console.error("[fns-analysis] Unhandled error:", error);
        return NextResponse.json(
            { error: String(error), code: "INTERNAL_FAIL" },
            { status: 500 },
        );
    }
}
