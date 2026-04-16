// src\app\api\bia\scm\logistics-performance\driver-kpi\route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SPRING_API_BASE = process.env.SPRING_API_BASE_URL;
const DIRECTUS_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(
  /\/$/,
  "",
);
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

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

      // Read body as text first so we can forward the exact upstream response
      // (status + body) to the frontend. This helps debugging auth/permission
      // failures returned by Directus instead of masking them as 502.
      const text = await res.text().catch(() => "");
      const contentType = res.headers.get("content-type") || "application/json";
      const respHeaders: Record<string, string> = {
        "content-type": contentType,
      };

      if (!res.ok) {
        console.error(
          `Directus proxy to ${target} returned ${res.status}: ${text.slice(0, 300)}`,
        );
        // Forward the upstream status and body to the client for easier debugging.
        return new NextResponse(
          text || JSON.stringify({ error: "Directus request failed" }),
          {
            status: res.status,
            headers: respHeaders,
          },
        );
      }

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

    const url = new URL(
      `${SPRING_API_BASE}/api/view-driver-customer-visit/filter`,
    );
    const driverNames = searchParams.getAll("driverNames");

    // If multiple driver names were provided, the upstream view cannot
    // accept multiple `driverNames` entries in a single request. Make one
    // request per driver and combine the results server-side to return a
    // single aggregated array to the frontend.
    if (driverNames && driverNames.length > 1) {
      const fetches = driverNames.map((n) => {
        const u = new URL(
          `${SPRING_API_BASE}/api/view-driver-customer-visit/filter`,
        );
        if (startDate) u.searchParams.append("startDate", startDate);
        if (endDate) u.searchParams.append("endDate", endDate);
        u.searchParams.append("driverNames", n);
        return fetch(u.toString(), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        })
          .then(async (res) => {
            const text = await res.text().catch(() => "");
            if (!res.ok) {
              const preview = text.slice(0, 300);
              throw new Error(
                `Upstream request for driver \"${n}\" failed: ${res.status} ${preview}`,
              );
            }
            try {
              return text ? JSON.parse(text) : null;
            } catch {
              throw new Error(
                `Unexpected non-JSON response from upstream for driver \"${n}\": ${text.slice(0, 300)}`,
              );
            }
          })
          .then((data) => {
            if (Array.isArray(data)) return data;
            if (data && typeof data === "object") {
              const dataObj = data as Record<string, unknown>;
              if (Array.isArray(dataObj.data as unknown[])) return dataObj.data as unknown[];
            }
            return [];
          });
      });

      const results = await Promise.all(fetches);
      // Flatten and dedupe exact-duplicate records
      const combined = results.flat();
      const seen = new Set<string>();
      const deduped = combined.filter((r) => {
        const k = JSON.stringify(r);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      return NextResponse.json(deduped);
    }

    if (startDate) url.searchParams.append("startDate", startDate);
    if (endDate) url.searchParams.append("endDate", endDate);
    // single driver (or none) — forward as before
    if (driverNames && driverNames.length === 1) {
      url.searchParams.append("driverNames", driverNames[0]);
    }

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
          error: errMsg || "Failed to fetch driver KPI data",
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
    console.error("Driver KPI API Route Error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
