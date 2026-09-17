import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const env = (process as unknown as { env: Record<string, string | undefined> }).env;
const DIRECTUS_BASE = (env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
const DIRECTUS_TOKEN = env.DIRECTUS_STATIC_TOKEN || "";

type AnyRec = Record<string, unknown>;

function json(res: unknown, init?: ResponseInit) {
    return NextResponse.json(res, init);
}

function requireEnv() {
    if (!DIRECTUS_BASE) return "NEXT_PUBLIC_API_BASE_URL is not set";
    if (!DIRECTUS_TOKEN) return "DIRECTUS_STATIC_TOKEN is not set";
    return null;
}

function toISODateOnly(v: unknown): string | null {
    if (!v) return null;
    const s = String(v).trim();
    if (!s) return null;
    const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : null;
}

function parseBit(val: unknown): boolean {
    if (!val) return false;
    if (typeof val === "boolean") return val;
    if (typeof val === "number") return val === 1;
    if (typeof val === "string") return val === "1" || val.toLowerCase() === "true";
    if (typeof val === "object" && val !== null) {
        const obj = val as Record<string, unknown>;
        if (Array.isArray(obj.data) && obj.data.length > 0) {
            return Number(obj.data[0]) === 1;
        }
    }
    return false;
}

async function directusGET(path: string, params?: Record<string, string>) {
    const url = new URL(`${DIRECTUS_BASE}${path.startsWith("/") ? "" : "/"}${path}`);
    if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

    const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
            Authorization: `Bearer ${DIRECTUS_TOKEN}`,
            "Content-Type": "application/json",
        },
        cache: "no-store",
    });

    const ct = res.headers.get("content-type") || "";
    const isJson = ct.includes("application/json");
    const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

    if (!res.ok) return { ok: false, status: res.status, body, url: url.toString() } as const;
    return { ok: true, status: res.status, body, url: url.toString() } as const;
}

async function fetchAllItems(collection: string, fields: string, filterObj?: AnyRec) {
    const r = await directusGET(`/items/${collection}`, {
        fields,
        limit: "10000",
        ...(filterObj ? { filter: JSON.stringify(filterObj) } : {}),
    });

    if (!r.ok) {
        return { ok: false as const, status: r.status, error: r.body, url: r.url, data: [] as AnyRec[] };
    }

    return { ok: true as const, status: r.status, data: (r.body?.data ?? []) as AnyRec[] };
}

