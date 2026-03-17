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
      { ok: false, message: "Unauthorized: Missing session token" },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(req.url);
  if (!SPRING_API_BASE_URL) {
    console.error("[Fulfillment-API] SPRING_API_BASE_URL is not defined in environment variables");
    return NextResponse.json(
      { ok: false, error: "Server Configuration Error" },
      { status: 500 },
    );
  }

  const targetUrl = new URL(
    `${SPRING_API_BASE_URL.replace(/\/$/, "")}/api/view-supplier-fulfillment-rate-po/all`,
  );

  // Pass query params if any
  searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
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

    if (!springRes.ok)
      return NextResponse.json({ ok: false }, { status: springRes.status });

    const data = await springRes.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Gateway Error" },
      { status: 502 },
    );
  }
}
