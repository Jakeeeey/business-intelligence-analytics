import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIRECTUS_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || "";

type AnyRec = Record<string, unknown>;

function getDirectusHeaders() {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (DIRECTUS_TOKEN) headers["Authorization"] = `Bearer ${DIRECTUS_TOKEN}`;
  return headers;
}

const chunk = <T>(arr: T[], sz: number): T[][] => {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += sz) res.push(arr.slice(i, i + sz));
  return res;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");

    if (!DIRECTUS_BASE) {
      return NextResponse.json({ success: false, error: "Directus API not configured" }, { status: 500 });
    }

    const headers = getDirectusHeaders();

    // =========================================================================
    // MODE 1: Customer Lookup Search (search any customer from database)
    // =========================================================================
    if (mode === "customers") {
      const q = searchParams.get("q")?.trim() || "";

      const custUrl = new URL(`${DIRECTUS_BASE}/items/customer`);
      custUrl.searchParams.set("fields", "customer_code,customer_name,city,province");
      custUrl.searchParams.set("limit", "50");

      if (q) {
        custUrl.searchParams.set(
          "filter",
          JSON.stringify({
            _or: [
              { customer_name: { _icontains: q } },
              { customer_code: { _icontains: q } },
            ],
          })
        );
      }

      const cRes = await fetch(custUrl.toString(), { headers, cache: "no-store" });
      if (!cRes.ok) {
        return NextResponse.json({ success: false, error: "Failed to search customers" }, { status: cRes.status });
      }

      const cJson = await cRes.json();
      return NextResponse.json({
        success: true,
        data: (cJson.data || []) as AnyRec[],
      });
    }

    // =========================================================================
    // MODE 2: Main Report Fetch (Based on INVOICE DATE)
    // =========================================================================
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const customersParam = searchParams.get("customers")?.trim();

    const requestedCustomers = customersParam
      ? customersParam.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    // 1. Fetch suppliers mapping once
    const supplierMap = new Map<number, string>();
    try {
      const supUrl = new URL(`${DIRECTUS_BASE}/items/suppliers`);
      supUrl.searchParams.set("fields", "id,supplier_name");
      supUrl.searchParams.set("limit", "500");
      const supRes = await fetch(supUrl.toString(), { headers, cache: "no-store" });
      if (supRes.ok) {
        const supJson = await supRes.json();
        for (const s of (supJson.data || []) as AnyRec[]) {
          const sid = Number(s.id);
          if (sid) supplierMap.set(sid, String(s.supplier_name || "").trim());
        }
      }
    } catch (e) {
      console.warn("[Delivered Items API] Failed to fetch suppliers map:", e);
    }

    // 2. Resolve requested customer codes if names or codes were provided
    let targetCustomerCodes: string[] = [];
    const customerInfoMap = new Map<string, { name: string; city: string; province: string }>();

    if (requestedCustomers.length > 0) {
      const custLookupUrl = new URL(`${DIRECTUS_BASE}/items/customer`);
      custLookupUrl.searchParams.set("fields", "customer_code,customer_name,city,province");
      custLookupUrl.searchParams.set("limit", "-1");
      custLookupUrl.searchParams.set(
        "filter",
        JSON.stringify({
          _or: [
            { customer_name: { _in: requestedCustomers } },
            { customer_code: { _in: requestedCustomers } },
          ],
        })
      );

      const custLookupRes = await fetch(custLookupUrl.toString(), { headers, cache: "no-store" });
      if (custLookupRes.ok) {
        const custLookupJson = await custLookupRes.json();
        for (const c of (custLookupJson.data || []) as AnyRec[]) {
          const code = String(c.customer_code || "").trim();
          if (code) {
            targetCustomerCodes.push(code);
            customerInfoMap.set(code, {
              name: String(c.customer_name || code).trim(),
              city: String(c.city || "").trim(),
              province: String(c.province || "").trim(),
            });
          }
        }
      }

      if (targetCustomerCodes.length === 0) {
        targetCustomerCodes = requestedCustomers;
      }
    }

    // 3. Build sales_invoice query filter strictly on INVOICE DATE
    const filterConditions: AnyRec[] = [];

    if (startDate && endDate) {
      filterConditions.push({
        invoice_date: {
          _gte: `${startDate}T00:00:00.000Z`,
          _lte: `${endDate}T23:59:59.999Z`,
        },
      });
    }

    if (targetCustomerCodes.length > 0) {
      filterConditions.push({
        customer_code: { _in: targetCustomerCodes },
      });
    }

    const invUrl = new URL(`${DIRECTUS_BASE}/items/sales_invoice`);
    invUrl.searchParams.set(
      "fields",
      "invoice_id,invoice_no,order_id,customer_code,invoice_date,total_amount"
    );
    if (filterConditions.length > 0) {
      invUrl.searchParams.set("filter", JSON.stringify({ _and: filterConditions }));
    }
    invUrl.searchParams.set("sort", "-invoice_date");
    invUrl.searchParams.set("limit", targetCustomerCodes.length > 0 ? "2000" : "600");

    const invRes = await fetch(invUrl.toString(), { headers, cache: "no-store" });
    if (!invRes.ok) {
      return NextResponse.json({ success: false, error: "Failed to fetch sales invoices" }, { status: invRes.status });
    }

    const invData = await invRes.json();
    const invoices = (invData.data || []) as AnyRec[];

    if (invoices.length === 0) {
      return NextResponse.json({ success: true, count: 0, data: [] });
    }

    const invoiceIds = invoices.map((i) => Number(i.invoice_id)).filter(Boolean);

    // 4. Fetch missing customer details
    const remainingCustomerCodes = Array.from(
      new Set(
        invoices
          .map((i) => String(i.customer_code || "").trim())
          .filter((code) => code && !customerInfoMap.has(code))
      )
    );

    if (remainingCustomerCodes.length > 0) {
      const custChunks = chunk(remainingCustomerCodes, 100);
      const custPromises = custChunks.map(async (codes) => {
        const cUrl = new URL(`${DIRECTUS_BASE}/items/customer`);
        cUrl.searchParams.set("fields", "customer_code,customer_name,city,province");
        cUrl.searchParams.set("filter", JSON.stringify({ customer_code: { _in: codes } }));
        cUrl.searchParams.set("limit", "-1");
        const r = await fetch(cUrl.toString(), { headers, cache: "no-store" });
        if (!r.ok) return [];
        const j = await r.json();
        return (j.data || []) as AnyRec[];
      });

      const custBatches = await Promise.all(custPromises);
      for (const c of custBatches.flat()) {
        const code = String(c.customer_code || "").trim();
        if (code) {
          customerInfoMap.set(code, {
            name: String(c.customer_name || code).trim(),
            city: String(c.city || "").trim(),
            province: String(c.province || "").trim(),
          });
        }
      }
    }

    // 5. Fetch sales_invoice_details in batches
    const invoiceIdChunks = chunk(invoiceIds, 100);
    const detailPromises = invoiceIdChunks.map(async (ids) => {
      const detUrl = new URL(`${DIRECTUS_BASE}/items/sales_invoice_details`);
      detUrl.searchParams.set(
        "fields",
        "detail_id,invoice_no,order_id,product_id,quantity,unit_price,total_amount,gross_amount"
      );
      detUrl.searchParams.set("filter", JSON.stringify({ invoice_no: { _in: ids } }));
      detUrl.searchParams.set("limit", "-1");
      const r = await fetch(detUrl.toString(), { headers, cache: "no-store" });
      if (!r.ok) return [];
      const j = await r.json();
      return (j.data || []) as AnyRec[];
    });

    const detailBatches = await Promise.all(detailPromises);
    const allDetails = detailBatches.flat();

    // 6. Fetch product names for all product IDs
    const productIds = Array.from(new Set(allDetails.map((d) => Number(d.product_id)).filter(Boolean)));
    const productNameMap = new Map<number, string>();

    if (productIds.length > 0) {
      const prodChunks = chunk(productIds, 100);
      const prodPromises = prodChunks.map(async (pids) => {
        const prodUrl = new URL(`${DIRECTUS_BASE}/items/products`);
        prodUrl.searchParams.set("fields", "product_id,product_name");
        prodUrl.searchParams.set("filter", JSON.stringify({ product_id: { _in: pids } }));
        prodUrl.searchParams.set("limit", "-1");
        const pr = await fetch(prodUrl.toString(), { headers, cache: "no-store" });
        if (!pr.ok) return [];
        const pj = await pr.json();
        return (pj.data || []) as AnyRec[];
      });

      const prodBatches = await Promise.all(prodPromises);
      for (const p of prodBatches.flat()) {
        const pid = Number(p.product_id);
        if (pid) productNameMap.set(pid, String(p.product_name || `Product #${pid}`));
      }
    }

    // 7. Resolve suppliers via sales_order (using order_id string)
    const orderNos = Array.from(new Set(invoices.map((i) => String(i.order_id || "").trim()).filter(Boolean)));
    const orderSupplierMap = new Map<string, string>();

    if (orderNos.length > 0) {
      const orderChunks = chunk(orderNos, 100);
      const orderPromises = orderChunks.map(async (nos) => {
        const soUrl = new URL(`${DIRECTUS_BASE}/items/sales_order`);
        soUrl.searchParams.set("fields", "order_no,supplier_id");
        soUrl.searchParams.set("filter", JSON.stringify({ order_no: { _in: nos } }));
        soUrl.searchParams.set("limit", "-1");
        const sr = await fetch(soUrl.toString(), { headers, cache: "no-store" });
        if (!sr.ok) return [];
        const sj = await sr.json();
        return (sj.data || []) as AnyRec[];
      });

      const orderBatches = await Promise.all(orderPromises);
      for (const o of orderBatches.flat()) {
        const oNo = String(o.order_no || "").trim();
        const sId = Number(o.supplier_id);
        if (oNo && sId) {
          const sName = supplierMap.get(sId);
          if (sName) orderSupplierMap.set(oNo, sName);
        }
      }
    }

    // 8. Map details back to invoices and build response records
    const invoicesMap = new Map<number, AnyRec>();
    for (const inv of invoices) {
      invoicesMap.set(Number(inv.invoice_id), inv);
    }

    const records: AnyRec[] = [];

    for (const det of allDetails) {
      const invId = Number(det.invoice_no);
      const inv = invoicesMap.get(invId);
      if (!inv) continue;

      const cCode = String(inv.customer_code || "").trim();
      const custInfo = customerInfoMap.get(cCode);
      const customerName = custInfo?.name || cCode || "Unknown Customer";
      const pId = Number(det.product_id);
      const pName = productNameMap.get(pId) || `Product #${pId || "N/A"}`;
      const qty = Number(det.quantity) || 1;
      const unitPrice = Number(det.unit_price) || 0;
      const amt = Number(det.total_amount ?? det.gross_amount ?? (qty * unitPrice)) || 0;
      
      // Invoice date strictly formatted as YYYY-MM-DD
      const invDateStr = String(inv.invoice_date || "").split("T")[0] || startDate || "";
      const orderNoStr = String(inv.order_id || "").trim();
      const invNoStr = String(inv.invoice_no || "").trim();
      const supplierName = orderSupplierMap.get(orderNoStr);

      records.push({
        id: `inv-${det.detail_id || Math.random()}`,
        date: invDateStr,
        customerName,
        customerCode: cCode,
        productId: pId,
        productName: pName,
        quantity: qty,
        unitPrice,
        amount: amt,
        supplier: supplierName,
        city: custInfo?.city,
        province: custInfo?.province,
        orderNo: orderNoStr,
        invoiceNo: invNoStr,
      });
    }

    return NextResponse.json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error: unknown) {
    console.error("[Delivered Items API] Unhandled error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
