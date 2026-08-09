// src/app/api/bia/scm/stock-out-monitoring/orders-vs-consolidated/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SPRING_API_BASE = process.env.SPRING_API_BASE_URL;
const DIRECTUS_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(
  /\/+$/,
  "",
);
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || "";

async function fetchDirectusLookups() {
  if (!DIRECTUS_BASE) {
    return {
      invoiceMap: new Map<
        string,
        { invoiceNos: Set<string>; customerCodes: Set<string> }
      >(),
      customerMap: new Map<string, string>(),
    };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (DIRECTUS_TOKEN) headers["Authorization"] = `Bearer ${DIRECTUS_TOKEN}`;

  try {
    const [siRes, custRes] = await Promise.all([
      fetch(
        `${DIRECTUS_BASE}/items/sales_invoice?fields=order_id,invoice_no,customer_code&limit=-1`,
        {
          headers,
          cache: "no-store",
        },
      ),
      fetch(
        `${DIRECTUS_BASE}/items/customer?fields=customer_code,customer_name&limit=-1`,
        {
          headers,
          cache: "no-store",
        },
      ),
    ]);

    const invoiceMap = new Map<
      string,
      { invoiceNos: Set<string>; customerCodes: Set<string> }
    >();
    const customerMap = new Map<string, string>();

    if (custRes.ok) {
      const custJson = await custRes.json().catch(() => null);
      const custData = Array.isArray(custJson?.data)
        ? custJson.data
        : Array.isArray(custJson)
          ? custJson
          : [];
      for (const c of custData) {
        const code = String(c?.customer_code ?? "").trim();
        const name = String(c?.customer_name ?? "").trim();
        if (code && name) customerMap.set(code, name);
      }
    }

    if (siRes.ok) {
      const siJson = await siRes.json().catch(() => null);
      const siData = Array.isArray(siJson?.data)
        ? siJson.data
        : Array.isArray(siJson)
          ? siJson
          : [];
      for (const si of siData) {
        const orderId = String(si?.order_id ?? "").trim();
        const invNo = String(si?.invoice_no ?? "").trim();
        const custCode = String(si?.customer_code ?? "").trim();
        if (!orderId) continue;

        let entry = invoiceMap.get(orderId);
        if (!entry) {
          entry = { invoiceNos: new Set(), customerCodes: new Set() };
          invoiceMap.set(orderId, entry);
        }
        if (invNo) entry.invoiceNos.add(invNo);
        if (custCode) entry.customerCodes.add(custCode);
      }
    }

    return { invoiceMap, customerMap };
  } catch (err) {
    console.warn("Directus lookup fetch failed in orders-vs-consolidated:", err);
    return {
      invoiceMap: new Map<
        string,
        { invoiceNos: Set<string>; customerCodes: Set<string> }
      >(),
      customerMap: new Map<string, string>(),
    };
  }
}

export async function GET(req: NextRequest) {
  try {
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
    const supplierId = searchParams.get("supplierId");

    // Date filtering is done entirely client-side.
    // Do NOT pass date params to the Spring API — it fetches all data.
    const endpoint = supplierId
      ? `${SPRING_API_BASE}/api/v1/order-discrepancies/supplier/${supplierId}`
      : `${SPRING_API_BASE}/api/v1/order-discrepancies/all`;

    const url = new URL(endpoint);

    const [response, { invoiceMap, customerMap }] = await Promise.all([
      fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }),
      fetchDirectusLookups(),
    ]);

    const text = await response.text();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any = null;
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
      return NextResponse.json(
        {
          error:
            data?.message ||
            data?.error ||
            "Failed to fetch orders vs consolidated data",
        },
        { status: response.status },
      );
    }

    let records: unknown[] = [];
    if (Array.isArray(data)) {
      records = data;
    } else if (data && typeof data === "object") {
      if (Array.isArray(data.data)) {
        records = data.data;
      }
    }

    const enrichedRecords = records.map((item) => {
      if (!item || typeof item !== "object") return item;
      const rec = item as Record<string, unknown>;

      const orderNo = String(rec.orderNo ?? rec.order_no ?? "").trim();
      const orderId = String(rec.orderId ?? rec.order_id ?? "").trim();

      const invEntry =
        (orderNo ? invoiceMap.get(orderNo) : null) ||
        (orderId ? invoiceMap.get(orderId) : null);

      let invoiceNo = rec.invoiceNo ?? rec.invoice_no ?? null;
      let customerCode = rec.customerCode ?? rec.customer_code ?? null;
      let customerName = rec.customerName ?? rec.customer_name ?? null;

      if (!invoiceNo && invEntry && invEntry.invoiceNos.size > 0) {
        invoiceNo = Array.from(invEntry.invoiceNos).join(", ");
      }

      if (!customerCode && invEntry && invEntry.customerCodes.size > 0) {
        customerCode = Array.from(invEntry.customerCodes)[0];
      }

      if (!customerName && customerCode) {
        customerName = customerMap.get(String(customerCode)) || null;
      }

      return {
        ...rec,
        customerName: customerName ?? null,
        customerCode: customerCode ?? null,
        invoiceNo: invoiceNo ?? null,
      };
    });

    return NextResponse.json(enrichedRecords);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Internal server error";
    console.error("Orders vs Consolidated API Route Error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

