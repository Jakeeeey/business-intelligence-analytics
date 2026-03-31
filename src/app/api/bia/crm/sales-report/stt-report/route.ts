// src/app/api/bia/crm/sales-report/stt-report/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SPRING_API_BASE = process.env.SPRING_API_BASE_URL;
const DIRECTUS_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || "";

function getDirectusHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (DIRECTUS_TOKEN) h["Authorization"] = `Bearer ${DIRECTUS_TOKEN}`;
  return h;
}

export async function GET(req: NextRequest) {
  try {
    const token =
      req.headers.get("authorization")?.replace("Bearer ", "") ||
      req.cookies.get("vos_access_token")?.value;

    const { searchParams } = new URL(req.url);

    // If the frontend requested a Directus collection proxy, forward to Directus
    // using the configured NEXT_PUBLIC_API_BASE_URL. Use the `directusCollection`
    // query parameter to indicate which collection to fetch and forward any
    // additional query params (fields, limit, etc.). Do not require the
    // SPRING API token for directus proxying.
    const directusCollection = searchParams.get("directusCollection");
    if (directusCollection) {
      if (!DIRECTUS_BASE) {
        return NextResponse.json(
          { error: "DIRECTUS base URL not configured" },
          { status: 500 },
        );
      }

      // Build target URL with remaining search params except `directusCollection`
      // Use the string form to construct a new URLSearchParams (avoids `any` casting)
      const proxyParams = new URLSearchParams(searchParams.toString());
      proxyParams.delete("directusCollection");
      const target = `${DIRECTUS_BASE}/items/${encodeURIComponent(
        directusCollection,
      )}${proxyParams.toString() ? `?${proxyParams.toString()}` : ""}`;

      const headers = getDirectusHeaders();

      const res = await fetch(target, { method: "GET", headers });

      // If Directus returns 401, provide a clearer error so frontend can
      // surface a helpful message to developers/admins (invalid static token).
      if (res.status === 401) {
        const txt = await res.text().catch(() => "");
        let msg = "Directus authentication failed";
        try {
          const parsed = txt ? JSON.parse(txt) : null;
          if (parsed && typeof parsed === "object") {
            const p = parsed as Record<string, unknown>;
            if (typeof p.message === "string") {
              msg = `Directus authentication failed: ${p.message}`;
            } else if (typeof p.error === "string") {
              msg = `Directus authentication failed: ${p.error}`;
            } else if (txt) {
              msg = `Directus authentication failed: ${txt}`;
            }
          } else if (txt) {
            msg = `Directus authentication failed: ${txt}`;
          }
        } catch {
          if (txt) msg = `Directus authentication failed: ${txt}`;
        }
        console.error(msg);
        return NextResponse.json({ error: msg }, { status: 502 });
      }

      const text = await res.text();
      const contentType = res.headers.get("content-type") || "application/json";
      const respHeaders: Record<string, string> = {
        "content-type": contentType,
      };
      return new NextResponse(text, {
        status: res.status,
        headers: respHeaders,
      });
    }

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

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    // const branches = searchParams.getAll("branches");
    // const salesmen = searchParams.getAll("salesman");
    // const statuses = searchParams.getAll("statuses");
    // const suppliers = searchParams.getAll("suppliers");

    const url = new URL(
      `${SPRING_API_BASE}/api/view-sales-report-itemized/filtered`,
    );
    if (startDate) url.searchParams.append("startDate", startDate);
    if (endDate) url.searchParams.append("endDate", endDate);

    // NOTE: Do not forward multi-value filters (branches/salesman/statuses/suppliers)
    // to the Spring API. The frontend will fetch the full date-range result and
    // apply multi-value filtering client-side to avoid incompatibilities with
    // the backend's expected single-value filter parameters.

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    // Read as text first so non-JSON responses (HTML errors, empty body) don't throw
    const text = await response.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      const preview = text.slice(0, 300);
      return NextResponse.json(
        {
          error: response.ok
            ? `Unexpected non-JSON response from data server: ${preview}`
            : preview || "Failed to fetch data",
        },
        { status: response.ok ? 502 : response.status },
      );
    }

    if (!response.ok) {
      const dataObj =
        data && typeof data === "object"
          ? (data as Record<string, unknown>)
          : null;
      const errMsg = dataObj
        ? typeof dataObj["message"] === "string"
          ? (dataObj["message"] as string)
          : typeof dataObj["error"] === "string"
            ? (dataObj["error"] as string)
            : undefined
        : undefined;
      return NextResponse.json(
        {
          error: errMsg || "Failed to fetch sales report itemized data",
        },
        { status: response.status },
      );
    }

    let records: unknown[] = [];
    if (Array.isArray(data)) {
      records = data;
    } else if (data && typeof data === "object") {
      // Check if response has a .data property (cast to a record to access keys)
      const dataObj = data as Record<string, unknown>;
      if (Array.isArray(dataObj.data)) {
        records = dataObj.data as unknown[];
      }
    }

    return NextResponse.json(records);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Internal server error";
    console.error("Sales Report Summary API Route Error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
