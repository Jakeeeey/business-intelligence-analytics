import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "vos_access_token";

type AnyRec = Record<string, unknown>;

async function fetchDirectusPage<T>(url: string, headers: Record<string, string>): Promise<T[]> {
  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Directus error ${res.status}`);
  }
  const json = await res.json();
  return (json.data || []) as T[];
}

interface CachedAPPayload {
  data: Record<string, unknown>;
  timestamp: number;
}

declare global {
  var __serverAPCache: CachedAPPayload | undefined;
}

const SERVER_CACHE_TTL_MS = 360000; // 6 minutes

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
  const cached = globalThis.__serverAPCache;
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
  } else if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    // Parallel fetch of disbursements, line items, payments, suppliers, and transaction types
    const [disbursements, payables, payments, suppliers, transTypes] = await Promise.all([
      fetchDirectusPage<AnyRec>(
        `${baseUrl}/items/disbursement?limit=-1&fields=id,doc_no,payee,total_amount,paid_amount,transaction_date,is_deleted,transaction_type.*,division_id&filter[is_deleted][_neq]=1`,
        headers
      ).catch(() => [] as AnyRec[]),
      fetchDirectusPage<AnyRec>(
        `${baseUrl}/items/disbursement_payables?limit=-1&fields=id,disbursement_id,reference_no,date,amount`,
        headers
      ).catch(() => [] as AnyRec[]),
      fetchDirectusPage<AnyRec>(
        `${baseUrl}/items/disbursement_payments?limit=-1&fields=id,disbursement_id,amount`,
        headers
      ).catch(() => [] as AnyRec[]),
      fetchDirectusPage<AnyRec>(
        `${baseUrl}/items/suppliers?limit=-1&fields=id,supplier_name`,
        headers
      ).catch(() => [] as AnyRec[]),
      fetchDirectusPage<AnyRec>(
        `${baseUrl}/items/transaction_type?limit=-1&fields=id,transaction_type`,
        headers
      ).catch(() => [] as AnyRec[]),
    ]);

    // Index payables by disbursement_id
    const payablesByDisb = new Map<number, AnyRec[]>();
    for (const p of payables) {
      const dId = Number(p.disbursement_id);
      if (!payablesByDisb.has(dId)) payablesByDisb.set(dId, []);
      payablesByDisb.get(dId)!.push(p);
    }

    // Index payments sum by disbursement_id
    const paymentsByDisb = new Map<number, number>();
    for (const p of payments) {
      const dId = Number(p.disbursement_id);
      paymentsByDisb.set(dId, (paymentsByDisb.get(dId) || 0) + (Number(p.amount) || 0));
    }

    // Index suppliers
    const supplierMap = new Map<number, string>();
    for (const s of suppliers) {
      supplierMap.set(Number(s.id), String(s.supplier_name || ""));
    }

    // Index transaction types
    const ttMap = new Map<number, string>();
    for (const t of transTypes) {
      ttMap.set(Number(t.id), String(t.transaction_type || ""));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalPayable = 0;
    let totalPaid = 0;
    let outstandingBalance = 0;
    let overdueCount = 0;
    let overdueAmount = 0;
    let totalOverdueDaysSum = 0;

    const trade = {
      count: 0,
      payable: 0,
      paid: 0,
      outstanding: 0,
      overdue: 0,
      overdueCount: 0,
      fulfillmentRate: 0,
    };

    const nonTrade = {
      count: 0,
      payable: 0,
      paid: 0,
      outstanding: 0,
      overdue: 0,
      overdueCount: 0,
      fulfillmentRate: 0,
    };

    const agingBuckets = {
      b0_30: 0,
      b31_60: 0,
      b61_90: 0,
      b90Plus: 0,
    };

    const agingCounts = {
      b0_30: 0,
      b31_60: 0,
      b61_90: 0,
      b90Plus: 0,
    };

    const supplierBalances = new Map<string, number>();
    const activeSuppliersSet = new Set<string>();
    let activeVouchersCount = 0;

    for (const d of disbursements) {
      const dId = Number(d.id);
      const linkedPayables = payablesByDisb.get(dId) || [];
      const lineItemPayableSum = linkedPayables.reduce(
        (acc, lp) => acc + (Number(lp.amount) || 0),
        0
      );
      const lineItemPaidSum = paymentsByDisb.get(dId) || 0;

      const recordPayable =
        d.total_amount !== null &&
        d.total_amount !== undefined &&
        Number(d.total_amount) > 0
          ? Number(d.total_amount)
          : lineItemPayableSum;

      const recordPaid =
        d.paid_amount !== null &&
        d.paid_amount !== undefined &&
        Number(d.paid_amount) > 0
          ? Number(d.paid_amount)
          : lineItemPaidSum;

      if (recordPayable <= 0) continue;

      activeVouchersCount++;
      const recordOutstanding = Math.max(0, recordPayable - recordPaid);

      // Category: Trade vs Non-Trade
      let ttName = "";
      if (d.transaction_type && typeof d.transaction_type === "object") {
        ttName = String((d.transaction_type as AnyRec).transaction_type || "");
      } else if (d.transaction_type) {
        ttName = ttMap.get(Number(d.transaction_type)) || "";
      }
      const isTrade =
        ttName.toLowerCase().includes("trade") &&
        !ttName.toLowerCase().startsWith("non");

      const cat = isTrade ? trade : nonTrade;
      cat.count++;
      cat.payable += recordPayable;
      cat.paid += recordPaid;
      cat.outstanding += recordOutstanding;

      // Effective Due Date
      let effectiveDueDate: string | null = null;
      const dates = linkedPayables
        .map((lp) => (typeof lp.date === "string" ? lp.date : null))
        .filter((date): date is string => Boolean(date))
        .sort();

      if (dates.length > 0) {
        effectiveDueDate = dates[0];
      } else if (typeof d.transaction_date === "string") {
        effectiveDueDate = d.transaction_date;
      }

      let isOverdue = false;
      let daysOverdue = 0;
      if (effectiveDueDate) {
        const dDate = new Date(effectiveDueDate);
        dDate.setHours(0, 0, 0, 0);
        daysOverdue = Math.floor(
          (today.getTime() - dDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysOverdue > 0 && recordOutstanding > 0) {
          isOverdue = true;
        }
      }

      totalPayable += recordPayable;
      totalPaid += recordPaid;
      outstandingBalance += recordOutstanding;

      if (isOverdue) {
        overdueCount++;
        overdueAmount += recordOutstanding;
        totalOverdueDaysSum += daysOverdue;
        cat.overdueCount++;
        cat.overdue += recordOutstanding;
      }

      // Aging buckets for outstanding balance
      if (recordOutstanding > 0) {
        if (daysOverdue <= 30) {
          agingBuckets.b0_30 += recordOutstanding;
          agingCounts.b0_30++;
        } else if (daysOverdue <= 60) {
          agingBuckets.b31_60 += recordOutstanding;
          agingCounts.b31_60++;
        } else if (daysOverdue <= 90) {
          agingBuckets.b61_90 += recordOutstanding;
          agingCounts.b61_90++;
        } else {
          agingBuckets.b90Plus += recordOutstanding;
          agingCounts.b90Plus++;
        }

        // Supplier name resolution
        const supplierName =
          supplierMap.get(Number(d.payee)) ||
          (typeof d.payee === "string" && d.payee.trim()
            ? d.payee
            : `Supplier #${d.payee || "N/A"}`);

        activeSuppliersSet.add(supplierName);
        supplierBalances.set(
          supplierName,
          (supplierBalances.get(supplierName) || 0) + recordOutstanding
        );
      }
    }

    // Compute rates
    trade.fulfillmentRate =
      trade.payable > 0 ? (trade.paid / trade.payable) * 100 : 0;
    nonTrade.fulfillmentRate =
      nonTrade.payable > 0 ? (nonTrade.paid / nonTrade.payable) * 100 : 0;

    const settlementRate =
      totalPayable > 0 ? (totalPaid / totalPayable) * 100 : 0;
    const averageOverdueDays =
      overdueCount > 0 ? Math.round(totalOverdueDaysSum / overdueCount) : 0;

    const topSuppliers = Array.from(supplierBalances.entries())
      .map(([name, balance]) => ({ name, balance }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);

    const payload = {
      totalPayable,
      totalPaid,
      outstandingBalance,
      realOutstanding: outstandingBalance,
      settlementRate,
      activeVouchersCount,
      activeSuppliersCount: activeSuppliersSet.size,
      overdueAmount,
      averageOverdueDays,
      overdueCount,
      categories: {
        trade,
        nonTrade,
      },
      agingBuckets,
      agingCounts,
      topSuppliers,
    };

    globalThis.__serverAPCache = {
      data: payload,
      timestamp: Date.now(),
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[AccountsPayableMetric] Aggregation error:", error);
    if (globalThis.__serverAPCache) {
      return NextResponse.json(globalThis.__serverAPCache.data);
    }
    return NextResponse.json(
      {
        error: "Failed to aggregate accounts payable metrics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
