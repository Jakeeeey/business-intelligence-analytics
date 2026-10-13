import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "vos_access_token";

interface JwtPayload {
    id?: number | string;
    user_id?: number | string;
    sub?: number | string;
    role?: string;
    [key: string]: unknown;
}

function decodeJwt(token: string): JwtPayload | null {
    try {
        const parts = token.split(".");
        if (parts.length < 2) return null;
        let s = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        while (s.length % 4) s += "=";
        const json = Buffer.from(s, "base64").toString("utf8");
        return JSON.parse(json);
    } catch {
        return null;
    }
}

interface RawUserDashboardCard {
    id: number;
    user_id: number;
    dashboard_card_id: number | { id: number; key: string; description?: string };
    is_visible: number | boolean;
    order_index: number;
}

interface DashboardCard {
    id: number;
    key: string;
    description?: string | null;
    order_index?: number;
}

export async function GET(request: NextRequest) {
    const cookieStore = await cookies();
    const token =
        request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
        cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = decodeJwt(token);
    const userId = payload?.id ?? payload?.user_id ?? payload?.sub;

    if (!userId) {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
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
        // Step 1: Query user_dashboard_card for current user
        const userCardsUrl = `${baseUrl}/items/user_dashboard_card?filter=${encodeURIComponent(
            JSON.stringify({
                user_id: { _eq: userId },
                is_visible: { _eq: 1 },
            })
        )}&sort=order_index&limit=-1`;

        const userCardsRes = await fetch(userCardsUrl, {
            method: "GET",
            headers,
            next: { revalidate: 0 },
        });

        if (!userCardsRes.ok) {
            console.error("[My Dashboard API] Failed to fetch user_dashboard_card:", userCardsRes.status);
            return NextResponse.json({ cards: [] }, { status: 200 });
        }

        const userCardsJson = await userCardsRes.json();
        const userCards: RawUserDashboardCard[] = userCardsJson.data || [];

        if (userCards.length === 0) {
            return NextResponse.json({ cards: [], hasWildcardAccess: false }, { status: 200 });
        }

        // Step 2: Check if card ID 1 is assigned (Wildcard: view all cards)
        const hasWildcardAccess = userCards.some((item) => {
            const cardId = typeof item.dashboard_card_id === "object"
                ? item.dashboard_card_id?.id
                : item.dashboard_card_id;
            return Number(cardId) === 1;
        });

        if (hasWildcardAccess) {
            // Fetch all cards from dashboard_card
            const allCardsUrl = `${baseUrl}/items/dashboard_card?sort=id&limit=-1`;
            const allCardsRes = await fetch(allCardsUrl, {
                method: "GET",
                headers,
                next: { revalidate: 0 },
            });

            if (!allCardsRes.ok) {
                console.error("[My Dashboard API] Failed to fetch all dashboard_card:", allCardsRes.status);
                return NextResponse.json({ cards: [], hasWildcardAccess: true }, { status: 200 });
            }

            const allCardsJson = await allCardsRes.json();
            const allCards: DashboardCard[] = allCardsJson.data || [];

            return NextResponse.json({
                cards: allCards,
                hasWildcardAccess: true,
            });
        }

        // Step 3: Specific cards assigned to the user
        const cardOrderMap = new Map<number, number>();
        const cardIds: number[] = [];

        for (const item of userCards) {
            const cardId = Number(
                typeof item.dashboard_card_id === "object"
                    ? item.dashboard_card_id?.id
                    : item.dashboard_card_id
            );
            if (!Number.isNaN(cardId)) {
                cardIds.push(cardId);
                cardOrderMap.set(cardId, item.order_index ?? 0);
            }
        }

        if (cardIds.length === 0) {
            return NextResponse.json({ cards: [], hasWildcardAccess: false }, { status: 200 });
        }

        const cardsUrl = `${baseUrl}/items/dashboard_card?filter=${encodeURIComponent(
            JSON.stringify({ id: { _in: cardIds } })
        )}&limit=-1`;

        const cardsRes = await fetch(cardsUrl, {
            method: "GET",
            headers,
            next: { revalidate: 0 },
        });

        if (!cardsRes.ok) {
            console.error("[My Dashboard API] Failed to fetch dashboard_card:", cardsRes.status);
            return NextResponse.json({ cards: [], hasWildcardAccess: false }, { status: 200 });
        }

        const cardsJson = await cardsRes.json();
        const cards: DashboardCard[] = cardsJson.data || [];

        // Sort by user's order_index
        cards.sort((a, b) => (cardOrderMap.get(a.id) ?? 0) - (cardOrderMap.get(b.id) ?? 0));

        return NextResponse.json({
            cards,
            hasWildcardAccess: false,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[My Dashboard API] Error:", message);
        return NextResponse.json({ error: "Internal Server Error", message }, { status: 500 });
    }
}
