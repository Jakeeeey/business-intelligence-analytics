
import type {
  VisitRecord,
  Driver,
  DriverOption,
  PaginatedResult,
} from "../types";

const INTERNAL_ROUTE = "/api/bia/scm/logistics-performance/driver-kpi";

async function parseJsonSafely(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Unexpected non-JSON response: ${text.slice(0, 300)}`);
  }
}

function extractRowsAndTotal(json: unknown, res: Response) {
  let rows: unknown[] = [];
  let total = 0;

  if (Array.isArray(json)) {
    rows = json;
    total = rows.length;
  } else if (json && typeof json === "object") {
    const rec = json as Record<string, unknown>;
    if (Array.isArray(rec.data)) rows = rec.data as unknown[];
    // attempt to read meta.pagination.total or filter_count
    const meta = rec.meta as Record<string, unknown> | undefined;
    const pagination =
      meta && typeof meta === "object"
        ? (meta["pagination"] as Record<string, unknown> | undefined)
        : undefined;
    if (pagination && typeof pagination["total"] !== "undefined")
      total = Number(pagination["total"]) || rows.length;
    else if (typeof rec["filter_count"] !== "undefined")
      total = Number(rec["filter_count"]) || rows.length;
    else if (typeof rec["total"] !== "undefined")
      total = Number(rec["total"]) || rows.length;
    else {
      const hdr = res.headers.get("x-total-count");
      total = hdr ? Number(hdr) || rows.length : rows.length;
    }
  }

  return { rows, total } as { rows: unknown[]; total: number };
}

export async function fetchDriverCustomerVisits(
  params: {
    startDate?: string;
    endDate?: string;
    driverNames?: string[];
    page?: number;
    limit?: number;
    search?: string;
  } = {},
): Promise<PaginatedResult<VisitRecord>> {
  const q = new URLSearchParams();
  if (params.startDate) q.set("startDate", params.startDate);
  if (params.endDate) q.set("endDate", params.endDate);
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.search) q.set("search", String(params.search));
  if (params.driverNames && params.driverNames.length) {
    // Support multiple driverNames by adding one query param per selected
    // driver. The internal API route will forward repeated params upstream.
    // Use `append` so multiple driverNames entries are present in the URL.
    params.driverNames.forEach((n) => q.append("driverNames", String(n)));
  }

  const url = `${INTERNAL_ROUTE}${q.toString() ? `?${q.toString()}` : ""}`;
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  // Read body as text so we can surface helpful errors to the UI when the
  // internal route or upstream service returns a non-OK status.
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    // Try to extract a meaningful error message from JSON responses.
    let msg = text || `Request failed with status ${res.status}`;
    try {
      const parsed = text ? JSON.parse(text) : null;
      if (parsed && typeof parsed === "object") {
        const p = parsed as Record<string, unknown>;
        msg = (typeof p["message"] === "string" && p["message"]) as string;
        if (!msg && typeof p["error"] === "string") msg = p["error"] as string;
        if (!msg) msg = JSON.stringify(p);
      }
    } catch {
      // keep original text
    }
    throw new Error(msg || `Request failed with status ${res.status}`);
  }

  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Unexpected non-JSON response: ${text.slice(0, 300)}`);
  }
  const { rows, total } = extractRowsAndTotal(json, res);

  return {
    rows: (rows as VisitRecord[]) || [],
    total: total || 0,
    page: params.page ?? 1,
    limit: params.limit ?? (rows.length || 0),
  };
}

// --- Driver helpers & Directus query ---
export function formatDriverDisplay(name: string) {
  return name.trim().replace(/\s+/g, " ").toUpperCase();
}

export function formatDriverRaw(user: Partial<Driver>) {
  const first = user.user_fname ?? "";
  const last = user.user_lname ?? "";
  // preserve internal spacing; ensure there is a separator if needed
  const sep = first.endsWith(" ") || first === "" ? "" : " ";
  return `${first}${sep}${last}`;
}

