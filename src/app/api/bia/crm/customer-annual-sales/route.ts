import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SPRING_API_BASE_URL = process.env.SPRING_API_BASE_URL;
const COOKIE_NAME = "vos_access_token";

export interface RawCustomerAnnualSales {
  year?: number | null;
  month?: number | null;
  supplierId?: number | null;
  supplierName?: string | null;
  salesmanId?: number | null;
  salesmanCode?: string | null;
  salesmanName?: string | null;
  customerId?: number | null;
  customerCode?: string | null;
  customerName?: string | null;
  productId?: number | null;
  productName?: string | null;
  productCategory?: string | null;
  unitsId?: number | null;
  unitName?: string | null;
  priceTypeName?: string | null;
  soldQuantity?: number | null;
  soldAmount?: number | null;
  returnedQuantity?: number | null;
  returnedAmount?: number | null;
  conversionToPieces?: number | null;
  conversionToCases?: number | null;
  unfulfilledAmount?: number | null;
  netAmount?: number | null;
  poNo?: string | null;
  soNo?: string | null;
  pdpNos?: string | null;
  cldtoNos?: string | null;
  siNo?: string | null;
  dpNos?: string | null;
  deliveredDate?: string | null;
  rowType?: string | null;
  returnNo?: string | null;
  returnDate?: string | null;
}

// In-memory cache for master filter lists (salesmen, customers, suppliers, categories) per year
const filterOptionsCache = new Map<
  string,
  {
    salesmen: { id: number; name: string }[];
    customers: { id: number | string; name: string; code?: string }[];
    suppliers: string[];
    categories: string[];
    uoms: string[];
    priceTypes: string[];
    timestamp: number;
  }
