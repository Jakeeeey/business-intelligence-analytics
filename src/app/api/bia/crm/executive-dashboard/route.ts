// src/app/api/bia/crm/executive-dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export async function GET(req: NextRequest) {
  try {
    // Get authorization token from headers or cookies
    const cookieStore = await cookies();
    const token =
      req.headers.get("authorization")?.replace("Bearer ", "") ||
      cookieStore.get("vos_access_token")?.value;

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
    const endpoint = searchParams.get("endpoint");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!endpoint) {
      return NextResponse.json(
        { error: "endpoint query parameter is required" },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate parameters are required" },
        { status: 400 }
      );
    }

    let targetUrl: URL;
    
    const cleanBase = springBaseUrl.replace(/\/$/, "");

    // Resolve target path based on endpoint identity (no port swapping needed as everything resides on port 8086)
    switch (endpoint) {
      case "accounts-payable": {
        targetUrl = new URL(`${cleanBase}/api/view-accounts-payable/all`);
        targetUrl.searchParams.append("startDate", startDate);
        targetUrl.searchParams.append("endDate", endDate);
        break;
      }
      case "disbursement-itemized": {
        targetUrl = new URL(`${cleanBase}/api/view-disbursement-itemized/all`);
        targetUrl.searchParams.append("startDate", startDate);
        targetUrl.searchParams.append("endDate", endDate);
        break;
      }
      case "ar-per-supplier": {
        targetUrl = new URL(`${cleanBase}/api/view-ar-per-item-per-supplier/filter`);
        targetUrl.searchParams.append("startDate", startDate);
        targetUrl.searchParams.append("endDate", endDate);
        
        // Spring Boot requires the parameter presence. Default to empty string if omitted.
        const supplierName = searchParams.get("supplierName") || "";
        targetUrl.searchParams.append("supplierName", supplierName);
        break;
      }
      case "running-inventory": {
        targetUrl = new URL(`${cleanBase}/api/view-running-inventory-by-unit/all`);
        targetUrl.searchParams.append("startDate", startDate);
        targetUrl.searchParams.append("endDate", endDate);
        break;
      }
      case "sales-return": {
        targetUrl = new URL(`${cleanBase}/api/view-sales-return-per-item-supplier/filter`);
        targetUrl.searchParams.append("startDate", startDate);
        targetUrl.searchParams.append("endDate", endDate);
        
        // Spring Boot requires the parameters presence. Default to empty strings if omitted.
        const supplierName = searchParams.get("supplierName") || "";
        const productCode = searchParams.get("productCode") || "";
        const productName = searchParams.get("productName") || "";
        const returnStatus = searchParams.get("returnStatus") || "";
        
        targetUrl.searchParams.append("supplierName", supplierName);
        targetUrl.searchParams.append("productCode", productCode);
        targetUrl.searchParams.append("productName", productName);
        targetUrl.searchParams.append("returnStatus", returnStatus);
        break;
      }
      case "sales-report": {
        targetUrl = new URL(`${cleanBase}/api/view-sales-report-itemized/filtered`);
        targetUrl.searchParams.append("startDate", startDate);
        targetUrl.searchParams.append("endDate", endDate);
        break;
      }
      default:
        return NextResponse.json(
          { error: `Unknown endpoint mapping: ${endpoint}` },
          { status: 400 }
        );
    }

    // Call external Spring API with authorization headers
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
            : preview || `Failed to fetch executive data from endpoint: ${endpoint}`,
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
        `Failed to fetch executive data for endpoint ${endpoint} (status ${response.status})`;
      console.error(`[EXEC DASH PROXY] Endpoint [${endpoint}] failed:`, errMsg);
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

    console.log(`[EXEC DASH PROXY] Endpoint [${endpoint}] fetched ${records.length} records.`);
    if (records.length > 0) {
      console.log(`[EXEC DASH PROXY] First record of [${endpoint}]:`, JSON.stringify(records[0]));
    }

    return NextResponse.json(records);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("Executive Dashboard Proxy Error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
