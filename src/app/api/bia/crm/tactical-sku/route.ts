import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SPRING_API_BASE = (process.env.SPRING_API_BASE_URL || "").replace(/\/+$/, "");

type AnyRecord = Record<string, unknown>;

function json(data: unknown, init?: ResponseInit) {
	return NextResponse.json(data, init);
}

function trimStr(v: unknown): string {
	return typeof v === "string" ? v.trim() : "";
}

function asNum(v: unknown): number {
	const n = typeof v === "number" ? v : Number(v);
	return Number.isFinite(n) ? n : 0;
}

function getToken(req: NextRequest): string {
	const headerToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
	if (headerToken) return headerToken;

	const cookieToken = req.cookies.get("vos_access_token")?.value?.trim();
	if (cookieToken) return cookieToken;

	return "";
}

function parseMonth(v: string | null): string {
	if (v && /^\d{4}-\d{2}$/.test(v)) return v;
	const now = new Date();
	const mm = String(now.getMonth() + 1).padStart(2, "0");
	return `${now.getFullYear()}-${mm}`;
}

function monthRange(month: string): { startDate: string; endDate: string } {
	const [y, m] = month.split("-");
	const year = Number(y);
	const monthNum = Number(m);
	const startDate = `${year}-${String(monthNum).padStart(2, "0")}-01`;
	const nextMonth = new Date(year, monthNum, 1);
	const endDate = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
	return { startDate, endDate };
}

function unwrapArray(payload: unknown): AnyRecord[] {
	if (Array.isArray(payload)) {
		return payload.filter((x): x is AnyRecord => typeof x === "object" && x !== null);
	}

	if (payload && typeof payload === "object") {
		const rec = payload as AnyRecord;
		if (Array.isArray(rec.data)) {
			return rec.data.filter((x): x is AnyRecord => typeof x === "object" && x !== null);
		}
	}

	return [];
}

async function fetchUpstream(
	req: NextRequest,
	path: string,
	query: Record<string, string | undefined>,
): Promise<{ ok: true; data: AnyRecord[] } | { ok: false; status: number; message: string }> {
	if (!SPRING_API_BASE) {
		return { ok: false, status: 500, message: "SPRING_API_BASE_URL is not configured." };
	}

	const token = getToken(req);
	const url = new URL(`${SPRING_API_BASE}${path.startsWith("/") ? "" : "/"}${path}`);

	for (const [key, value] of Object.entries(query)) {
		if (value && value.trim()) url.searchParams.set(key, value);
	}

	const headers: HeadersInit = {
		"Content-Type": "application/json",
	};

	if (token) headers.Authorization = `Bearer ${token}`;

	const res = await fetch(url.toString(), {
		method: "GET",
		headers,
		cache: "no-store",
	});

	const text = await res.text();
	let payload: unknown = null;
	try {
		payload = text ? JSON.parse(text) : null;
	} catch {
		payload = text;
	}

	if (!res.ok) {
		const msg =
			payload && typeof payload === "object"
				? trimStr((payload as AnyRecord).message) || trimStr((payload as AnyRecord).error)
				: trimStr(payload);
		return {
			ok: false,
			status: res.status,
			message: msg || `Upstream request failed (${res.status})`,
		};
	}

	return { ok: true, data: unwrapArray(payload) };
}

function mapSalesmanRow(raw: AnyRecord, startDate: string, endDate: string): AnyRecord {
	const salesmanId = asNum(raw.salesmanId ?? raw.salesman_id);
	const productCode = trimStr(raw.productCode ?? raw.product_code ?? raw.parentProductCode);
	const productName =
		trimStr(raw.productName ?? raw.product_name ?? raw.parentProductName) || "Unknown Product";

	return {
		salesmanId: salesmanId || null,
		salesmanCode: trimStr(raw.salesmanCode ?? raw.salesman_code),
		salesmanName: trimStr(raw.salesmanName ?? raw.salesman_name) || "Unknown Salesman",
		productCode,
		productName,
		brand: trimStr(raw.brand ?? raw.productBrand ?? raw.product_brand),
		category: trimStr(raw.category ?? raw.productCategory ?? raw.product_category),
		achieve: asNum(raw.achieve ?? raw.actual ?? raw.reach ?? raw.totalReach),
		target: asNum(raw.target ?? raw.targetAmount),
		percent: asNum(raw.percent ?? raw.achievementPercent),
		startDate: trimStr(raw.startDate ?? raw.start_date) || startDate,
		endDate: trimStr(raw.endDate ?? raw.end_date) || endDate,
	};
}

function inventoryKey(code: string, name: string): string {
	return `${code.trim().toLowerCase()}::${name.trim().toLowerCase()}`;
}

export async function GET(req: NextRequest) {
	try {
		const sp = req.nextUrl.searchParams;
		const mode = (sp.get("mode") || "report").toLowerCase();

		if (mode !== "report") {
			return json({ success: false, message: "Unsupported mode." }, { status: 400 });
		}

		const month = parseMonth(sp.get("month"));
		const computedRange = monthRange(month);
		const startDate = sp.get("startDate") || computedRange.startDate;
		const endDate = sp.get("endDate") || computedRange.endDate;
		const productName = sp.get("productName") || undefined;
		const salesmanName = sp.get("salesmanName") || undefined;

		const salesResponse = await fetchUpstream(
			req,
			"/api/view-salesman-actual-vs-target-tactical-sku",
			{
				startDate,
				endDate,
				productName,
				salesmanName,
			},
		);

		if (!salesResponse.ok) {
			return json(
				{
					success: false,
					message: salesResponse.message,
					data: null,
				},
				{ status: salesResponse.status },
			);
		}

		const rows = salesResponse.data.map((row) => mapSalesmanRow(row, startDate, endDate));
		const warnings: string[] = [];

		const productPairs = new Map<string, { code: string; name: string }>();
		for (const row of rows) {
			const code = trimStr((row as AnyRecord).productCode);
			const name = trimStr((row as AnyRecord).productName);
			if (!name) continue;
			productPairs.set(inventoryKey(code, name), { code, name });
		}

		const inventoryFetches = Array.from(productPairs.values()).map(async ({ code, name }) => {
			const inventoryRes = await fetchUpstream(req, "/api/view-product-inventory-box", {
				parentProductCode: code || undefined,
				parentProductName: name || undefined,
			});

			if (!inventoryRes.ok) {
				warnings.push(`Inventory lookup failed for ${name}: ${inventoryRes.message}`);
				return null;
			}

			const first = inventoryRes.data[0] ?? {};
			return {
				productCode: trimStr(first.parentProductCode ?? first.productCode) || code,
				productName: trimStr(first.parentProductName ?? first.productName) || name,
				totalInventoryBox: asNum(first.totalInventoryBox ?? first.inventoryBox ?? first.inventory),
				totalPieces: asNum(first.totalPieces ?? first.pieces),
				boxUnCount: asNum(first.boxUnCount ?? first.boxCount),
			};
		});

		const inventoryResults = await Promise.all(inventoryFetches);
		const inventory = inventoryResults.filter((x): x is NonNullable<typeof x> => !!x);

		return json(
			{
				success: true,
				message: "OK",
				data: {
					month,
					startDate,
					endDate,
					rows,
					inventory,
					warnings,
				},
			},
			{ status: 200 },
		);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Internal server error";
		return json(
			{
				success: false,
				message,
				data: null,
			},
			{ status: 500 },
		);
	}
}
