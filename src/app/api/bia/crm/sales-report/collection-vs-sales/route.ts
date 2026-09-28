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

function chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
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
        const [smRes, pmRes] = await Promise.all([
            fetchAllItems("salesman", "id,salesman_name,salesman_code"),
            fetchAllItems("payment_methods", "method_id,method_name,isActive"),
        ]);

        const salesmen = smRes.ok
            ? smRes.data.map((s) => ({
                  id: Number(s.id),
                  name: String(s.salesman_name || s.salesman_code || `Salesman #${s.id}`).trim(),
                  code: String(s.salesman_code || "").trim(),
              }))
            : [];

        const paymentMethods = pmRes.ok
            ? pmRes.data.map((pm) => ({
                  id: Number(pm.method_id),
                  name: String(pm.method_name || `Method #${pm.method_id}`).trim(),
              }))
            : [];

        return json({
            success: true,
            message: "OK",
            data: { salesmen, paymentMethods },
        });
    }

    // ==========================================
    // REPORT MODE
    // ==========================================
    const startDate = sp.get("startDate");
    const endDate = sp.get("endDate");
    const filterSalesmanId = sp.get("salesmanId");
    const filterPaymentMethod = sp.get("paymentMethod");

    // 1. Fetch Collection Records directly from underlying tables (No view call to avoid Directus view permission errors)
    const [colRes, detRes, smRes, uRes, coaRes, pmRes] = await Promise.all([
        fetchAllItems(
            "collection",
            "id,docNo,collection_receipt_no,collection_date,date_encoded,salesman_id,collected_by,totalAmount,remarks,isPosted,isCancelled"
        ),
        fetchAllItems("collection_details", "id,collection_id,type,payment_method,amount,remarks"),
        fetchAllItems("salesman", "id,salesman_name,salesman_code"),
        fetchAllItems("user", "user_id,user_fname,user_lname"),
        fetchAllItems("chart_of_accounts", "coa_id,account_title"),
        fetchAllItems("payment_methods", "method_id,method_name"),
    ]);

    const smMap = new Map<number, string>();
    if (smRes.ok) {
        smRes.data.forEach((s) => {
            const id = Number(s.id);
            smMap.set(id, String(s.salesman_name || s.salesman_code || "").trim());
        });
    }

    const userMap = new Map<number, string>();
    if (uRes.ok) {
        uRes.data.forEach((u) => {
            const id = Number(u.user_id);
            const fullName = `${String(u.user_fname || "").trim()} ${String(u.user_lname || "").trim()}`.trim();
            userMap.set(id, fullName);
        });
    }

    const coaMap = new Map<number, string>();
    if (coaRes.ok) {
        coaRes.data.forEach((c) => {
            const id = Number(c.coa_id);
            coaMap.set(id, String(c.account_title || "").trim());
        });
    }

    const pmMap = new Map<number, string>();
    if (pmRes.ok) {
        pmRes.data.forEach((p) => {
            const id = Number(p.method_id);
            pmMap.set(id, String(p.method_name || "").trim());
        });
    }

    const colHeaderMap = new Map<number, AnyRec>();
    if (colRes.ok) {
        colRes.data.forEach((c) => {
            const id = Number(c.id);
            colHeaderMap.set(id, c);
        });
    }

    const rawCollections: AnyRec[] = [];
    if (detRes.ok) {
        for (const d of detRes.data) {
            const colId = Number(d.collection_id);
            const header = colHeaderMap.get(colId);
            if (!header) continue;

            const smId = Number(header.salesman_id);
            const uId = Number(header.collected_by);
            const coaId = Number(d.type);
            const pmId = Number(d.payment_method);
            const isPosted = parseBit(header.isPosted);
            const isCancelled = parseBit(header.isCancelled);

            rawCollections.push({
                id: header.id,
                doc_no: header.docNo,
                receipt_no: header.collection_receipt_no,
                collection_date: header.collection_date,
                date_encoded: header.date_encoded,
                salesman_id: smId,
                salesman: smMap.get(smId) || `Salesman #${smId}`,
                collected_by_id: uId,
                collected_by: userMap.get(uId) || "—",
                type: coaMap.get(coaId) || "—",
                detail_amount: Number(d.amount) || 0,
                detail_remarks: d.remarks || "",
                total_amount: Number(header.totalAmount) || 0,
                remarks: header.remarks || "",
                is_posted: isPosted,
                is_cancelled: isCancelled,
                payment_method_id: pmId,
                payment_method_name: pmMap.get(pmId) || "Other",
            });
        }
    }

    // Filter collections for validity: posted = true, cancelled = false
    const validCollections = rawCollections.filter((c) => {
        return c.is_posted === true && c.is_cancelled !== true;
    });

    // 2. Fetch Sales Data (Reusing Salesman Performance logic directly from sales_invoice table)
    const [salesmenRes, invoicesRes] = await Promise.all([
        fetchAllItems("salesman", "id,salesman_name,salesman_code"),
        fetchAllItems(
            "sales_invoice",
            "invoice_id,salesman_id,customer_code,invoice_date,dispatch_date,created_date,net_amount,order_id"
        ),
    ]);

    const salesmanNameMap = new Map<number, string>();
    if (salesmenRes.ok) {
        salesmenRes.data.forEach((s) => {
            const id = Number(s.id);
            salesmanNameMap.set(id, String(s.salesman_name || s.salesman_code || `Salesman #${id}`).trim());
        });
    }

    // Returns deduction logic
    const returnedTotalByInvoice = new Map<string, number>();
    const salesInvoices = invoicesRes.ok ? invoicesRes.data : [];
    const invoiceIds = salesInvoices
        .map((x) => (x?.invoice_id !== null && x?.invoice_id !== undefined ? String(x.invoice_id).trim() : ""))
        .filter(Boolean);

    if (invoiceIds.length > 0) {
        const invoiceChunks = chunk(invoiceIds, 200);
        const linksAll: AnyRec[] = [];

        for (const part of invoiceChunks) {
            const linkRes = await fetchAllItems("sales_invoice_sales_return", "invoice_no,return_no", {
                invoice_no: { _in: part },
            });
            if (linkRes.ok) linksAll.push(...linkRes.data);
        }

        const invoiceToReturnIds = new Map<string, string[]>();
        for (const l of linksAll) {
            const inv = String(l?.invoice_no ?? "").trim();
            const rid = String(l?.return_no ?? "").trim();
            if (!inv || !rid) continue;
            const arr = invoiceToReturnIds.get(inv) ?? [];
            arr.push(rid);
            invoiceToReturnIds.set(inv, arr);
        }

        const returnIds = Array.from(new Set(Array.from(invoiceToReturnIds.values()).flat()));
        if (returnIds.length > 0) {
            const returnChunks = chunk(returnIds, 200);
            const returnsAll: AnyRec[] = [];

            for (const part of returnChunks) {
                const retRes = await fetchAllItems("sales_return", "return_id,total_amount", {
                    return_id: { _in: part },
                });
                if (retRes.ok) returnsAll.push(...retRes.data);
            }

            const returnAmountById = new Map<string, number>();
            for (const r of returnsAll) {
                const id = String(r?.return_id ?? "").trim();
                const amt = Number(r?.total_amount ?? 0) || 0;
                if (id) returnAmountById.set(id, amt);
            }

            for (const [inv, rids] of invoiceToReturnIds.entries()) {
                const sum = rids.reduce((s, rid) => s + (returnAmountById.get(rid) ?? 0), 0);
                returnedTotalByInvoice.set(inv, sum);
            }
        }
    }

    // 3. Apply Date & Custom Filters
    const filteredCollections = validCollections.filter((c) => {
        const d = toISODateOnly(c.collection_date);
        if (startDate && d && d < startDate) return false;
        if (endDate && d && d > endDate) return false;
        if (filterSalesmanId && filterSalesmanId !== "ALL" && String(c.salesman_id) !== filterSalesmanId) return false;
        if (filterPaymentMethod && filterPaymentMethod !== "ALL" && String(c.payment_method_name) !== filterPaymentMethod)
            return false;
        return true;
    });

    const filteredInvoices = salesInvoices.filter((si) => {
        const d = toISODateOnly(si.invoice_date || si.created_date || si.dispatch_date);
        if (startDate && d && d < startDate) return false;
        if (endDate && d && d > endDate) return false;
        if (filterSalesmanId && filterSalesmanId !== "ALL" && String(si.salesman_id) !== filterSalesmanId) return false;
        return true;
    });

    // 4. Aggregate Totals
    const totalCollected = filteredCollections.reduce((s, c) => s + (Number(c.detail_amount) || 0), 0);
    const totalSales = filteredInvoices.reduce((s, si) => {
        const invId = String(si?.invoice_id ?? "").trim();
        const ret = returnedTotalByInvoice.get(invId) ?? 0;
        const net = Math.max(0, (Number(si?.net_amount ?? 0) || 0) - ret);
        return s + net;
    }, 0);

    const variance = totalCollected - totalSales;
    const collectionEfficiency = totalSales > 0 ? (totalCollected / totalSales) * 100 : totalCollected > 0 ? 100 : 0;

    // 5. Aggregate by Salesman
    const salesmanAggMap = new Map<
        number,
        {
            salesmanId: number;
            salesmanName: string;
            sales: number;
            collections: number;
            receiptsCount: number;
        }
    >();

    const relevantSalesmenIds = new Set<number>();
    filteredCollections.forEach((c) => {
        const id = Number(c.salesman_id);
        if (id > 0) relevantSalesmenIds.add(id);
    });
    filteredInvoices.forEach((si) => {
        const id = Number(si.salesman_id);
        if (id > 0) relevantSalesmenIds.add(id);
    });

    relevantSalesmenIds.forEach((id) => {
        salesmanAggMap.set(id, {
            salesmanId: id,
            salesmanName: salesmanNameMap.get(id) || `Salesman #${id}`,
            sales: 0,
            collections: 0,
            receiptsCount: 0,
        });
    });

    filteredInvoices.forEach((si) => {
        const id = Number(si.salesman_id);
        const agg = salesmanAggMap.get(id);
        if (agg) {
            const invId = String(si?.invoice_id ?? "").trim();
            const ret = returnedTotalByInvoice.get(invId) ?? 0;
            const net = Math.max(0, (Number(si?.net_amount ?? 0) || 0) - ret);
            agg.sales += net;
        }
    });

    filteredCollections.forEach((c) => {
        const id = Number(c.salesman_id);
        const agg = salesmanAggMap.get(id);
        if (agg) {
            agg.collections += Number(c.detail_amount) || 0;
            agg.receiptsCount += 1;
        }
    });

    const salesmenComparison = Array.from(salesmanAggMap.values())
        .map((sm) => {
            const v = sm.collections - sm.sales;
            const eff = sm.sales > 0 ? (sm.collections / sm.sales) * 100 : sm.collections > 0 ? 100 : 0;
            return {
                ...sm,
                variance: v,
                efficiency: eff,
            };
        })
        .sort((a, b) => b.collections - a.collections);

    // 6. Aggregate by Payment Method
    const pmAggMap = new Map<string, { name: string; amount: number; count: number }>();
    filteredCollections.forEach((c) => {
        const name = String(c.payment_method_name || "Other").trim();
        if (!pmAggMap.has(name)) {
            pmAggMap.set(name, { name, amount: 0, count: 0 });
        }
        const curr = pmAggMap.get(name)!;
        curr.amount += Number(c.detail_amount) || 0;
        curr.count += 1;
    });

    const paymentMethodsBreakdown = Array.from(pmAggMap.values())
        .map((pm) => ({
            ...pm,
            share: totalCollected > 0 ? (pm.amount / totalCollected) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

    // 7. Aggregate Timeline (Sales vs Collection over time)
    const timelineMap = new Map<string, { date: string; sales: number; collections: number }>();

    filteredInvoices.forEach((si) => {
        const d = toISODateOnly(si.invoice_date || si.created_date || si.dispatch_date) || "Unknown";
        if (!timelineMap.has(d)) {
            timelineMap.set(d, { date: d, sales: 0, collections: 0 });
        }
        const curr = timelineMap.get(d)!;
        const invId = String(si?.invoice_id ?? "").trim();
        const ret = returnedTotalByInvoice.get(invId) ?? 0;
        const net = Math.max(0, (Number(si?.net_amount ?? 0) || 0) - ret);
        curr.sales += net;
    });

    filteredCollections.forEach((c) => {
        const d = toISODateOnly(c.collection_date) || "Unknown";
        if (!timelineMap.has(d)) {
            timelineMap.set(d, { date: d, sales: 0, collections: 0 });
        }
        const curr = timelineMap.get(d)!;
        curr.collections += Number(c.detail_amount) || 0;
    });

    const timeline = Array.from(timelineMap.values())
        .filter((t) => t.date !== "Unknown")
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((t) => ({
            ...t,
            label: t.date.length >= 10 ? t.date.slice(5) : t.date,
        }));

    // 8. Detailed Receipts (Latest 500 records sorted by date desc)
    const receipts = filteredCollections
        .slice()
        .sort((a, b) => String(b.collection_date || "").localeCompare(String(a.collection_date || "")))
        .slice(0, 500)
        .map((c) => ({
            id: Number(c.id),
            docNo: String(c.doc_no || "—"),
            receiptNo: String(c.receipt_no || "—"),
            collectionDate: toISODateOnly(c.collection_date) || "—",
            salesmanId: Number(c.salesman_id),
            salesmanName: String(c.salesman || salesmanNameMap.get(Number(c.salesman_id)) || "—"),
            collectedBy: String(c.collected_by || "—"),
            accountTitle: String(c.type || "—"),
            paymentMethod: String(c.payment_method_name || "—"),
            amount: Number(c.detail_amount) || 0,
            remarks: String(c.detail_remarks || c.remarks || "—"),
        }));

    return json({
        success: true,
        message: "OK",
        data: {
            kpis: {
                totalSales,
                totalCollected,
                variance,
                collectionEfficiency,
                receiptsCount: filteredCollections.length,
                topPaymentMethod: paymentMethodsBreakdown[0]?.name || "N/A",
                topPaymentAmount: paymentMethodsBreakdown[0]?.amount || 0,
            },
            salesmenComparison,
            paymentMethods: paymentMethodsBreakdown,
            timeline,
            receipts,
            totalReceiptsCount: filteredCollections.length,
        },
    });
}
