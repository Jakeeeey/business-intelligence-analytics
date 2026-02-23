// src/app/api/bia/arf/variance-analysis/inventory-variances/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    const cookieStore = await cookies();
    const token = cookieStore.get("vos_access_token")?.value;

    const springBaseUrl = process.env.SPRING_API_BASE_URL;
    const targetUrl = new URL(`${springBaseUrl}/api/bia/arf/variance-analysis/inventory-variances`);

    // ✅ DYNAMIC FIX: Forward EVERY parameter (startDate, endDate, branchId, etc.)
    // to the Spring Boot backend automatically.
    searchParams.forEach((value, key) => {
        targetUrl.searchParams.append(key, value);
    });

    try {
        const res = await fetch(targetUrl.toString(), {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!res.ok) {
            return NextResponse.json(
                { error: `Backend returned ${res.status}` },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Next.js Proxy Error:", error);
        return NextResponse.json({ error: "Failed to connect to VOS Server" }, { status: 500 });
    }
}