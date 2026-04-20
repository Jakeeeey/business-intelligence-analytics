import type {
	TacticalSkuInventoryApiRow,
	TacticalSkuQueryParams,
	TacticalSkuReportRawResponse,
	TacticalSkuSalesmanApiRow,
} from "../types";

type AnyRecord = Record<string, unknown>;

class TacticalSkuProviderError extends Error {
	status: number;

	constructor(message: string, status = 500) {
		super(message);
		this.name = "TacticalSkuProviderError";
		this.status = status;
	}
}

function readString(rec: AnyRecord, ...keys: string[]): string {
	for (const key of keys) {
		const value = rec[key];
		if (typeof value === "string" && value.trim()) return value.trim();
	}
	return "";
}

function readNumber(rec: AnyRecord, ...keys: string[]): number {
	for (const key of keys) {
		const value = rec[key];
		const num = typeof value === "number" ? value : Number(value);
		if (Number.isFinite(num)) return num;
	}
	return 0;
}

function mapSalesmanRow(raw: unknown): TacticalSkuSalesmanApiRow {
	const rec = (raw ?? {}) as AnyRecord;
	const salesmanId = readNumber(rec, "salesmanId", "salesman_id") || null;
	const productCode = readString(rec, "productCode", "product_code", "parentProductCode");
	const productName = readString(rec, "productName", "product_name", "parentProductName") || "Unknown Product";

	return {
		salesmanId,
		salesmanCode: readString(rec, "salesmanCode", "salesman_code"),
		salesmanName: readString(rec, "salesmanName", "salesman_name") || "Unknown Salesman",
		productCode,
		productName,
		brand: readString(rec, "brand", "productBrand", "product_brand"),
		category: readString(rec, "category", "productCategory", "product_category"),
		achieve: readNumber(rec, "achieve", "actual", "reach", "totalReach"),
		target: readNumber(rec, "target", "targetAmount"),
		percent: readNumber(rec, "percent", "achievementPercent"),
		startDate: readString(rec, "startDate", "start_date"),
		endDate: readString(rec, "endDate", "end_date"),
	};
}

function mapInventoryRow(raw: unknown): TacticalSkuInventoryApiRow {
	const rec = (raw ?? {}) as AnyRecord;
	return {
		productCode: readString(rec, "parentProductCode", "productCode", "product_code"),
		productName:
			readString(rec, "parentProductName", "productName", "product_name") ||
			"Unknown Product",
		totalInventoryBox: readNumber(rec, "totalInventoryBox", "inventoryBox", "inventory"),
		totalPieces: readNumber(rec, "totalPieces", "pieces"),
		boxUnCount: readNumber(rec, "boxUnCount", "boxCount"),
	};
}

function normalizeErrorMessage(payload: unknown, fallback: string): string {
	if (payload && typeof payload === "object") {
		const rec = payload as AnyRecord;
		const msg = rec.message;
		const err = rec.error;
		if (typeof msg === "string" && msg.trim()) return msg;
		if (typeof err === "string" && err.trim()) return err;
	}
	return fallback;
}

async function requestJson<T>(url: string): Promise<T> {
	const res = await fetch(url, {
		method: "GET",
		cache: "no-store",
		credentials: "same-origin",
	});

	const payload = await res.json().catch(() => null);

	if (!res.ok) {
		throw new TacticalSkuProviderError(
			normalizeErrorMessage(payload, `Request failed (${res.status})`),
			res.status,
		);
	}

	if (payload && typeof payload === "object") {
		const rec = payload as AnyRecord;
		if (rec.success === false) {
			throw new TacticalSkuProviderError(normalizeErrorMessage(payload, "Request failed"), 400);
		}
	}

	return payload as T;
}

export async function fetchTacticalSkuReport(
	params: TacticalSkuQueryParams,
): Promise<TacticalSkuReportRawResponse> {
	const sp = new URLSearchParams();
	sp.set("mode", "report");

	if (params.month) sp.set("month", params.month);
	if (params.startDate) sp.set("startDate", params.startDate);
	if (params.endDate) sp.set("endDate", params.endDate);
	if (params.productName) sp.set("productName", params.productName);
	if (params.salesmanName) sp.set("salesmanName", params.salesmanName);

	const payload = await requestJson<{
		data?: {
			month?: string;
			startDate?: string;
			endDate?: string;
			rows?: unknown[];
			inventory?: unknown[];
			warnings?: unknown[];
		};
	}>(`/api/bia/crm/tactical-sku?${sp.toString()}`);

	const body = payload?.data ?? {};
	const rows = Array.isArray(body.rows) ? body.rows.map(mapSalesmanRow) : [];
	const inventory = Array.isArray(body.inventory)
		? body.inventory.map(mapInventoryRow)
		: [];
	const warnings = Array.isArray(body.warnings)
		? body.warnings.filter((w): w is string => typeof w === "string")
		: [];

	return {
		month: typeof body.month === "string" ? body.month : "",
		startDate: typeof body.startDate === "string" ? body.startDate : "",
		endDate: typeof body.endDate === "string" ? body.endDate : "",
		rows,
		inventory,
		warnings,
	};
}

export { TacticalSkuProviderError };
