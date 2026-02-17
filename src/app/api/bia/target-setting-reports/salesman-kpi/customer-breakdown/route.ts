
import { NextRequest, NextResponse } from "next/server";
import { getJwtSubFromReq } from "@/lib/directus";

export const dynamic = "force-dynamic";

const DIRECTUS_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

async function fetchDirectus(path: string, params: Record<string, any>) {
  const url = new URL(`${DIRECTUS_URL}${path}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  // console.log(`Fetching: ${url.toString()}`);

  const res = await fetch(url.toString(), {
    headers: {
      "Authorization": `Bearer ${DIRECTUS_TOKEN}`,
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error(`Directus API Error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return json.data;
}

export async function GET(req: NextRequest) {
  const sub = getJwtSubFromReq(req);
  if (!sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const salesmanId = searchParams.get("salesmanId");
  const supplierId = searchParams.get("supplierId");
  const startDate = searchParams.get("from");
  const endDate = searchParams.get("to");

  if (!salesmanId || !startDate || !endDate) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  try {
    // 1. Fetch Invoices
    // filter[salesman_id][_eq]=...
    // filter[invoice_date][_between]=start,end
    // filter[transaction_status][_neq]=Void
    const invoices = await fetchDirectus("/items/sales_invoice", {
      "filter[salesman_id][_eq]": salesmanId,
      "filter[invoice_date][_between]": `${startDate},${endDate}`,
      "filter[transaction_status][_neq]": "Void",
      "fields": "invoice_id,order_id,customer_code,net_amount,payment_status,invoice_no",
      "limit": "-1"
    });

    if (!invoices || invoices.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Fetch Orders (if filtering by supplier)
    let validOrderNos = new Set<string>();
    let doFilterBySupplier = false;

    if (supplierId && supplierId !== "0") {
      doFilterBySupplier = true;
      // Fetch orders for this supplier in the date range (approximate match to invoice date)
      // Adding a buffer to the date range might be safer, but strict range is okay for now.
      const orders = await fetchDirectus("/items/sales_order", {
        "filter[supplier_id][_eq]": supplierId,
        "filter[order_date][_between]": `${startDate},${endDate}`,
        "fields": "order_no,supplier_id",
        "limit": "-1"
      });

      orders.forEach((o: any) => validOrderNos.add(o.order_no));
    }

    // 3. Aggregate
    const customerStats = new Map<string, {
      customerName: string,
      totalAmount: number,
      paidAmount: number,
      unpaidAmount: number,
      invoiceCount: number
    }>();

    const customerCodesToFetch = new Set<string>();

    for (const inv of invoices) {
      // Apply Supplier Filter via Order No
      if (doFilterBySupplier) {
        if (!inv.order_id || !validOrderNos.has(inv.order_id)) {
          // Try to match order_id vs order_no
          // DDL says sales_invoice.order_id is varchar(255). sales_order.order_no is varchar(255).
          // This should match.
          continue;
        }
      }

      const code = inv.customer_code;
      if (!code) continue;

      customerCodesToFetch.add(code);

      const amount = Number(inv.net_amount) || 0;
      const isPaid = inv.payment_status?.toUpperCase() === "PAID";

      if (!customerStats.has(code)) {
        customerStats.set(code, {
          customerName: code, // Placeholder
          totalAmount: 0,
          paidAmount: 0,
          unpaidAmount: 0,
          invoiceCount: 0
        });
      }

      const stats = customerStats.get(code)!;
      stats.totalAmount += amount;
      stats.invoiceCount += 1;
      if (isPaid) {
        stats.paidAmount += amount;
      } else {
        stats.unpaidAmount += amount;
      }
    }

    // 4. Fetch Names
    if (customerCodesToFetch.size > 0) {
      // Directus _in filter max URL length might be an issue if too many codes.
      // If > 200, we might need to batch or just POST search (but we are doing GET).
      // For now, let's assume it fits or simple loop. 
      // Better: use 'search' if possible? No, exact match needed.

      // Chunking
      const codesArray = Array.from(customerCodesToFetch);
      const chunkSize = 50;

      for (let i = 0; i < codesArray.length; i += chunkSize) {
        const chunk = codesArray.slice(i, i + chunkSize);
        const customers = await fetchDirectus("/items/customer", {
          "filter[customer_code][_in]": chunk.join(","),
          "fields": "customer_code,customer_name,store_name",
          "limit": "-1"
        });

        customers.forEach((c: any) => {
          const stats = customerStats.get(c.customer_code);
          if (stats) {
            stats.customerName = c.customer_name || c.store_name || c.customer_code;
          }
        });
      }
    }

    const result = Array.from(customerStats.values()).sort((a, b) => b.totalAmount - a.totalAmount);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Error fetching customer breakdown:", error.message);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
