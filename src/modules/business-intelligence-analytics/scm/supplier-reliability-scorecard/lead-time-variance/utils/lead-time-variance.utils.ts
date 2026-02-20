import { LeadTimeVariancePo } from "../types/lead-time-variance.schema";
import { isWithinInterval, parseISO } from "date-fns";

/**
 * Filter Lead Time Variance data by supplier and date range.
 */
export function filterLeadTimeVarianceData(
  data: LeadTimeVariancePo[],
  selectedSupplier: string,
  dateRange: { from?: Date; to?: Date } | undefined,
): LeadTimeVariancePo[] {
  return data.filter((item) => {
    const matchesSupplier =
      selectedSupplier === "all" || item.supplierName === selectedSupplier;

    let matchesDate = true;
    if (dateRange?.from && dateRange?.to) {
      if (!item.poDate) {
        matchesDate = false;
      } else {
        const poDate = parseISO(item.poDate);
        matchesDate = isWithinInterval(poDate, {
          start: dateRange.from,
          end: dateRange.to,
        });
      }
    }

    return matchesSupplier && matchesDate;
  });
}

/**
 * Interface for Lead Time Variance metrics.
 */
export interface LeadTimeVarianceMetrics {
  averageLeadTime: number;
  totalPOs: number;
  minLeadTime: number;
  maxLeadTime: number;
}

/**
 * Calculate key metrics for Lead Time Variance.
 */
export function calculateLeadTimeVarianceMetrics(
  data: LeadTimeVariancePo[],
): LeadTimeVarianceMetrics {
  const validData = data.filter(
    (item) => item.actualLeadTimeDays !== null,
  ) as (LeadTimeVariancePo & { actualLeadTimeDays: number })[];

  if (validData.length === 0) {
    return {
      averageLeadTime: 0,
      totalPOs: data.length,
      minLeadTime: 0,
      maxLeadTime: 0,
    };
  }

  const totalLeadTime = validData.reduce(
    (sum, item) => sum + item.actualLeadTimeDays,
    0,
  );
  const averageLeadTime = totalLeadTime / validData.length;
  const minLeadTime = Math.min(
    ...validData.map((item) => item.actualLeadTimeDays),
  );
  const maxLeadTime = Math.max(
    ...validData.map((item) => item.actualLeadTimeDays),
  );

  return {
    averageLeadTime,
    totalPOs: data.length,
    minLeadTime,
    maxLeadTime,
  };
}

/**
 * Prepare data for the supplier lead time trend chart.
 */
export function prepareSupplierTrendData(data: LeadTimeVariancePo[]) {
  // Group by PO Date or Supplier for a representative trend
  // For now, let's group by supplier and calculate their average lead time
  const supplierGroups: Record<string, { total: number; count: number }> = {};

  data.forEach((item) => {
    if (item.actualLeadTimeDays === null) return;

    if (!supplierGroups[item.supplierName]) {
      supplierGroups[item.supplierName] = { total: 0, count: 0 };
    }
    supplierGroups[item.supplierName].total += item.actualLeadTimeDays;
    supplierGroups[item.supplierName].count += 1;
  });

  return Object.keys(supplierGroups)
    .map((name) => ({
      supplierName: name,
      averageLeadTime: Number(
        (supplierGroups[name].total / supplierGroups[name].count).toFixed(2),
      ),
    }))
    .sort((a, b) => b.averageLeadTime - a.averageLeadTime);
}

/**
 * Prepare data for the lead time variance table.
 */
export function prepareTableData(data: LeadTimeVariancePo[]) {
  return data.map((item) => ({
    ...item,
    // Add any extra formatting here if needed
  }));
}