export async function GET(req: NextRequest) {
    const envErr = requireEnv();
    if (envErr) return json({ success: false, message: envErr, data: null }, { status: 500 });

    const sp = req.nextUrl.searchParams;
    const mode = (sp.get("mode") || "report").toLowerCase();

    // ==========================================
    // LOOKUPS MODE
    // ==========================================
    if (mode === "lookups") {
        const [supRes, brRes, prodRes] = await Promise.all([
            fetchAllItems("suppliers", "id,supplier_name,supplier_shortcut"),
            fetchAllItems("branches", "id,branch_name,branch_code"),
            fetchAllItems("products", "product_id,product_name,product_code"),
        ]);

        const suppliers = supRes.ok
            ? supRes.data.map((s) => ({
                  id: Number(s.id),
                  name: String(s.supplier_name || s.supplier_shortcut || `Supplier #${s.id}`).trim(),
              }))
            : [];

        const branches = brRes.ok
            ? brRes.data.map((b) => ({
                  id: Number(b.id),
                  name: String(b.branch_name || b.branch_code || `Branch #${b.id}`).trim(),
                  code: String(b.branch_code || "").trim(),
              }))
            : [];

        const products = prodRes.ok
            ? prodRes.data
                  .map((p) => ({
                      id: Number(p.product_id),
                      name: String(p.product_name || `Product #${p.product_id}`).trim(),
                      code: String(p.product_code || "").trim(),
                  }))
                  .sort((a, b) => a.name.localeCompare(b.name))
            : [];

        return json({
            success: true,
            message: "OK",
            data: { suppliers, branches, products },
        });
    }

    // ==========================================
    // REPORT MODE
    // ==========================================
    const startDate = sp.get("startDate");
    const endDate = sp.get("endDate");
    const filterSupplierId = sp.get("supplierId");
    const filterBranchId = sp.get("branchId");
    const filterStatus = sp.get("status"); // "ALL" | "FULLY_RECEIVED" | "PARTIALLY_RECEIVED" | "PENDING"
    const filterProductId = sp.get("productId");

    const [poRes, porRes, supRes, brRes, prodRes] = await Promise.all([
        fetchAllItems(
            "purchase_order",
            "purchase_order_id,purchase_order_no,reference,remark,barcode,supplier_name,receiving_type,payment_type,price_type,date,datetime,date_encoded,date_approved,date_received,lead_time_receiving,lead_time_payment,gross_amount,discounted_amount,vat_amount,withholding_tax_amount,total_amount,inventory_status,payment_status,branch_id,is_posted"
        ),
        fetchAllItems(
            "purchase_order_receiving",
            "purchase_order_product_id,purchase_order_id,product_id,batch_no,lot_id,expiry_date,received_quantity,unit_price,discounted_amount,vat_amount,withholding_amount,total_amount,branch_id,receipt_no,receipt_type,receipt_date,received_date,isPosted,is_reverted,receiving_method"
        ),
        fetchAllItems("suppliers", "id,supplier_name,supplier_shortcut"),
        fetchAllItems("branches", "id,branch_name,branch_code"),
        fetchAllItems("products", "product_id,product_name,product_code"),
    ]);

    const supplierMap = new Map<number, string>();
    if (supRes.ok) {
        supRes.data.forEach((s) => {
            const id = Number(s.id);
            supplierMap.set(id, String(s.supplier_name || s.supplier_shortcut || `Supplier #${id}`).trim());
        });
    }

    const branchMap = new Map<number, string>();
    if (brRes.ok) {
        brRes.data.forEach((b) => {
            const id = Number(b.id);
            branchMap.set(id, String(b.branch_name || b.branch_code || `Branch #${id}`).trim());
        });
    }

    const productMap = new Map<number, { name: string; code: string }>();
    if (prodRes.ok) {
        prodRes.data.forEach((p) => {
            const id = Number(p.product_id);
            productMap.set(id, {
                name: String(p.product_name || `Product #${id}`).trim(),
                code: String(p.product_code || "").trim(),
            });
        });
    }

    // Group valid receiving items by purchase_order_id
    const receivingByPoId = new Map<number, AnyRec[]>();
    const receivingTotalByPoId = new Map<number, number>();

    if (porRes.ok) {
        for (const item of porRes.data) {
            const isPosted = parseBit(item.isPosted);
            const isReverted = parseBit(item.is_reverted);
            if (!isPosted || isReverted) continue;

            const poId = Number(item.purchase_order_id);
            if (!poId) continue;

            const arr = receivingByPoId.get(poId) ?? [];
            arr.push(item);
            receivingByPoId.set(poId, arr);

            const amt = Number(item.total_amount) || 0;
            receivingTotalByPoId.set(poId, (receivingTotalByPoId.get(poId) || 0) + amt);
        }
    }

    // Process Purchase Orders
    const allOrders = poRes.ok ? poRes.data : [];
    const processedOrders = allOrders.map((po) => {
        const poId = Number(po.purchase_order_id);
        const supplierId = Number(po.supplier_name);
        const branchId = Number(po.branch_id);
        const poDate = toISODateOnly(po.date || po.date_encoded || po.datetime) || "—";
        const totalAmount = Number(po.total_amount) || 0;
        const grossAmount = Number(po.gross_amount) || 0;
        const discountAmount = Number(po.discounted_amount) || 0;
        const vatAmount = Number(po.vat_amount) || 0;
        const receivedAmount = receivingTotalByPoId.get(poId) || 0;
        const pendingAmount = Math.max(0, totalAmount - receivedAmount);
        const fulfillmentRate = totalAmount > 0 ? (receivedAmount / totalAmount) * 100 : receivedAmount > 0 ? 100 : 0;

        let status: "FULLY_RECEIVED" | "PARTIALLY_RECEIVED" | "PENDING" = "PENDING";
        if (totalAmount > 0 && receivedAmount >= totalAmount * 0.99) {
            status = "FULLY_RECEIVED";
        } else if (receivedAmount > 0) {
            status = "PARTIALLY_RECEIVED";
        }

        const isPosted = parseBit(po.is_posted);

        // Format receiving line items
        const receivingItems = (receivingByPoId.get(poId) || []).map((por) => {
            const prodId = Number(por.product_id);
            const prod = productMap.get(prodId);
            return {
                id: Number(por.purchase_order_product_id),
                productId: prodId,
                productName: prod?.name || `Product #${prodId}`,
                productCode: prod?.code || "—",
                batchNo: String(por.batch_no || "—"),
                expiryDate: toISODateOnly(por.expiry_date) || "—",
                receivedQuantity: Number(por.received_quantity) || 0,
                unitPrice: Number(por.unit_price) || 0,
                totalAmount: Number(por.total_amount) || 0,
                receiptNo: String(por.receipt_no || "—"),
                receiptDate: toISODateOnly(por.receipt_date || por.received_date) || "—",
            };
        });

        return {
            purchaseOrderId: poId,
            purchaseOrderNo: String(po.purchase_order_no || `PO #${poId}`).trim(),
            reference: String(po.reference || "—").trim(),
            remark: String(po.remark || "—").trim(),
            supplierId,
            supplierName: supplierMap.get(supplierId) || `Supplier #${supplierId}`,
            branchId,
            branchName: branchMap.get(branchId) || `Branch #${branchId}`,
            poDate,
            grossAmount,
            discountAmount,
            vatAmount,
            totalAmount,
            receivedAmount,
            pendingAmount,
            fulfillmentRate,
            status,
            isPosted,
            priceType: String(po.price_type || "—"),
            receivingItems,
            itemsCount: receivingItems.length,
        };
    });

    // Apply Filter State
    const filteredOrders = processedOrders.filter((po) => {
        if (startDate && po.poDate !== "—" && po.poDate < startDate) return false;
        if (endDate && po.poDate !== "—" && po.poDate > endDate) return false;
        if (filterSupplierId && filterSupplierId !== "ALL" && String(po.supplierId) !== filterSupplierId) return false;
        if (filterBranchId && filterBranchId !== "ALL" && String(po.branchId) !== filterBranchId) return false;
        if (filterStatus && filterStatus !== "ALL" && po.status !== filterStatus) return false;
        if (filterProductId && filterProductId !== "ALL") {
            const hasProduct = po.receivingItems.some((item) => String(item.productId) === filterProductId);
            if (!hasProduct) return false;
        }
        return true;
    });

    // Compute Overall KPIs
    const totalPoValue = filteredOrders.reduce((s, po) => s + po.totalAmount, 0);
    const totalReceivedValue = filteredOrders.reduce((s, po) => s + po.receivedAmount, 0);
    const totalPendingValue = Math.max(0, totalPoValue - totalReceivedValue);
    const overallFulfillmentRate = totalPoValue > 0 ? (totalReceivedValue / totalPoValue) * 100 : 0;
    const totalPoCount = filteredOrders.length;

    let fullyReceivedCount = 0;
    let partiallyReceivedCount = 0;
    let pendingCount = 0;

    filteredOrders.forEach((po) => {
        if (po.status === "FULLY_RECEIVED") fullyReceivedCount++;
        else if (po.status === "PARTIALLY_RECEIVED") partiallyReceivedCount++;
        else pendingCount++;
    });

    // Compute Supplier Breakdown
    const supplierAggMap = new Map<
        number,
        {
            supplierId: number;
            supplierName: string;
            poCount: number;
            orderedAmount: number;
            receivedAmount: number;
            pendingAmount: number;
        }
    >();

    filteredOrders.forEach((po) => {
        if (!supplierAggMap.has(po.supplierId)) {
            supplierAggMap.set(po.supplierId, {
                supplierId: po.supplierId,
                supplierName: po.supplierName,
                poCount: 0,
                orderedAmount: 0,
                receivedAmount: 0,
                pendingAmount: 0,
            });
        }
        const curr = supplierAggMap.get(po.supplierId)!;
        curr.poCount += 1;
        curr.orderedAmount += po.totalAmount;
        curr.receivedAmount += po.receivedAmount;
        curr.pendingAmount += po.pendingAmount;
    });

    const supplierBreakdown = Array.from(supplierAggMap.values())
        .map((s) => ({
            ...s,
            fulfillmentRate: s.orderedAmount > 0 ? (s.receivedAmount / s.orderedAmount) * 100 : 0,
        }))
        .sort((a, b) => b.orderedAmount - a.orderedAmount);

    // Compute Branch Distribution
    const branchAggMap = new Map<number, { branchId: number; branchName: string; poCount: number; amount: number }>();
    filteredOrders.forEach((po) => {
        if (!branchAggMap.has(po.branchId)) {
            branchAggMap.set(po.branchId, {
                branchId: po.branchId,
                branchName: po.branchName,
                poCount: 0,
                amount: 0,
            });
        }
        const curr = branchAggMap.get(po.branchId)!;
        curr.poCount += 1;
        curr.amount += po.totalAmount;
    });

    const branchDistribution = Array.from(branchAggMap.values())
        .map((b) => ({
            ...b,
            share: totalPoValue > 0 ? (b.amount / totalPoValue) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

    // Compute Product Breakdown
    const productAggMap = new Map<
        number,
        {
            productId: number;
            productName: string;
            productCode: string;
            totalQuantity: number;
            totalAmount: number;
            deliveriesCount: number;
            latestReceiptDate: string;
        }
    >();

    filteredOrders.forEach((po) => {
        po.receivingItems.forEach((item) => {
            if (filterProductId && filterProductId !== "ALL" && String(item.productId) !== filterProductId) return;
            if (!productAggMap.has(item.productId)) {
                productAggMap.set(item.productId, {
                    productId: item.productId,
                    productName: item.productName,
                    productCode: item.productCode,
                    totalQuantity: 0,
                    totalAmount: 0,
                    deliveriesCount: 0,
                    latestReceiptDate: item.receiptDate || "—",
                });
            }
            const curr = productAggMap.get(item.productId)!;
            curr.totalQuantity += item.receivedQuantity;
            curr.totalAmount += item.totalAmount;
            curr.deliveriesCount += 1;
            if (item.receiptDate && item.receiptDate !== "—") {
                if (curr.latestReceiptDate === "—" || item.receiptDate > curr.latestReceiptDate) {
                    curr.latestReceiptDate = item.receiptDate;
                }
            }
        });
    });

    const productBreakdown = Array.from(productAggMap.values())
        .map((p) => ({
            ...p,
            averageUnitPrice: p.totalQuantity > 0 ? p.totalAmount / p.totalQuantity : 0,
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount);

    // Compute Timeline Trend
    const timelineMap = new Map<string, { date: string; ordered: number; received: number }>();
    filteredOrders.forEach((po) => {
        const d = po.poDate;
        if (d === "—") return;
        if (!timelineMap.has(d)) {
            timelineMap.set(d, { date: d, ordered: 0, received: 0 });
        }
        const curr = timelineMap.get(d)!;
        curr.ordered += po.totalAmount;
        curr.received += po.receivedAmount;
    });

    const timeline = Array.from(timelineMap.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((t) => ({
            ...t,
            label: t.date.length >= 10 ? t.date.slice(5) : t.date,
        }));

    return json({
        success: true,
        message: "OK",
        data: {
            kpis: {
                totalPoValue,
                totalReceivedValue,
                totalPendingValue,
                overallFulfillmentRate,
                totalPoCount,
                fullyReceivedCount,
                partiallyReceivedCount,
                pendingCount,
                topSupplier: supplierBreakdown[0]?.supplierName || "N/A",
                topSupplierAmount: supplierBreakdown[0]?.orderedAmount || 0,
                topProduct: productBreakdown[0]?.productName || "N/A",
                topProductAmount: productBreakdown[0]?.totalAmount || 0,
            },
            supplierBreakdown,
            branchDistribution,
            productBreakdown,
            timeline,
            purchaseOrders: filteredOrders.sort((a, b) => b.poDate.localeCompare(a.poDate)),
            totalCount: filteredOrders.length,
        },
    });
}
