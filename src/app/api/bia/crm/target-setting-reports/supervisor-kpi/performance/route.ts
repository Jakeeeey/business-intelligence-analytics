import { NextRequest, NextResponse } from "next/server";

/* ---------------- JWT Helpers (Self-contained) ---------------- */
function decodeJwtSub(token: string | null | undefined): number | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payloadPart = parts[1];
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

function getJwtSubFromReq(req: NextRequest): number | null {
  const token = req.cookies.get("vos_access_token")?.value ?? null;
  return decodeJwtSub(token);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SPRING_BASE = (process.env.SPRING_API_BASE_URL || "").replace(/\/+$/, "");

/**
 * Fetch all sales data from Spring Boot
 */
async function fetchAllSalesData(startDate?: string, endDate?: string, token?: string) {
  if (!SPRING_BASE) return [];

  const url = new URL(`${SPRING_BASE}/api/view-sales-performance/all`);
  if (startDate) url.searchParams.append("startDate", startDate);
  if (endDate) url.searchParams.append("endDate", endDate);

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url.toString(), {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error("Spring Fetch Error:", e);
    return [];
  }
}

/* ---------------- Main Route ---------------- */
export async function GET(req: NextRequest) {
  const sub = getJwtSubFromReq(req);
  if (!sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  try {
    const token = req.cookies.get("vos_access_token")?.value;
    const data = await fetchAllSalesData(startDate, endDate, token);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Fetch implementation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
