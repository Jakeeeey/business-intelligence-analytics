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

interface CachedExpensePayload {
  data: Record<string, unknown>;
  timestamp: number;
}

declare global {
  var __serverExpenseCache: Record<string, CachedExpensePayload> | undefined;
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

  const period = (request.nextUrl.searchParams.get("period") || "this-month").toLowerCase();
  const force = request.nextUrl.searchParams.get("force") === "true";

  if (!globalThis.__serverExpenseCache) {
    globalThis.__serverExpenseCache = {};
  }

  const cached = globalThis.__serverExpenseCache[period];
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yearStart = `${today.getFullYear()}-01-01`;
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    // Build date filter for Directus disbursements
    let dateFilterQuery = "";
    if (period === "this-month") {
      dateFilterQuery = `&filter[transaction_date][_gte]=${monthStart}`;
    } else if (period === "this-year") {
      dateFilterQuery = `&filter[transaction_date][_gte]=${yearStart}`;
    }

    // Parallel fetch
    const [disbursements, payables, coas, divisions, suppliers] = await Promise.all([
      fetchDirectusPage<AnyRec>(
        `${baseUrl}/items/disbursement?limit=-1&fields=id,doc_no,payee,total_amount,paid_amount,transaction_date,division_id,is_deleted&filter[is_deleted][_neq]=1${dateFilterQuery}`,
        headers
      ).catch(() => [] as AnyRec[]),
      fetchDirectusPage<AnyRec>(
        `${baseUrl}/items/disbursement_payables?limit=-1&fields=id,disbursement_id,reference_no,date,amount,coa_id,division_id,remarks`,
        headers
      ).catch(() => [] as AnyRec[]),
      fetchDirectusPage<AnyRec>(
        `${baseUrl}/items/chart_of_accounts?limit=-1&fields=coa_id,account_title`,
        headers
      ).catch(() => [] as AnyRec[]),
      fetchDirectusPage<AnyRec>(
        `${baseUrl}/items/division?limit=-1&fields=division_id,division_name`,
        headers
      ).catch(() => [] as AnyRec[]),
      fetchDirectusPage<AnyRec>(
        `${baseUrl}/items/suppliers?limit=-1&fields=id,supplier_name`,
        headers
      ).catch(() => [] as AnyRec[]),
    ]);

    const coaMap = new Map<number, string>();
    for (const c of coas) {
      coaMap.set(Number(c.coa_id), String(c.account_title || ""));
    }

    const divisionMap = new Map<number, string>();
    for (const d of divisions) {
      divisionMap.set(Number(d.division_id), String(d.division_name || ""));
    }

    const supplierMap = new Map<number, string>();
    for (const s of suppliers) {
      supplierMap.set(Number(s.id), String(s.supplier_name || ""));
    }

    const validDisbIds = new Set<number>(disbursements.map((d) => Number(d.id)));

    // Index payables by disbursement_id
    const payablesByDisb = new Map<number, AnyRec[]>();
    let matchingLineItemsCount = 0;
    for (const p of payables) {
      const dId = Number(p.disbursement_id);
      if (validDisbIds.has(dId)) {
        matchingLineItemsCount++;
        if (!payablesByDisb.has(dId)) payablesByDisb.set(dId, []);
        payablesByDisb.get(dId)!.push(p);
      }
    }

    let totalDisbursementAmount = 0;
    let totalPaidAmount = 0;
    let uniqueTransactionsCount = 0;
    let taxWithholdingImpact = 0;

    const categoryTotals = new Map<string, number>();
    const divisionTotals = new Map<string, number>();
    const payeeTotals = new Map<string, number>();

    const withholdingKeywords = ["withhold", "withholding", "ewt"];

    for (const d of disbursements) {
      const dId = Number(d.id);
      const linkedPayables = payablesByDisb.get(dId) || [];
      const linePayableSum = linkedPayables.reduce(
        (acc, p) => acc + (Number(p.amount) || 0),
        0
      );

      const recordPayable =
        d.total_amount !== null &&
        d.total_amount !== undefined &&
        Number(d.total_amount) > 0
          ? Number(d.total_amount)
          : linePayableSum;

      const recordPaid =
        d.paid_amount !== null &&
        d.paid_amount !== undefined &&
        Number(d.paid_amount) > 0
          ? Number(d.paid_amount)
          : 0;

      if (recordPayable <= 0 && linePayableSum <= 0) continue;

      uniqueTransactionsCount++;
      totalDisbursementAmount += recordPayable;
      totalPaidAmount += recordPaid;

      // Payee tracking
      const payeeName =
        supplierMap.get(Number(d.payee)) ||
        (typeof d.payee === "string" && d.payee.trim()
          ? d.payee
          : `Vendor #${d.payee || "N/A"}`);
      payeeTotals.set(
        payeeName,
        (payeeTotals.get(payeeName) || 0) + recordPayable
      );

      // Division tracking
      const divName =
        divisionMap.get(Number(d.division_id)) || "General & Admin";
      divisionTotals.set(
        divName,
        (divisionTotals.get(divName) || 0) + recordPayable
      );

      // Line items COA breakdown
      for (const p of linkedPayables) {
        const coaTitle =
          coaMap.get(Number(p.coa_id)) ||
          (p.remarks ? String(p.remarks).slice(0, 30) : "General Expense");
        const amt = Number(p.amount) || 0;
        categoryTotals.set(
          coaTitle,
          (categoryTotals.get(coaTitle) || 0) + amt
        );

        const titleLower = coaTitle.toLowerCase();
        if (withholdingKeywords.some((kw) => titleLower.includes(kw))) {
          taxWithholdingImpact += Math.abs(amt);
        }
      }
    }

    const outstandingBalance = Math.max(
      0,
      totalDisbursementAmount - totalPaidAmount
    );
    const settlementRate =
      totalDisbursementAmount > 0
        ? (totalPaidAmount / totalDisbursementAmount) * 100
        : 0;

    const topCategories = Array.from(categoryTotals.entries())
      .map(([title, amount]) => ({
        title,
        amount,
        percentage:
          totalDisbursementAmount > 0
            ? (amount / totalDisbursementAmount) * 100
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const topDivisions = Array.from(divisionTotals.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage:
          totalDisbursementAmount > 0
            ? (amount / totalDisbursementAmount) * 100
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const topPayees = Array.from(payeeTotals.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage:
          totalDisbursementAmount > 0
            ? (amount / totalDisbursementAmount) * 100
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const payload = {
      period,
      totalDisbursementAmount,
      totalPaidAmount,
      outstandingBalance,
      settlementRate,
      taxWithholdingImpact,
      totalTransactions: uniqueTransactionsCount,
      totalLineItems: matchingLineItemsCount,
      topCategories,
      topDivisions,
      topPayees,
    };

    globalThis.__serverExpenseCache[period] = {
      data: payload,
      timestamp: Date.now(),
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[CompanyExpenseMetric] Aggregation error:", error);
    if (globalThis.__serverExpenseCache?.[period]) {
      return NextResponse.json(globalThis.__serverExpenseCache[period].data);
    }
    return NextResponse.json(
      {
        error: "Failed to aggregate company expense report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