>();

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token =
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized: Missing session token" },
      { status: 401 }
    );
  }

  if (!SPRING_API_BASE_URL) {
    console.error("ERR_CONFIG: [CustomerAnnualSales-API] SPRING_API_BASE_URL is not defined");
    return NextResponse.json(
      { ok: false, error: "Server Configuration Error" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const baseUrl = SPRING_API_BASE_URL.replace(/\/+$/, "");
  const targetUrl = new URL(`${baseUrl}/api/view-annual-customer-sales-detail/filter`);

  const allowedParams = [
    "year",
    "monthFrom",
    "monthTo",
    "supplierId",
    "salesmanId",
    "customerId",
    "customerCode",
    "customerName",
    "productId",
    "productCategory",
    "unitName",
    "priceTypeName",
  ];

  for (const param of allowedParams) {
    const val = searchParams.get(param);
    if (val !== null && val !== undefined && val !== "") {
      targetUrl.searchParams.set(param, val);
    }
  }

  // Ensure year is set
  const selectedYear = searchParams.get("year") || String(new Date().getFullYear());
  if (!targetUrl.searchParams.has("year")) {
    targetUrl.searchParams.set("year", selectedYear);
  }

  // Default month range if not specified
  if (!targetUrl.searchParams.has("monthFrom")) {
    targetUrl.searchParams.set("monthFrom", "1");
  }
  if (!targetUrl.searchParams.has("monthTo")) {
    targetUrl.searchParams.set("monthTo", "12");
  }

  const hasSpecificSalesman = Boolean(searchParams.get("salesmanId"));
  const hasSpecificCustomer = Boolean(searchParams.get("customerName") || searchParams.get("customerId"));

  // FAST PATH: If master options for this year are already cached and no customer is requested yet, return immediately!
  const cachedMaster = filterOptionsCache.get(selectedYear);
  if (!hasSpecificCustomer && cachedMaster && cachedMaster.customers.length > 0) {
    return NextResponse.json({
      ok: true,
      data: [],
      suppliers: cachedMaster.suppliers,
      salesmen: cachedMaster.salesmen,
      customers: cachedMaster.customers,
      categories: cachedMaster.categories,
      uoms: cachedMaster.uoms,
      priceTypes: cachedMaster.priceTypes,
    });
  }

  try {
    const res = await fetch(targetUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(
        `ERR_API_FAIL: [CustomerAnnualSales-API] Spring Boot failed [${res.status}]: ${errorText.slice(0, 300)}`
      );
      return NextResponse.json(
        { ok: false, message: `Upstream error: ${res.statusText}`, data: [] },
        { status: res.status }
      );
    }

    const rawData = await res.json();
    let rawItemsList: Record<string, unknown>[] = [];
    if (Array.isArray(rawData)) {
      rawItemsList = rawData as Record<string, unknown>[];
    } else if (rawData && typeof rawData === "object") {
      const parsedObj = rawData as Record<string, unknown>;
      if (Array.isArray(parsedObj.data)) {
        rawItemsList = parsedObj.data as Record<string, unknown>[];
      } else if (Array.isArray(parsedObj.records)) {
        rawItemsList = parsedObj.records as Record<string, unknown>[];
      }
    }

    // In /api/view-annual-customer-sales-detail/filter:
    // Backend provides: rowType ('SALE' | 'RETURN'), returnNo, returnDate, quantity, grossAmount, discountAmount, netAmount, conversionToCases, conversionToPieces.
    // When rowType === 'RETURN' or returnNo is present, or quantity/netAmount is negative, it represents a Sales Return!
    const items: RawCustomerAnnualSales[] = rawItemsList.map((it: Record<string, unknown>) => {
      const isReturn =
        it.rowType === "RETURN" ||
        Boolean(it.returnNo) ||
        Boolean(it.returnDate) ||
        (typeof it.quantity === "number" && it.quantity < 0) ||
        (typeof it.netAmount === "number" && it.netAmount < 0) ||
        Boolean(typeof it.returnedAmount === "number" && it.returnedAmount > 0);

      const rawQty = Math.abs(
        typeof it.quantity === "number"
          ? it.quantity
          : typeof it.soldQuantity === "number"
          ? it.soldQuantity
          : 0
      );
      const rawAmt = Math.abs(
        typeof it.netAmount === "number" && it.netAmount !== 0
          ? it.netAmount
          : typeof it.grossAmount === "number"
          ? it.grossAmount
          : typeof it.soldAmount === "number"
          ? it.soldAmount
          : 0
      );

      const soldQty = isReturn ? 0 : rawQty;
      const soldAmt = isReturn ? 0 : rawAmt;
      
      const retQty = isReturn
        ? rawQty
        : typeof it.returnedQuantity === "number"
        ? it.returnedQuantity
        : 0;
      const retAmt = isReturn
        ? rawAmt
        : typeof it.returnedAmount === "number"
        ? it.returnedAmount
        : 0;

      const cases = (it.conversionToCases as number | null) ??
        (isReturn
          ? ((it.returnedCases as number | null) ?? 0)
          : ((it.soldCases as number | null) ?? 0));
      const pieces = (it.conversionToPieces as number | null) ??
        (isReturn
          ? ((it.returnedPieces as number | null) ?? 0)
          : ((it.soldPieces as number | null) ?? 0));

      return {
        year: (it.year as number | null) ?? null,
        month: (it.month as number | null) ?? null,
        supplierId: (it.supplierId as number | null) ?? null,
        supplierName: (it.supplierName as string | null) ?? null,
        salesmanId: (it.salesmanId as number | null) ?? null,
        salesmanCode: (it.salesmanCode as string | null) ?? null,
        salesmanName: (it.salesmanName as string | null) ?? null,
        customerId: (it.customerId as number | null) ?? null,
        customerCode: (it.customerCode as string | null) ?? null,
        customerName: (it.customerName as string | null) ?? null,
        productId: (it.productId as number | null) ?? null,
        productName: (it.productName as string | null) ?? null,
        productCategory: (it.productCategory as string | null) ?? null,
        unitsId: (it.unitsId as number | null) ?? null,
        unitName: (it.unitName as string | null) ?? null,
        priceTypeName: (it.priceTypeName as string | null) ?? null,
        soldQuantity: soldQty,
        soldAmount: soldAmt,
        returnedQuantity: retQty,
        returnedAmount: retAmt,
        conversionToPieces: pieces,
        conversionToCases: cases,
        unfulfilledAmount: (it.unfulfilledAmount as number | null) ?? 0,
        netAmount: isReturn ? -retAmt : soldAmt,
        poNo: (it.poNo as string | null) ?? null,
        soNo: (it.soNo as string | null) ?? null,
        pdpNos: (it.pdpNos as string | null) ?? null,
        cldtoNos: (it.cldtoNos as string | null) ?? null,
        siNo: (it.siNo as string | null) ?? null,
        dpNos: (it.dpNos as string | null) ?? null,
        deliveredDate: (it.deliveredDate as string | null) ?? null,
        rowType: ((it.rowType as string | null) ?? (isReturn ? "RETURN" : "SALE")),
        returnNo: (it.returnNo as string | null) ?? null,
        returnDate: (it.returnDate as string | null) ?? null,
      };
    });

    if (items.length > 0) {
      console.log("[DETAIL_API_SAMPLE_ITEM_KEYS]:", Object.keys(items[0]));
    }

    // Extract options from current response
    const suppliersSet = new Set<string>();
    const salesmenMap = new Map<number, string>();
    const customersMap = new Map<string, { id: number | string; name: string; code?: string }>();
    const categoriesSet = new Set<string>();
    const uomsSet = new Set<string>();
    const priceTypesSet = new Set<string>();

    for (const item of items) {
      if (item.supplierName) suppliersSet.add(item.supplierName);
      if (item.salesmanId && item.salesmanName) {
        salesmenMap.set(item.salesmanId, item.salesmanName);
      }
      if (item.customerName) {
        const cKey = item.customerName.trim();
        if (!customersMap.has(cKey)) {
          customersMap.set(cKey, {
            id: item.customerId ?? cKey,
            name: cKey,
            code: item.customerCode || undefined,
          });
        }
      }
      if (item.productCategory) categoriesSet.add(item.productCategory);
      if (item.unitName) uomsSet.add(item.unitName);
      if (item.priceTypeName) priceTypesSet.add(item.priceTypeName);
    }

    const currentSalesmen = Array.from(salesmenMap.entries()).map(([id, name]) => ({
      id,
      name,
    }));

    const currentCustomers = Array.from(customersMap.values());

    // If query has no salesman or customer filter, cache this master options list for the year
    if (!hasSpecificSalesman && !hasSpecificCustomer && currentSalesmen.length > 0) {
      filterOptionsCache.set(selectedYear, {
        salesmen: currentSalesmen.sort((a, b) => a.name.localeCompare(b.name)),
        customers: currentCustomers.sort((a, b) => a.name.localeCompare(b.name)),
        suppliers: Array.from(suppliersSet).sort(),
        categories: Array.from(categoriesSet).sort(),
        uoms: Array.from(uomsSet).sort(),
        priceTypes: Array.from(priceTypesSet).sort(),
        timestamp: Date.now(),
      });
    }

    // Retrieve cached master options if available so dropdowns never collapse to 1
    const cachedMaster = filterOptionsCache.get(selectedYear);
    const finalSalesmen =
      (hasSpecificSalesman || hasSpecificCustomer) && cachedMaster?.salesmen && cachedMaster.salesmen.length > 0
        ? cachedMaster.salesmen
        : currentSalesmen.sort((a, b) => a.name.localeCompare(b.name));

    const finalCustomers =
      (hasSpecificSalesman || hasSpecificCustomer) && cachedMaster?.customers && cachedMaster.customers.length > 0
        ? cachedMaster.customers
        : currentCustomers.sort((a, b) => a.name.localeCompare(b.name));

    const finalSuppliers =
      cachedMaster?.suppliers && cachedMaster.suppliers.length > 0
        ? cachedMaster.suppliers
        : Array.from(suppliersSet).sort();

    const finalCategories =
      cachedMaster?.categories && cachedMaster.categories.length > 0
        ? cachedMaster.categories
        : Array.from(categoriesSet).sort();

    const finalUoms =
      cachedMaster?.uoms && cachedMaster.uoms.length > 0
        ? cachedMaster.uoms
        : Array.from(uomsSet).sort();

    const finalPriceTypes =
      cachedMaster?.priceTypes && cachedMaster.priceTypes.length > 0
        ? cachedMaster.priceTypes
        : Array.from(priceTypesSet).sort();

    // When no customer has been selected yet, don't send heavy data array across network
    const itemsToSend = hasSpecificCustomer ? items : [];

    return NextResponse.json({
      ok: true,
      data: itemsToSend,
      suppliers: finalSuppliers,
      salesmen: finalSalesmen,
      customers: finalCustomers,
      categories: finalCategories,
      uoms: finalUoms,
      priceTypes: finalPriceTypes,
    });
  } catch (err) {
    console.error("ERR_API_FAIL: [CustomerAnnualSales-API] Network error:", err);
    return NextResponse.json(
      { ok: false, message: "Internal server network error", data: [] },
      { status: 500 }
    );
  }
}
