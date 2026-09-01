import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "fs";


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
  productCategory: string;
  productSupplier?: string;
  grossAmount: number;
  netAmount: number;
  netOfReturns: number;
  cases?: number;
  unitName?: string;
  quantity?: number;
  conversionToPieces?: number;
  conversionToCases?: number;
  productName?: string;
}

interface NormalizedPurchase {
  receiptNo: string;
  receiptDate: string;
  supplierName: string;
  productCategory: string;
  grossAmount: number;
  netAmount: number;
  netOfReturns: number;
  cases?: number;
  unitName?: string;
  quantity?: number;
  conversionToPieces?: number;
  conversionToCases?: number;
}

function normalizeSales(items: Record<string, unknown>[]): NormalizedSales[] {
  const normalized: NormalizedSales[] = [];
  for (const item of items) {
    const invoiceNo = pickString(item, ["receiptNo", "invoiceNo", "invoice_no", "invoice_number"]);
    // Skip records with no invoiceNo, or where productId AND productName are both null (junk rows)
    const productId = item.productId;
    const rawProductName = item.productName ?? item.product_name ?? item.itemName;
    if (!invoiceNo || (productId === null && !rawProductName)) continue;
    if (invoiceNo) {
      normalized.push({
        invoiceNo,
        invoiceDate: pickString(item, ["date", "invoiceDate", "invoice_date", "transactionDate"]),
        customerName: pickString(item, ["customerName", "customer_name", "customer", "clientName"]),
        productCategory: pickString(item, ["productCategory", "product_category", "category"]),
        productSupplier: pickString(item, ["supplierName", "productSupplier", "product_supplier", "supplier"]),
        grossAmount: pickNumber(item, ["grossAmount"]),
        netAmount: pickNumber(item, ["netAmount"]),
        netOfReturns: pickNumber(item, ["netOfReturns"]),
        cases: pickNumber(item, ["conversionToCases", "productQuantity", "quantity"]),
        unitName: pickString(item, ["unitName", "uom", "unit_name", "unit"]),
        quantity: pickNumber(item, ["quantityOfUnits", "quantity", "productQuantity", "qty", "receivedQuantity", "conversionToCases"]),
        conversionToPieces: pickNumber(item, ["conversionToPieces"]),
        conversionToCases: pickNumber(item, ["conversionToCases"]),
        productName: pickString(item, ["productName", "product_name", "product", "itemName", "item_name", "itemDescription", "description", "name"]),
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
      normalized.push({
        receiptNo,
        receiptDate: pickString(item, ["date", "receiptDate", "receipt_date", "transactionDate"]),
        supplierName: pickString(item, ["supplierName", "supplier_name", "supplier", "vendorName"]),
        productCategory: pickString(item, ["productCategory", "product_category", "category"]),
        grossAmount: pickNumber(item, ["grossAmount"]),
        netAmount: pickNumber(item, ["netAmount"]),
        netOfReturns: pickNumber(item, ["netOfReturns"]),
        cases: pickNumber(item, ["conversionToCases", "receivedQuantity", "received_quantity"]),
        unitName: pickString(item, ["unitName", "uom", "unit_name", "unit"]),
        quantity: pickNumber(item, ["quantityOfUnits", "quantity", "receivedQuantity", "received_quantity", "qty", "conversionToCases"]),
        conversionToPieces: pickNumber(item, ["conversionToPieces"]),
        conversionToCases: pickNumber(item, ["conversionToCases"]),
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
    sales: NormalizedSales[];
    purchases: NormalizedPurchase[];
    customers: string[];
    suppliers: string[];
    categories: string[];
    uoms: string[];
    expiry: number;
  }>;
};

const NORMALIZED_CACHE = globalForCache.annualReportV2Cache || new Map<
  string,
  {
    sales: NormalizedSales[];
    purchases: NormalizedPurchase[];
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

  try {
    const baseUrl = SPRING_API_BASE_URL.replace(/\/+$/, "");

    const salesUrl = new URL(`${baseUrl}/api/view-sales-report-detailed/filter`);
    const purchaseUrl = new URL(`${baseUrl}/api/view-purchase-report-detailed/filter`);

    if (dateFrom) {
      salesUrl.searchParams.set("dateFrom", dateFrom);
      purchaseUrl.searchParams.set("dateFrom", dateFrom);
    }
    if (dateTo) {
      salesUrl.searchParams.set("dateTo", dateTo);
      purchaseUrl.searchParams.set("dateTo", dateTo);
    }

    const cacheKey = `v2.6:${dateFrom}:${dateTo}:${token}`;
    const now = Date.now();
    let cachedData = NORMALIZED_CACHE.get(cacheKey);

    if (!cachedData || cachedData.expiry < now) {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const salesResult = await fetchWithErrorLogging(salesUrl.toString(), "Sales API", headers);
      const purchaseResult = await fetchWithErrorLogging(purchaseUrl.toString(), "Purchase API", headers);

      try {
        if (salesResult.data && salesResult.data.length > 0) {
          fs.writeFileSync("C:/Users/Admin/.gemini/antigravity-ide/brain/2ab11339-0940-4694-b202-510b144f6340/scratch/raw_sales_item.json", JSON.stringify(salesResult.data[0], null, 2));
          // Also write any records that have no productName
          const nullProductItems = salesResult.data.filter((item: Record<string, unknown>) => !item.productName && !item.product_name && !item.itemName && !item.product);
          if (nullProductItems.length > 0) {
            fs.writeFileSync("C:/Users/Admin/.gemini/antigravity-ide/brain/2ab11339-0940-4694-b202-510b144f6340/scratch/null_product_items.json", JSON.stringify(nullProductItems.slice(0, 5), null, 2));
          }
        }
      } catch {
        // ignore debug write errors
      }

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

      const uoms = [
        ...new Set([
          ...salesTransactions.map((s) => s.unitName),
          ...purchaseTransactions.map((p) => p.unitName),
        ].filter(Boolean)),
      ].sort((a, b) => (a as string).localeCompare(b as string)) as string[];

      cachedData = {
        sales: salesTransactions,
        purchases: purchaseTransactions,
        customers,
        suppliers,
        categories,
        uoms,
        expiry: now + 15 * 60 * 1000,
      };
      
      NORMALIZED_CACHE.set(cacheKey, cachedData);
    }

    return NextResponse.json({
      summary: { totalSales: 0, totalPurchases: 0, netVariance: 0, biasPercentage: 0 },
      monthlyData: [], // monthlyData and summary will be calculated on client side
      salesTransactions: cachedData.sales,
      purchaseTransactions: cachedData.purchases,
      customers: cachedData.customers,
      suppliers: cachedData.suppliers,
      categories: cachedData.categories,
      uoms: cachedData.uoms,
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
