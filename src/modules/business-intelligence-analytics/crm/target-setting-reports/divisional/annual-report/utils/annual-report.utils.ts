import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import {
  type SalesTransaction,
  type PurchaseTransaction,
  type MonthlyAggregate,
  type DashboardSummary,
  type HalfYearDataPoint,
} from "../types/annual-report.schema";

/**
 * Formats a numeric month (1-12) into a short label like "Jan", "Feb".
 * @param year - The calendar year
 * @param month - The month number (1-12)
 * @returns Short month label string
 */
export function formatMonthLabel(year: number, month: number): string {
  return format(new Date(year, month - 1), "MMM");
}

/**
 * Aggregates raw sales and purchase transactions into monthly data points.
 * Groups transactions by year-month, sums amounts, and calculates variance and bias%.
 * @param sales - Array of validated sales transactions
 * @param purchases - Array of validated purchase transactions
 * @returns Chronologically sorted monthly aggregate array
 */
export function aggregateMonthlyData(
  sales: SalesTransaction[],
  purchases: PurchaseTransaction[],
): MonthlyAggregate[] {
  const monthlyMap = new Map<string, { sales: number; purchases: number }>();

  for (const t of sales) {
    try {
      const date = parseISO(t.invoiceDate);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const entry = monthlyMap.get(key) ?? { sales: 0, purchases: 0 };
      entry.sales += t.totalInvoiceAmount;
      monthlyMap.set(key, entry);
    } catch {
      // skip invalid dates
    }
  }

  for (const t of purchases) {
    try {
      const date = parseISO(t.receiptDate);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const entry = monthlyMap.get(key) ?? { sales: 0, purchases: 0 };
      entry.purchases += t.totalReceiptAmount;
      monthlyMap.set(key, entry);
    } catch {
      // skip invalid dates
    }
  }

  return Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, values]) => {
      const [year, month] = key.split("-").map(Number);
      const variance = values.sales - values.purchases;
      const total = values.sales + values.purchases;
      const biasPercentage = total > 0 ? (values.sales / total) * 100 : 0;

      return {
        month,
        year,
        monthLabel: formatMonthLabel(year, month),
        totalSales: values.sales,
        totalPurchases: values.purchases,
        variance,
        biasPercentage: Math.round(biasPercentage * 100) / 100,
      };
    });
}

/**
 * Calculates aggregate KPI summary from monthly data.
 * Computes total sales, total purchases, net variance, and bias percentage.
 * @param monthlyData - Array of monthly aggregates
 * @returns Dashboard summary with total metrics
 */
export function calculateSummary(
  monthlyData: MonthlyAggregate[],
): DashboardSummary {
  const totalSales = monthlyData.reduce((sum, m) => sum + m.totalSales, 0);
  const totalPurchases = monthlyData.reduce(
    (sum, m) => sum + m.totalPurchases,
    0,
  );
  const netVariance = totalSales - totalPurchases;
  const total = totalSales + totalPurchases;
  const biasPercentage = total > 0 ? (totalSales / total) * 100 : 0;

  return {
    totalSales,
    totalPurchases,
    netVariance,
    biasPercentage: Math.round(biasPercentage * 100) / 100,
  };
}

/**
 * Aggregates monthly data points into half-year (H1 / H2) buckets.
 * H1 = Jan-Jun, H2 = Jul-Dec. Each bucket sums sales, purchases,
 * and recalculates variance and bias%.
 * @param monthlyData - Array of monthly aggregates
 * @returns Chronologically sorted half-year aggregate array
 */
export function aggregateToHalfYears(
  monthlyData: MonthlyAggregate[],
): HalfYearDataPoint[] {
  const halfMap = new Map<string, HalfYearDataPoint>();

  for (const m of monthlyData) {
    const half: 1 | 2 = m.month <= 6 ? 1 : 2;
    const key = `${m.year}-H${half}`;
    const existing = halfMap.get(key);
    if (existing) {
      existing.totalSales += m.totalSales;
      existing.totalPurchases += m.totalPurchases;
    } else {
      halfMap.set(key, {
        label: `H${half}`,
        year: m.year,
        half,
        totalSales: m.totalSales,
        totalPurchases: m.totalPurchases,
        variance: 0,
        biasPercentage: 0,
      });
    }
  }

  const results = Array.from(halfMap.values()).sort(
    (a, b) => a.year - b.year || a.half - b.half,
  );

  for (const r of results) {
    r.variance = r.totalSales - r.totalPurchases;
    const total = r.totalSales + r.totalPurchases;
    r.biasPercentage = total > 0 ? Math.round((r.totalSales / total) * 10000) / 100 : 0;
  }

  return results;
}

/**
 * Filters sales transactions by customer name (case-insensitive partial match).
 * @param transactions - Raw sales transactions
 * @param customerName - Optional customer name filter
 * @returns Filtered sales transactions
 */
export function filterSalesByCustomer(
  transactions: SalesTransaction[],
  customerName?: string,
): SalesTransaction[] {
  if (!customerName) return transactions;
  return transactions.filter((t) =>
    t.customerName.toLowerCase().includes(customerName.toLowerCase()),
  );
}

/**
 * Filters purchase transactions by supplier name (case-insensitive partial match).
 * @param transactions - Raw purchase transactions
 * @param supplierName - Optional supplier name filter
 * @returns Filtered purchase transactions
 */
export function filterPurchasesBySupplier(
  transactions: PurchaseTransaction[],
  supplierName?: string,
): PurchaseTransaction[] {
  if (!supplierName) return transactions;
  return transactions.filter((t) =>
    t.supplierName.toLowerCase().includes(supplierName.toLowerCase()),
  );
}

/**
 * Filters transactions by an optional date range.
 * Supports filtering by invoiceDate or receiptDate based on dateKey.
 * @param transactions - Array of transactions with date fields
 * @param dateFrom - Start date string (ISO format)
 * @param dateTo - End date string (ISO format)
 * @param dateKey - Which date field to filter on
 * @returns Filtered transactions within the date range
 */
export function filterByDateRange<T extends { invoiceDate?: string; receiptDate?: string }>(
  transactions: T[],
  dateFrom?: string,
  dateTo?: string,
  dateKey?: "invoiceDate" | "receiptDate",
): T[] {
  if (!dateFrom && !dateTo) return transactions;
  const from = dateFrom ? new Date(dateFrom) : null;
  const to = dateTo ? new Date(dateTo) : null;

  return transactions.filter((t) => {
    const dateStr = dateKey === "receiptDate" ? t.receiptDate : t.invoiceDate;
    if (!dateStr) return true;
    const d = new Date(dateStr);
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });
}

/**
 * Formats a currency value with optional abbreviation for long display.
 * Abbreviates to M (millions) or K (thousands) when the formatted string
 * exceeds maxLength characters.
 * @param value - The numeric amount
 * @param maxLength - Maximum allowed string length before abbreviation (default 15)
 * @returns Formatted currency string, abbreviated if needed
 */
export function formatCurrencyDisplay(
  value: number,
  maxLength: number = 15,
): string {
  const full = formatCurrency(value);
  if (full.length <= maxLength) return full;

  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return formatCurrency(Math.round(value / 1_000_000) * 1_000_000);
  }
  if (abs >= 1_000) {
    return formatCurrency(Math.round(value / 1_000) * 1_000);
  }
  return full;
}

