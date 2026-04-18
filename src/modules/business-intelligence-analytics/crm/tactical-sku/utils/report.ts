import type {
  TacticalSkuChartPoint,
  TacticalSkuInventoryApiRow,
  TacticalSkuKpis,
  TacticalSkuProductRow,
  TacticalSkuSalesmanApiRow,
  TacticalSkuSalesmanRow,
} from "../types";

function pad2(v: number): string {
  return String(v).padStart(2, "0");
}

export function getDefaultMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

export function getMonthDateRange(month: string): { startDate: string; endDate: string } {
  const m = month.match(/^(\d{4})-(\d{2})$/);
  if (!m) {
    const fallback = getDefaultMonth();
    return getMonthDateRange(fallback);
  }

  const year = Number(m[1]);
  const monthIdx = Number(m[2]);
  const startDate = `${year}-${pad2(monthIdx)}-01`;
  const nextMonthDate = new Date(year, monthIdx, 1);
  const endDate = `${nextMonthDate.getFullYear()}-${pad2(nextMonthDate.getMonth() + 1)}-01`;

  return { startDate, endDate };
}

function clean(v: string): string {
  return v.trim().toLowerCase();
}

function productKey(code: string, name: string): string {
  return `${clean(code)}::${clean(name)}`;
}

function toFiniteNumber(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function salesmanKey(code: string, name: string): string {
  const c = clean(code);
  const n = clean(name);
  return c || n;
}

function safePercent(reach: number, target: number, fallback: number): number {
  if (target > 0) return (reach / target) * 100;
  return Number.isFinite(fallback) ? fallback : 0;
}

export function buildTacticalSkuRows(
  rows: TacticalSkuSalesmanApiRow[],
  inventoryRows: TacticalSkuInventoryApiRow[],
): TacticalSkuProductRow[] {
  const inventoryByKey = new Map<string, number>();
  const inventoryByName = new Map<string, number>();

  for (const inv of inventoryRows) {
    const key = productKey(inv.productCode, inv.productName);
    const nameKey = clean(inv.productName);
    const qty = toFiniteNumber(inv.totalInventoryBox);
    inventoryByKey.set(key, qty);
    if (nameKey) inventoryByName.set(nameKey, qty);
  }

  const grouped = new Map<
    string,
    {
      brand: string;
      category: string;
      productCode: string;
      productName: string;
      inventory: number;
      salesmenMap: Map<string, TacticalSkuSalesmanRow>;
    }
  >();

  for (const row of rows) {
    const code = row.productCode?.trim() ?? "";
    const name = row.productName?.trim() ?? "Unknown Product";
    const key = productKey(code, name);

    const existing = grouped.get(key) ?? {
      brand: row.brand?.trim() || "-",
      category: row.category?.trim() || "-",
      productCode: code,
      productName: name,
      inventory: inventoryByKey.get(key) ?? inventoryByName.get(clean(name)) ?? 0,
      salesmenMap: new Map<string, TacticalSkuSalesmanRow>(),
    };

    const reach = toFiniteNumber(row.achieve);
    const target = toFiniteNumber(row.target);

    const smCode = row.salesmanCode?.trim() || (row.salesmanId ? `SM${row.salesmanId}` : "-");
    const smName = row.salesmanName?.trim() || "Unknown Salesman";
    const smKey = salesmanKey(smCode, smName);

    const sales = existing.salesmenMap.get(smKey) ?? {
      salesmanName: smName,
      code: smCode,
      reach: 0,
      target: 0,
      percent: 0,
    };

    // Backend may repeat rows for the same salesman/product while varying target.
    // Keep the highest achieved value to avoid double-counting reach.
    sales.reach = Math.max(sales.reach, reach);
    sales.target += target;
    sales.percent = safePercent(sales.reach, sales.target, toFiniteNumber(row.percent));
    existing.salesmenMap.set(smKey, sales);

    grouped.set(key, existing);
  }

  const built = Array.from(grouped.entries()).map(([key, g]) => {
    const salesmen = Array.from(g.salesmenMap.values()).sort((a, b) => b.reach - a.reach);
    const totalReach = salesmen.reduce((sum, s) => sum + toFiniteNumber(s.reach), 0);
    const totalTarget = salesmen.reduce((sum, s) => sum + toFiniteNumber(s.target), 0);
    const targetPercent = safePercent(totalReach, totalTarget, 0);

    return {
      key,
      rank: 0,
      brand: g.brand,
      category: g.category,
      productCode: g.productCode,
      productName: g.productName,
      inventory: g.inventory,
      totalReach,
      target: totalTarget,
      targetPercent,
      salesmen,
    } satisfies TacticalSkuProductRow;
  });

  built.sort((a, b) => b.totalReach - a.totalReach);
  return built.map((row, idx) => ({ ...row, rank: idx + 1 }));
}

export function buildTacticalSkuKpis(rows: TacticalSkuProductRow[]): TacticalSkuKpis {
  const totalProducts = rows.length;
  const totalInventory = rows.reduce((sum, row) => sum + toFiniteNumber(row.inventory), 0);
  const totalReach = rows.reduce((sum, row) => sum + toFiniteNumber(row.totalReach), 0);
  const totalTarget = rows.reduce((sum, row) => sum + toFiniteNumber(row.target), 0);
  const overallPercent = totalTarget > 0 ? (totalReach / totalTarget) * 100 : 0;

  return {
    totalProducts,
    totalInventory,
    totalReach,
    totalTarget,
    overallPercent,
  };
}

export function buildTacticalSkuChartData(
  rows: TacticalSkuProductRow[],
  limit = 10,
): TacticalSkuChartPoint[] {
  return rows.slice(0, limit).map((row) => ({
    productName: row.productName,
    reach: row.totalReach,
    target: row.target,
    inventory: row.inventory,
  }));
}