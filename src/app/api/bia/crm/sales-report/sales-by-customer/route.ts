import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token =
            req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
            req.cookies.get("vos_access_token")?.value ||
            cookieStore.get("vos_access_token")?.value ||
            req.cookies.get("access_token")?.value ||
            cookieStore.get("access_token")?.value;

        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized: no access token provided" },
                { status: 401 }
            );
        }

        const springBaseUrl = process.env.SPRING_API_BASE_URL;
        if (!springBaseUrl) {
            return NextResponse.json(
                { error: "SPRING_API_BASE_URL is not configured in local environment" },
                { status: 500 }
            );
        }

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: "startDate and endDate parameters are required" },
                { status: 400 }
            );
        }

        const cleanBase = springBaseUrl.replace(/\/$/, "");
        // Reuse the executive dashboard sales-report endpoint: /api/view-sales-report-itemized/filtered
        const targetUrl = new URL(`${cleanBase}/api/view-sales-report-itemized/filtered`);
        targetUrl.searchParams.append("startDate", startDate);
        targetUrl.searchParams.append("endDate", endDate);

        const response = await fetch(targetUrl.toString(), {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        const text = await response.text();
        let data: unknown = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            const preview = text.slice(0, 300);
            return NextResponse.json(
                {
                    error: response.ok
                        ? `Unexpected non-JSON response from backend server: ${preview}`
                        : preview || "Failed to fetch sales data",
                },
                { status: response.ok ? 502 : response.status }
            );
        }

        if (!response.ok) {
            const dataObj =
                data && typeof data === "object"
                    ? (data as Record<string, unknown>)
                    : null;
            const errMsg =
                (dataObj && (dataObj.message || dataObj.error)) ||
                `Failed to fetch sales report data (status ${response.status})`;
            console.error("[Sales By Customer API] Backend error:", errMsg);
            return NextResponse.json({ error: String(errMsg) }, { status: response.status });
        }

        let records: unknown[] = [];
        if (Array.isArray(data)) {
            records = data;
        } else if (data && typeof data === "object") {
            const dataObj = data as Record<string, unknown>;
            if (Array.isArray(dataObj.data)) {
                records = dataObj.data;
            }
        }

        return NextResponse.json(records);
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Internal server error";
        console.error("Sales By Customer API Error:", error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
