import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  aggregateMonthlyData,
  calculateSummary,
  filterPurchasesBySupplier,
} from "@/modules/business-intelligence-analytics/crm/target-setting-reports/divisional/annual-report-v2/utils/annual-report.utils";

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
  invoiceTotalAmount: number;
  productCategory: string;
  productTotalAmount: number;
}

interface NormalizedPurchase {
  receiptNo: string;
  receiptDate: string;
  supplierName: string;
  productCategory: string;
  totalReceiptAmount: number;
}

function normalizeSales(items: Record<string, unknown>[]): NormalizedSales[] {
  const normalized: NormalizedSales[] = [];
  for (const item of items) {
    const invoiceNo = pickString(item, ["invoiceNo", "invoice_no", "invoice_number"]);
    if (invoiceNo) {
      normalized.push({
        invoiceNo,
        invoiceDate: pickString(item, ["invoiceDate", "invoice_date", "date", "transactionDate"]),
        customerName: pickString(item, ["customerName", "customer_name", "customer", "clientName"]),
        invoiceTotalAmount: pickNumber(item, ["totalInvoiceAmount", "total_invoice_amount", "amount", "totalAmount", "total"]),
        productCategory: pickString(item, ["productCategory", "product_category", "category"]),
        productTotalAmount: pickNumber(item, ["productTotalAmount", "product_total_amount", "productSalesAmount", "productNetAmount", "totalProductAmount"]),
      });
    }
  }
  return normalized;
}

function normalizePurchases(items: Record<string, unknown>[]): NormalizedPurchase[] {
  const normalized: NormalizedPurchase[] = [];
  for (const item of items) {
    const receiptNo = pickString(item, ["receiptNo", "receipt_no", "receipt_number", "docNo"]);
    if (receiptNo) {
      const totalAmount = pickNumber(item, ["totalAmount", "amount", "totalReceiptAmount", "totalPayable"]) || 0;
      const discountedAmount = pickNumber(item, ["discountedAmount", "discount"]) || 0;
      const netAmount = totalAmount - discountedAmount;

      normalized.push({
        receiptNo,
        receiptDate: pickString(item, ["receiptDate", "receipt_date", "date", "transactionDate"]),
        supplierName: pickString(item, ["supplierName", "supplier_name", "supplier", "vendorName"]),
        productCategory: pickString(item, ["productCategory", "product_category", "category"]),
        totalReceiptAmount: netAmount,
      });
    }
  }
  return normalized;
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
        `ERR_API_FAIL: [AnnualReportV2-API] ${label} failed [${res.status}]: ${body}`,
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
    console.error(`ERR_API_FAIL: [AnnualReportV2-API] ${label} network error:`, err);
    return { ok: false, data: [], raw: null };
  }
}

// Module-level in-memory cache for ultra-fast dev and prod performance
const globalForCache = globalThis as unknown as {
  annualReportV2Cache: Map<string, {
    sales: any[];
    purchases: any[];
    customers: string[];
    suppliers: string[];
    categories: string[];
    expiry: number;
  }>;
};

const NORMALIZED_CACHE = globalForCache.annualReportV2Cache || new Map<
  string,
  {
    sales: any[];
    purchases: any[];
    customers: string[];
    suppliers: string[];
    categories: string[];
    expiry: number;
  }
>();

