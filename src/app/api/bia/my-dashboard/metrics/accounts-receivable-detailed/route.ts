import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "vos_access_token";

type AnyRec = Record<string, unknown>;

function parseBit(val: unknown): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val === 1;
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    if (obj.type === "Buffer" && Array.isArray(obj.data)) return obj.data[0] === 1;
  }
  return val === "1" || val === 1;
}

async function fetchDirectusPage<T>(url: string, headers: Record<string, string>): Promise<T[]> {
  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Directus error ${res.status}`);
  }
  const json = await res.json();
  return (json.data || []) as T[];
}

interface CachedARPayload {
  data: Record<string, unknown>;
  timestamp: number;
}

declare global {
  var __serverARCache: CachedARPayload | undefined;
}

const SERVER_CACHE_TTL_MS = 360000; // 360,000 ms (6 minutes)

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    cookieStore.get(COOKIE_NAME)?.value;

  const isAuthDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";
  if (!token && !isAuthDisabled) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const force = request.nextUrl.searchParams.get("force") === "true";
  const cached = globalThis.__serverARCache;
  if (!force && cached && Date.now() - cached.timestamp < SERVER_CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  const staticToken = process.env.DIRECTUS_STATIC_TOKEN;

  if (!baseUrl) {
    return NextResponse.json(
      { error: "Directus API base URL not configured" },
      { status: 500 }
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (staticToken) {
    headers["Authorization"] = `Bearer ${staticToken}`;
  }

  try {
    // 1. Paginated fetch of all active unposted sales invoices matching Financial Management filter
    const invoiceFields = [
      "invoice_id",
      "invoice_no",
      "order_id",
      "customer_code",
      "invoice_date",
      "due_date",
      "gross_amount",
      "discount_amount",
      "isPosted",
      "salesman_id",
      "dispatch_date",
      "payment_status",
      "transaction_status",
    ].join(",");

    const invoiceFilterQuery =
      "filter[payment_status][_nin]=Paid,Fully Paid&filter[_or][0][isPosted][_null]=true&filter[_or][1][isPosted][_eq]=false";

    const allInvoices: AnyRec[] = [];
    let offset = 0;
    const pageSize = 1000;

    while (true) {
      const pageUrl = `${baseUrl}/items/sales_invoice?fields=${invoiceFields}&${invoiceFilterQuery}&limit=${pageSize}&offset=${offset}`;
      const pageRows = await fetchDirectusPage<AnyRec>(pageUrl, headers);
      allInvoices.push(...pageRows);
      if (pageRows.length < pageSize) break;
      offset += pageSize;
    }

    // 2. Fetch Unposted Collections (remittances awaiting GL posting)
    const collectionUrl = `${baseUrl}/items/collection?limit=-1&fields=id,salesman_id,totalAmount&filter[isPosted][_neq]=true&filter[isCancelled][_neq]=true`;
    const unpostedCollections = await fetchDirectusPage<AnyRec>(collectionUrl, headers).catch(
      () => [] as AnyRec[]
    );
    const totalUnpostedPool = unpostedCollections.reduce(
      (sum, c) => sum + (Number(c.totalAmount) || 0),
      0
    );

    if (allInvoices.length === 0) {
      return NextResponse.json({
        totalReceivable: 0,
        outstandingBalance: 0,
        unpostedCollections: totalUnpostedPool,
        realOutstanding: 0,
        collectionRate: 0,
        totalPaid: 0,
        activeInvoicesCount: 0,
        activeCustomersCount: 0,
        overdueAmount: 0,
        averageOverdueDays: 0,
        overdueCount: 0,
        agingBuckets: { b0_30: 0, b31_60: 0, b61_90: 0, b90Plus: 0 },
        agingCounts: { b0_30: 0, b31_60: 0, b61_90: 0, b90Plus: 0 },
        topCustomers: [],
        topSalesmen: [],
      });
    }

    // 3. Concurrently fetch all linked adjustments in 4 single parallel requests (tables have < 1000 total rows)
    const [payments, returns, memos, unfulfilled] = await Promise.all([
      fetchDirectusPage<AnyRec>(
        `${baseUrl}/items/sales_invoice_payments?limit=-1&fields=invoice_id,paid_amount`,
        headers
      ).catch(() => [] as AnyRec[]),
      fetchDirectusPage<AnyRec>(
        `${baseUrl}/items/sales_invoice_sales_return?limit=-1&fields=invoice_no,amount`,
        headers
      ).catch(() => [] as AnyRec[]),
      fetchDirectusPage<AnyRec>(
        `${baseUrl}/items/customer_memo_invoices?limit=-1&fields=invoice_id,amount,memo_id.type,memo_id.status`,
        headers
      ).catch(() => [] as AnyRec[]),
      fetchDirectusPage<AnyRec>(
        `${baseUrl}/items/unfulfilled_sales_transaction?limit=-1&fields=sales_invoice_id,variance_amount`,
        headers
      ).catch(() => [] as AnyRec[]),
    ]);

    // Aggregate lookups
    const paymentAgg = new Map<number, number>();
    for (const p of payments) {
      const iid = Number(p.invoice_id);
      if (iid) paymentAgg.set(iid, (paymentAgg.get(iid) || 0) + (Number(p.paid_amount) || 0));
    }

    const returnAgg = new Map<number, number>();
    for (const r of returns) {
      const iid = Number(r.invoice_no);
      if (iid) returnAgg.set(iid, (returnAgg.get(iid) || 0) + (Number(r.amount) || 0));
    }

    const creditAgg = new Map<number, number>();
    const debitAgg = new Map<number, number>();
    for (const m of memos) {
      const memoObj = m.memo_id as AnyRec | undefined;
      if (!memoObj || memoObj.status !== "APPROVED") continue;
      const type = Number(memoObj.type);
      const amt = Number(m.amount) || 0;
      const iid = Number(m.invoice_id);
      if (iid && amt > 0) {
        if (type === 1) creditAgg.set(iid, (creditAgg.get(iid) || 0) + amt);
        else if (type === 0 || type === 2) debitAgg.set(iid, (debitAgg.get(iid) || 0) + amt);
      }
    }

    const unfulfilledAgg = new Map<number, number>();
    for (const u of unfulfilled) {
      const iid = Number(u.sales_invoice_id);
      if (iid) unfulfilledAgg.set(iid, (unfulfilledAgg.get(iid) || 0) + (Number(u.variance_amount) || 0));
    }

    // 4. Per-Invoice Derivations matching _arFetchAndDerive.ts
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalNetReceivable = 0;
    let totalOutstanding = 0;
    let totalPaidSum = 0;
    let activeInvoicesCount = 0;
    const activeCustomerCodes = new Set<string>();

    let totalOverdueAmount = 0;
    let totalOverdueDaysSum = 0;
    let overdueCount = 0;

    const agingBuckets = { b0_30: 0, b31_60: 0, b61_90: 0, b90Plus: 0 };
    const agingCounts = { b0_30: 0, b31_60: 0, b61_90: 0, b90Plus: 0 };

    const customerArMap = new Map<string, number>();
    const salesmanArMap = new Map<number, number>();

    for (const inv of allInvoices) {
      if (parseBit(inv.isPosted)) continue;
      if ((String(inv.transaction_status || "")).trim().toUpperCase() === "CANCELLED") continue;

      const iid = Number(inv.invoice_id);
      const grossAmount = Number(inv.gross_amount) || 0;
      const discountAmount = Number(inv.discount_amount) || 0;
      const netReceivable = grossAmount - discountAmount;

      const returnAmount = returnAgg.get(iid) || 0;
      const creditMemos = creditAgg.get(iid) || 0;
      const debitMemos = debitAgg.get(iid) || 0;
      const unfulfilledAmount = unfulfilledAgg.get(iid) || 0;
      const totalPaid = paymentAgg.get(iid) || 0;

      const outstandingBalance = Math.max(
        0,
        netReceivable - returnAmount - creditMemos + debitMemos - unfulfilledAmount - totalPaid
      );

      if (outstandingBalance <= 0) continue;

      totalNetReceivable += netReceivable;
      totalOutstanding += outstandingBalance;
      totalPaidSum += totalPaid;
      activeInvoicesCount += 1;

      const custCode = String(inv.customer_code || "").trim();
      if (custCode) {
        activeCustomerCodes.add(custCode);
        customerArMap.set(custCode, (customerArMap.get(custCode) || 0) + outstandingBalance);
      }

      const smId = Number(inv.salesman_id || 0);
      if (smId > 0) {
        salesmanArMap.set(smId, (salesmanArMap.get(smId) || 0) + outstandingBalance);
      }

      // Credit Term & Calculated Due Date (matching FM engine)
      let termDays = 0;
      if (inv.due_date && inv.invoice_date) {
        const invD = new Date(String(inv.invoice_date));
        const dueD = new Date(String(inv.due_date));
        if (!isNaN(invD.getTime()) && !isNaN(dueD.getTime())) {
          termDays = Math.max(0, Math.round((dueD.getTime() - invD.getTime()) / (1000 * 60 * 60 * 24)));
        }
      }

      let calculatedDueDate: string | null = inv.due_date ? String(inv.due_date) : null;
      const deliveryDateStr = inv.dispatch_date ? String(inv.dispatch_date) : null;
      if (deliveryDateStr) {
        const delD = new Date(deliveryDateStr);
        if (!isNaN(delD.getTime())) {
          const newDueD = new Date(delD.getTime());
          newDueD.setDate(newDueD.getDate() + termDays);
          calculatedDueDate = newDueD.toISOString();
        }
      }

      let daysOverdue: number | null = null;
      if (calculatedDueDate) {
        const due = new Date(calculatedDueDate);
        if (!isNaN(due.getTime())) {
          due.setHours(0, 0, 0, 0);
          daysOverdue = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      if (daysOverdue !== null && daysOverdue >= 0 && outstandingBalance > 0) {
        totalOverdueAmount += outstandingBalance;
        totalOverdueDaysSum += daysOverdue;
        overdueCount += 1;

        if (daysOverdue <= 30) {
          agingBuckets.b0_30 += outstandingBalance;
          agingCounts.b0_30 += 1;
        } else if (daysOverdue <= 60) {
          agingBuckets.b31_60 += outstandingBalance;
          agingCounts.b31_60 += 1;
        } else if (daysOverdue <= 90) {
          agingBuckets.b61_90 += outstandingBalance;
          agingCounts.b61_90 += 1;
        } else {
          agingBuckets.b90Plus += outstandingBalance;
          agingCounts.b90Plus += 1;
        }
      }
    }

    const realOutstanding = Math.max(0, totalOutstanding - totalUnpostedPool);
    const collectionRate =
      totalNetReceivable > 0
        ? Math.min(100, Math.max(0, (totalPaidSum / totalNetReceivable) * 100))
        : 0;
    const averageOverdueDays =
      overdueCount > 0 ? Math.round(totalOverdueDaysSum / overdueCount) : 0;

    // 5. Top 3 Customers with Highest AR
    const sortedCustomerEntries = Array.from(customerArMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    const topCustomerCodes = sortedCustomerEntries.map(([code]) => code);
    const custNameMap = new Map<string, string>();
    if (topCustomerCodes.length > 0) {
      try {
        const cUrl = new URL(`${baseUrl}/items/customer`);
        cUrl.searchParams.set("fields", "customer_code,customer_name");
        cUrl.searchParams.set("filter", JSON.stringify({ customer_code: { _in: topCustomerCodes } }));
        cUrl.searchParams.set("limit", "10");
        const cRows = await fetchDirectusPage<AnyRec>(cUrl.toString(), headers);
        for (const c of cRows) {
          const code = String(c.customer_code || "").trim();
          const name = String(c.customer_name || "").trim();
          if (code) custNameMap.set(code, name || code);
        }
      } catch (e) {
        console.warn("[AR Detailed Metric] Could not load customer names:", e);
      }
    }

    const topCustomers = sortedCustomerEntries.map(([code, outstanding]) => ({
      code,
      name: custNameMap.get(code) || code,
      outstanding,
    }));

    // 6. Top 3 Sales Representatives with Highest AR
    const sortedSalesmanEntries = Array.from(salesmanArMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    const topSalesmanIds = sortedSalesmanEntries.map(([id]) => id);
    const smNameMap = new Map<number, { name: string; code: string }>();
    if (topSalesmanIds.length > 0) {
      try {
        const smUrl = new URL(`${baseUrl}/items/salesman`);
        smUrl.searchParams.set("fields", "id,salesman_name,salesman_code");
        smUrl.searchParams.set("filter", JSON.stringify({ id: { _in: topSalesmanIds } }));
        smUrl.searchParams.set("limit", "10");
        const smRows = await fetchDirectusPage<AnyRec>(smUrl.toString(), headers);
        for (const sm of smRows) {
          const sid = Number(sm.id);
          if (sid) {
            smNameMap.set(sid, {
              name: String(sm.salesman_name || `Salesman #${sid}`).trim(),
              code: String(sm.salesman_code || "").trim(),
            });
          }
        }
      } catch (e) {
        console.warn("[AR Detailed Metric] Could not load salesman names:", e);
      }
    }

    const topSalesmen = sortedSalesmanEntries.map(([id, outstanding]) => ({
      id,
      code: smNameMap.get(id)?.code || `SM-${id}`,
      name: smNameMap.get(id)?.name || `Salesman #${id}`,
      outstanding,
    }));

    const payload = {
      totalReceivable: totalNetReceivable,
      outstandingBalance: totalOutstanding,
      unpostedCollections: totalUnpostedPool,
      realOutstanding,
      collectionRate,
      totalPaid: totalPaidSum,
      activeInvoicesCount,
      activeCustomersCount: activeCustomerCodes.size,
      overdueAmount: totalOverdueAmount,
      averageOverdueDays,
      overdueCount,
      agingBuckets,
      agingCounts,
      topCustomers,
      topSalesmen,
    };

    globalThis.__serverARCache = { data: payload, timestamp: Date.now() };

    return NextResponse.json(payload);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[AR Detailed Metric API] Error:", message);
    if (globalThis.__serverARCache) {
      console.warn("[AR Detailed Metric API] Returning stale cache due to error:", message);
      return NextResponse.json(globalThis.__serverARCache.data);
    }
    return NextResponse.json({ error: "Internal Server Error", message }, { status: 500 });
  }
}
