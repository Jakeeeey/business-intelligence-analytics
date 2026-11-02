import {
  CustomerAnnualSaleItem,
  MonthlyCustomerAggregate,
  CustomerSalesSummary,
} from "../types/customer-annual-sales.schema";

export const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function aggregateMonthlyCustomerData(
  items: CustomerAnnualSaleItem[],
  selectedYear: number,
  unitName?: string,
  allowedMonths?: number[]
): MonthlyCustomerAggregate[] {
  const isPieces = unitName?.toLowerCase() === "pieces";
  const isBox = unitName?.toLowerCase() === "box";

  const monthsToInclude =
    allowedMonths && allowedMonths.length > 0 && allowedMonths.length < 12
      ? allowedMonths.slice().sort((a, b) => a - b)
      : Array.from({ length: 12 }, (_, i) => i + 1);

  const map = new Map<number, {
    soldAmount: number;
    returnedAmount: number;
    netAmount: number;
    soldQuantity: number;
    returnedQuantity: number;
  }>();

  for (const m of monthsToInclude) {
    map.set(m, {
      soldAmount: 0,
      returnedAmount: 0,
      netAmount: 0,
      soldQuantity: 0,
      returnedQuantity: 0,
    });
  }

  for (const item of items) {
    const m = item.month ?? 1;
    if (!map.has(m)) continue;
    const current = map.get(m)!;

    current.soldAmount += item.soldAmount ?? 0;
    current.returnedAmount += item.returnedAmount ?? 0;
    current.netAmount += item.netAmount ?? ((item.soldAmount ?? 0) - (item.returnedAmount ?? 0));

    const isReturn = item.rowType === "RETURN" || (item.returnedAmount ?? 0) > 0;

    if (isReturn) {
      current.returnedQuantity += isPieces
        ? (item.conversionToPieces ?? 0)
        : isBox
        ? (item.conversionToCases ?? 0)
        : (item.returnedQuantity ?? 0);
    } else {
      current.soldQuantity += isPieces
        ? (item.conversionToPieces ?? 0)
        : isBox
        ? (item.conversionToCases ?? 0)
        : (item.soldQuantity ?? 0);
    }

    map.set(m, current);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([month, totals]) => ({
      month,
      year: selectedYear,
      monthLabel: MONTH_LABELS[month - 1] || `Month ${month}`,
      soldAmount: Number(totals.soldAmount.toFixed(2)),
      returnedAmount: Number(totals.returnedAmount.toFixed(2)),
      netAmount: Number(totals.netAmount.toFixed(2)),
      soldQuantity: totals.soldQuantity,
      returnedQuantity: totals.returnedQuantity,
    }));
}

export function calculateCustomerSummary(
  monthlyData: MonthlyCustomerAggregate[]
): CustomerSalesSummary {
  let totalSoldAmount = 0;
  let totalReturnedAmount = 0;
  let totalNetAmount = 0;
  let totalSoldQuantity = 0;
  let totalReturnedQuantity = 0;

  for (const m of monthlyData) {
    totalSoldAmount += m.soldAmount;
    totalReturnedAmount += m.returnedAmount;
    totalNetAmount += m.netAmount;
    totalSoldQuantity += m.soldQuantity;
    totalReturnedQuantity += m.returnedQuantity;
  }

  return {
    totalSoldAmount: Number(totalSoldAmount.toFixed(2)),
    totalReturnedAmount: Number(totalReturnedAmount.toFixed(2)),
    totalNetAmount: Number(totalNetAmount.toFixed(2)),
    totalSoldQuantity,
    totalReturnedQuantity,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
