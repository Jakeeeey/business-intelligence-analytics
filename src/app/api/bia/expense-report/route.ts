import { NextRequest, NextResponse } from "next/server";

const SPRING_API_BASE = process.env.SPRING_API_BASE_URL;

export async function GET(req: NextRequest) {
  try {
    // Get authentication token from Authorization header or cookie
    const token =
      req.headers.get("authorization")?.replace("Bearer ", "") ||
      req.cookies.get("vos_access_token")?.value;

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

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate parameters are required" },
        { status: 400 },
      );
    }

    // Construct the URL to the Spring API
    const url = new URL(
      `${SPRING_API_BASE}/api/view-disbursement-itemized/all`,
    );
    url.searchParams.append("startDate", startDate);
    url.searchParams.append("endDate", endDate);

    // Start Directus suppliers lookup in parallel
    const upstreamBase = (
      process.env.UPSTREAM_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      ""
    ).replace(/\/+$/, "");
    const staticToken = process.env.DIRECTUS_STATIC_TOKEN;

    const directusHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (staticToken) {
      directusHeaders["Authorization"] = `Bearer ${staticToken}`;
    } else if (token) {
      directusHeaders["Authorization"] = `Bearer ${token}`;
    }

    const suppliersPromise = upstreamBase
      ? fetch(
          `${upstreamBase}/items/suppliers?limit=-1&fields=id,supplier_name,tin_number`,
          {
            headers: directusHeaders,
            cache: "no-store",
          },
        )
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      : Promise.resolve(null);

    // Fetch data from Spring API with authentication
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    // Read as text first so non-JSON responses don't throw
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
            : preview || "Failed to fetch expense data",
        },
        { status: response.ok ? 502 : response.status },
      );
    }

    if (!response.ok) {
      const dataObj =
        data && typeof data === "object"
          ? (data as Record<string, unknown>)
          : null;
      return NextResponse.json(
        {
          error:
            (dataObj && String(dataObj["message"] || dataObj["error"])) ||
            "Failed to fetch disbursement data",
        },
        { status: response.status },
      );
    }

    // Handle both array responses and wrapped responses
    let records: unknown[] = [];
    if (Array.isArray(data)) {
      records = data as unknown[];
    } else if (data && typeof data === "object") {
      const dataObj = data as Record<string, unknown>;
      const maybeData = dataObj["data"];
      if (Array.isArray(maybeData)) {
        records = maybeData as unknown[];
      }
    }

    // Enrich records with supplier TIN from suppliers table if available
    try {
      const supJson = await suppliersPromise;
      const supList = (supJson?.data || []) as Record<string, unknown>[];
      if (Array.isArray(supList) && supList.length > 0 && records.length > 0) {
        const tinById = new Map<number, string>();
        const tinByName = new Map<string, string>();

        for (const s of supList) {
          const sid = Number(s.id);
          const tin = s.tin_number ? String(s.tin_number).trim() : "";
          const name = s.supplier_name
            ? String(s.supplier_name).trim().toLowerCase()
            : "";
          if (tin) {
            if (sid) tinById.set(sid, tin);
            if (name) tinByName.set(name, tin);
          }
        }

        for (const raw of records) {
          if (raw && typeof raw === "object") {
            const rec = raw as Record<string, unknown>;
            if (!rec.supplierTin && !rec.tin && !rec.tin_number) {
              const sId = Number(rec.supplierId || rec.payeeId);
              const sName = String(
                rec.supplierName || rec.payeeName || "",
              )
                .trim()
                .toLowerCase();
              const matchedTin =
                (sId && tinById.get(sId)) || (sName && tinByName.get(sName));
              if (matchedTin) {
                rec.supplierTin = matchedTin;
                rec.tin_number = matchedTin;
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn("Failed to lookup supplier tin:", e);
    }

    return NextResponse.json(records);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Internal server error";
    console.error("Expense Report API Route Error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