export function mapDriversToOptions(users: Driver[]): DriverOption[] {
  const map = new Map<string, DriverOption>();
  users.forEach((user) => {
    const raw = formatDriverRaw(user);
    const display = formatDriverDisplay(
      `${user.user_fname ?? ""} ${user.user_lname ?? ""}`,
    );
    // Prefer unique key by id when available so two records with the same
    // display name but different ids are preserved in the options list.
    const key =
      user.id !== undefined && user.id !== null ? String(user.id) : raw.trim();
    if (!map.has(key)) {
      map.set(key, { label: display, value: raw, id: user.id });
    }
  });
  return Array.from(map.values());
}

export async function fetchDrivers(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    department?: number | string;
    position?: string | null;
  } = {},
): Promise<PaginatedResult<Driver>> {
  const q = new URLSearchParams();
  q.set("directusCollection", "user");
  // Request id + name fields and position/department so we can filter by position
  q.set(
    "fields",
    "user_id,user_fname,user_mname,user_lname,user_position,user_department",
  );
  if (params.limit) q.set("limit", String(params.limit));
  if (params.page) q.set("page", String(params.page));
  // Build Directus filter. Default behavior: return only user_position = 'Driver'.
  // To fetch all positions in a department, call with position: null.
  const filterObj: Record<string, unknown> = { _and: [] };
  const hasPositionKey = Object.prototype.hasOwnProperty.call(
    params,
    "position",
  );
  const positionValue = hasPositionKey ? params.position : undefined;
  const defaultPosition =
    positionValue === undefined ? "Driver" : positionValue;
  if (defaultPosition !== null && typeof defaultPosition !== "undefined") {
    (filterObj._and as unknown[]).push({
      user_position: { _eq: String(defaultPosition) },
    });
  }
  if (typeof params.department !== "undefined" && params.department !== null) {
    (filterObj._and as unknown[]).push({
      user_department: { _eq: Number(params.department) },
    });
  }
  // If a search term was provided, include name _icontains tests
  if (params.search) {
    const s = String(params.search).trim();
    if (s) {
      (filterObj._and as unknown[]).push({
        _or: [
          { user_fname: { _icontains: s } },
          { user_mname: { _icontains: s } },
          { user_lname: { _icontains: s } },
        ],
      });
    }
  }
  q.set("filter", JSON.stringify(filterObj));

  const url = `${INTERNAL_ROUTE}?${q.toString()}`;
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  if (!res.ok)
    return {
      rows: [],
      total: 0,
      page: params.page ?? 1,
      limit: params.limit ?? 0,
    };

  const json = await parseJsonSafely(res);
  const { rows, total } = extractRowsAndTotal(json, res);

  const rowsArr = (rows as unknown[]).map((r) => r as Record<string, unknown>);
  const drivers: Driver[] = rowsArr.map((rec) => {
    const rawId = rec["user_id"] ?? rec["id"] ?? rec["userId"];
    const id =
      typeof rawId === "number" || typeof rawId === "string"
        ? rawId
        : String(rawId ?? "");
    return {
      id,
      user_fname:
        typeof rec["user_fname"] === "string"
          ? String(rec["user_fname"])
          : undefined,
      user_mname:
        typeof rec["user_mname"] === "string"
          ? String(rec["user_mname"])
          : undefined,
      user_lname:
        typeof rec["user_lname"] === "string"
          ? String(rec["user_lname"])
          : undefined,
      user_position:
        typeof rec["user_position"] === "string"
          ? String(rec["user_position"])
          : undefined,
      user_department:
        typeof rec["user_department"] === "number"
          ? (rec["user_department"] as number)
          : typeof rec["user_department"] === "string"
            ? Number(rec["user_department"])
            : undefined,
    };
  });

  return {
    rows: drivers,
    total: total || drivers.length,
    page: params.page ?? 1,
    limit: params.limit ?? drivers.length,
  };
}

export async function fetchDriverOptions(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    department?: number | string;
    position?: string | null;
  } = {},
): Promise<DriverOption[]> {
  const drivers = await fetchDrivers({
    ...(params || {}),
    limit: params.limit ?? 1000,
  });
  return mapDriversToOptions(drivers.rows || []);
}