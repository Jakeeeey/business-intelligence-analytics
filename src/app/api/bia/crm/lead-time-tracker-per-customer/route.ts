import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SPRING_API_BASE = process.env.SPRING_API_BASE_URL;
const DIRECTUS_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(
  /\/$/,
  "",
);
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

/**
 * 🔁 Customer Lead Time endpoint
 */
const SPRING_ENDPOINT = "/api/view-so-customer-lead-time/filter";

/**
 * 🔁 Filter keys for this module
 */
const FILTER_KEYS = [
  "customerCode",
  "poNo",
];

function getDirectusHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (DIRECTUS_TOKEN) h["Authorization"] = `Bearer ${DIRECTUS_TOKEN}`;
  return h;
}

export async function GET(req: NextRequest) {
  try {
    const token =
      req.headers.get("authorization")?.replace("Bearer ", "") ||
      req.cookies.get("vos_access_token")?.value;

    const { searchParams } = new URL(req.url);

    /**
     * =========================
     * DIRECTUS PROXY
     * =========================
     */
    const directusCollection = searchParams.get("directusCollection");

    if (directusCollection) {
      if (!DIRECTUS_BASE) {
        return NextResponse.json(
          { error: "DIRECTUS base URL not configured" },
          { status: 500 },
        );
      }

      const proxyParams = new URLSearchParams(searchParams.toString());
      proxyParams.delete("directusCollection");

      const target = `${DIRECTUS_BASE}/items/${encodeURIComponent(
        directusCollection,
      )}${proxyParams.toString() ? `?${proxyParams.toString()}` : ""}`;

      const res = await fetch(target, {
        method: "GET",
        headers: getDirectusHeaders(),
      });

      if (res.status === 401) {
        return NextResponse.json(
          { error: "Directus authentication failed" },
          { status: 502 },
        );
      }

      if (res.status === 403) {
        return NextResponse.json(
          {
            error:
              "Directus 403 Forbidden. Check DIRECTUS_STATIC_TOKEN permissions.",
          },
          { status: 502 },
        );
      }

      const text = await res.text();

      return new NextResponse(text, {
        status: res.status,
        headers: {
          "content-type":
            res.headers.get("content-type") || "application/json",
        },
      });
    }

    /**
     * =========================
     * AUTH CHECK
     * =========================
     */
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: no token provided" },
        { status: 401 },
      );
    }

    if (!SPRING_API_BASE) {
      return NextResponse.json(
        { error: "Spring API base URL is not configured" },
        { status: 500 },
      );
    }

    /**
     * =========================
     * SPRING API REQUEST
     * =========================
     */
    const url = new URL(`${SPRING_API_BASE}${SPRING_ENDPOINT}`);

    // Date range params
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (startDate) url.searchParams.append("startDate", startDate);
    if (endDate) url.searchParams.append("endDate", endDate);

    /**
     * MULTI-FILTER HANDLING (CSV)
     */
    const appendFilterValues = (name: string) => {
      const values = searchParams.getAll(name);

      const normalized = Array.from(
        new Set(
          values
            .map((v) => String(v ?? "").trim())
            .filter((v) => v.length > 0 && v.toLowerCase() !== "all"),
        ),
      );

      if (normalized.length === 0) return;

      url.searchParams.append(name, normalized.join(","));
    };

    FILTER_KEYS.forEach(appendFilterValues);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    /**
     * SAFE PARSE
     */
    const text = await response.text();

    let data: unknown = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      return NextResponse.json(
        {
          error: response.ok
            ? "Unexpected non-JSON response"
            : text || "Request failed",
        },
        { status: response.ok ? 502 : response.status },
      );
    }

    /**
     * HANDLE ERROR RESPONSE
     */
    if (!response.ok) {
      const dataObj =
        data && typeof data === "object"
          ? (data as Record<string, unknown>)
          : null;

      const errMsg =
        dataObj?.message || dataObj?.error || "Backend request failed";

      return NextResponse.json(
        { error: errMsg },
        { status: response.status },
      );
    }

    /**
     * NORMALIZE RESPONSE
     */
    let records: unknown[] = [];

    if (Array.isArray(data)) {
      records = data;
    } else if (data && typeof data === "object") {
      const dataObj = data as Record<string, unknown>;
      if (Array.isArray(dataObj.data)) {
        records = dataObj.data as unknown[];
      }
    }

    return NextResponse.json(records);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Internal server error";

    console.error("API Route Error:", error);

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