if (process.env.NODE_ENV !== "production") {
  globalForCache.annualReportV2Cache = NORMALIZED_CACHE;
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
    console.error("ERR_CONFIG: [AnnualReportV2-API] SPRING_API_BASE_URL is not defined");
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
  const categoryName = searchParams.get("categoryName") ?? "";

  try {
    const baseUrl = SPRING_API_BASE_URL.replace(/\/+$/, "");

    const salesUrl = new URL(`${baseUrl}/api/view-sales-report-itemized/filtered`);
    const purchaseUrl = new URL(`${baseUrl}/api/view-purchase-report-detailed/filter`);

    if (dateFrom) {
      salesUrl.searchParams.set("startDate", dateFrom);
      purchaseUrl.searchParams.set("receiptDateFrom", dateFrom);
    }
    if (dateTo) {
      salesUrl.searchParams.set("endDate", dateTo);
      purchaseUrl.searchParams.set("receiptDateTo", dateTo);
    }

    const cacheKey = `v2:${dateFrom}:${dateTo}:${token}`;
    const now = Date.now();
    let cachedData = NORMALIZED_CACHE.get(cacheKey);

    if (!cachedData || cachedData.expiry < now) {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const salesResult = await fetchWithErrorLogging(salesUrl.toString(), "Sales API", headers);
      const purchaseResult = await fetchWithErrorLogging(purchaseUrl.toString(), "Purchase API", headers);

      // Rebuild trigger
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

      const categories = [
        ...new Set([
          ...salesTransactions.map((s) => s.productCategory),
          ...purchaseTransactions.map((p) => p.productCategory),
        ].filter(Boolean)),
      ].sort((a, b) => a.localeCompare(b));

      cachedData = {
        sales: salesTransactions,
        purchases: purchaseTransactions,
        customers,
        suppliers,
        categories,
        expiry: now + 15 * 60 * 1000, // 15 mins TTL
      };
      
      NORMALIZED_CACHE.set(cacheKey, cachedData);
    }

    // Filter sales items by customerName and categoryName
    let filteredSalesItems = cachedData.sales;
    if (customerName) {
      filteredSalesItems = filteredSalesItems.filter((item) =>
        item.customerName.toLowerCase().includes(customerName.toLowerCase())
      );
    }
    if (categoryName) {
      filteredSalesItems = filteredSalesItems.filter((item) =>
        item.productCategory.toLowerCase() === categoryName.toLowerCase()
      );
    }

    // Group items by invoiceNo to construct SalesTransaction[]
    interface GroupedSalesTransaction {
      invoiceNo: string;
      invoiceDate: string;
      customerName: string;
      totalInvoiceAmount: number;
      productCategory?: string;
    }
    const salesGroupedMap = new Map<string, GroupedSalesTransaction>();
    for (const item of filteredSalesItems) {
      const amountToAdd = item.productTotalAmount || 0;
      const existing = salesGroupedMap.get(item.invoiceNo);
      if (existing) {
        existing.totalInvoiceAmount += amountToAdd;
      } else {
        salesGroupedMap.set(item.invoiceNo, {
          invoiceNo: item.invoiceNo,
          invoiceDate: item.invoiceDate,
          customerName: item.customerName,
          totalInvoiceAmount: amountToAdd,
          productCategory: item.productCategory,
        });
      }
    }
    const filteredSales = Array.from(salesGroupedMap.values());

    // Filter purchases items by supplierName and categoryName
    let filteredPurchasesItems = cachedData.purchases;

    // In-memory date filtering safeguard because backend date filtering might have slight boundary gaps
    if (dateFrom || dateTo) {
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo + "T23:59:59.999") : null;
      filteredPurchasesItems = filteredPurchasesItems.filter((item) => {
        if (!item.receiptDate) return true;
        const d = new Date(item.receiptDate);
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }

    if (supplierName) {
      filteredPurchasesItems = filteredPurchasesItems.filter((item) =>
        item.supplierName.toLowerCase().includes(supplierName.toLowerCase())
      );
    }
    if (categoryName) {
      filteredPurchasesItems = filteredPurchasesItems.filter((item) =>
        item.productCategory.toLowerCase() === categoryName.toLowerCase()
      );
    }

    // Group items by receiptNo to construct PurchaseTransaction[]
    interface GroupedPurchaseTransaction {
      receiptNo: string;
      receiptDate: string;
      supplierName: string;
      totalReceiptAmount: number;
    }
    const purchaseGroupedMap = new Map<string, GroupedPurchaseTransaction>();
    for (const item of filteredPurchasesItems) {
      const existing = purchaseGroupedMap.get(item.receiptNo);
      if (existing) {
        existing.totalReceiptAmount += item.totalReceiptAmount;
      } else {
        purchaseGroupedMap.set(item.receiptNo, {
          receiptNo: item.receiptNo,
          receiptDate: item.receiptDate,
          supplierName: item.supplierName,
          totalReceiptAmount: item.totalReceiptAmount,
        });
      }
    }
    const filteredPurchases = Array.from(purchaseGroupedMap.values());

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
        customers: cachedData.customers,
        suppliers: cachedData.suppliers,
        categories: cachedData.categories,
        ok: true,
      });
    }

    const summary = calculateSummary(monthlyData);

    return NextResponse.json({
      summary,
      monthlyData,
      salesTransactions: filteredSales,
      purchaseTransactions: filteredPurchases,
      customers: cachedData.customers,
      suppliers: cachedData.suppliers,
      categories: cachedData.categories,
      ok: true,
    });
  } catch (error) {
    console.error("ERR_INTERNAL_FAIL: [AnnualReportV2-API] Fatal Error:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_FAIL: Gateway Error" },
      { status: 502 },
    );
  }
}
