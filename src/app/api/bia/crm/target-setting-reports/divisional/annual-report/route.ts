import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  aggregateMonthlyData,
  calculateSummary,
  filterSalesByCustomer,
  filterPurchasesBySupplier,
} from "@/modules/business-intelligence-analytics/crm/target-setting-reports/divisional/annual-report/utils/annual-report.utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SPRING_API_BASE_URL = process.env.SPRING_API_BASE_URL;
const COOKIE_NAME = "vos_access_token";

function pickField(
  obj: Record<string, unknown>,
  candidates: string[],
): string | number | undefined {
  for (const key of candidates) {
    const val = obj[key];
    if (val !== undefined && val !== null) return val as string | number;
  }
  return undefined;
}

function pickString(obj: Record<string, unknown>, candidates: string[]): string {
  const val = pickField(obj, candidates);
  return val !== undefined ? String(val) : "";
}

function pickNumber(obj: Record<string, unknown>, candidates: string[]): number {
  const val = pickField(obj, candidates);
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

interface NormalizedSales {
  invoiceNo: string;
  invoiceDate: string;
  customerName: string;
  totalInvoiceAmount: number;
}

interface NormalizedPurchase {
  receiptNo: string;
  receiptDate: string;
  supplierName: string;
  totalReceiptAmount: number;
}

function normalizeSales(items: Record<string, unknown>[]): NormalizedSales[] {
  return items.map((item) => ({
    invoiceNo: pickString(item, ["invoiceNo", "invoice_no", "invoice_number"]),
    invoiceDate: pickString(item, ["invoiceDate", "invoice_date", "date", "transactionDate"]),
    customerName: pickString(item, ["customerName", "customer_name", "customer", "clientName"]),
    totalInvoiceAmount: pickNumber(item, ["totalInvoiceAmount", "total_invoice_amount", "amount", "totalAmount", "total"]),
  }));
}

function normalizePurchases(items: Record<string, unknown>[]): NormalizedPurchase[] {
  return items.map((item) => ({
    receiptNo: pickString(item, ["receiptNo", "receipt_no", "receipt_number"]),
    receiptDate: pickString(item, ["receiptDate", "receipt_date", "date", "transactionDate"]),
    supplierName: pickString(item, ["supplierName", "supplier_name", "supplier", "vendorName"]),
    totalReceiptAmount: pickNumber(item, ["totalReceiptAmount", "total_receipt_amount", "amount", "totalAmount", "total"]),
  }));
}

async function fetchWithErrorLogging(
  url: string,
  label: string,
  headers: Record<string, string>,
): Promise<{ ok: boolean; data: Record<string, unknown>[]; raw: unknown }> {
  try {
    const res = await fetch(url, { method: "GET", headers, cache: "no-store" });
    const text = await res.text();
    let parsed: unknown = {};
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      // non-JSON response
    }

    if (!res.ok) {
      const body =
        parsed && typeof parsed === "object"
          ? JSON.stringify(parsed).slice(0, 500)
          : text.slice(0, 300) || "(empty)";
      console.error(
        `ERR_API_FAIL: [AnnualReport-API] ${label} failed [${res.status}]: ${body}`,
      );
      return { ok: false, data: [], raw: parsed };
    }

    const arr = Array.isArray(parsed)
      ? parsed
      : (parsed as Record<string, unknown>)?.data ??
        (parsed as Record<string, unknown>)?.records ??
        (parsed as Record<string, unknown>)?.items ??
        [];
    return { ok: true, data: arr as Record<string, unknown>[], raw: parsed };
  } catch (err) {
    console.error(`ERR_API_FAIL: [AnnualReport-API] ${label} network error:`, err);
    return { ok: false, data: [], raw: null };
  }
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token =
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized: Missing session token" },
      { status: 401 },
    );
  }

  if (!SPRING_API_BASE_URL) {
    console.error("ERR_CONFIG: [AnnualReport-API] SPRING_API_BASE_URL is not defined");
    return NextResponse.json(
      { ok: false, error: "Server Configuration Error" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const customerName = searchParams.get("customerName") ?? "";
  const supplierName = searchParams.get("supplierName") ?? "";

  try {
    const baseUrl = SPRING_API_BASE_URL.replace(/\/+$/, "");

    const salesUrl = new URL(`${baseUrl}/api/v1/view-sales-report/filter`);
    const purchaseUrl = new URL(`${baseUrl}/api/view-purchase-report/filter`);

    if (dateFrom) {
      salesUrl.searchParams.set("startDate", dateFrom);
      purchaseUrl.searchParams.set("startDate", dateFrom);
    }
    if (dateTo) {
      salesUrl.searchParams.set("endDate", dateTo);
      purchaseUrl.searchParams.set("endDate", dateTo);
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const [salesResult, purchaseResult] = await Promise.all([
      fetchWithErrorLogging(salesUrl.toString(), "Sales API", headers),
      fetchWithErrorLogging(purchaseUrl.toString(), "Purchase API", headers),
    ]);

    const salesTransactions = normalizeSales(salesResult.data);
    const purchaseTransactions = normalizePurchases(purchaseResult.data);

    const customers = [
      ...new Set(salesTransactions.map((s) => s.customerName).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b));
    const suppliers = [
      ...new Set(
        purchaseTransactions.map((s) => s.supplierName).filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b));

    const filteredSales = filterSalesByCustomer(salesTransactions, customerName);
    const filteredPurchases = filterPurchasesBySupplier(
      purchaseTransactions,
      supplierName,
    );

    const monthlyData = aggregateMonthlyData(filteredSales, filteredPurchases);

    if (monthlyData.length === 0) {
      return NextResponse.json({
        summary: {
          totalSales: 0,
          totalPurchases: 0,
          netVariance: 0,
          biasPercentage: 0,
        },
        monthlyData: [],
        salesTransactions: [],
        purchaseTransactions: [],
        customers,
        suppliers,
        ok: true,
      });
    }

    const summary = calculateSummary(monthlyData);

    return NextResponse.json({
      summary,
      monthlyData,
      salesTransactions: filteredSales,
      purchaseTransactions: filteredPurchases,
      customers,
      suppliers,
      ok: true,
    });
  } catch (error) {
    console.error("ERR_INTERNAL_FAIL: [AnnualReport-API] Fatal Error:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_FAIL: Gateway Error" },
      { status: 502 },
    );
  }
}
