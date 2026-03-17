import { parse } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  FulfillmentRatePo,
  ScmSummaryMetrics,
} from "../types/fulfillment-rate.schema";
import { FulfillmentRateTableData } from "../components/data-table/Columns";

/**
 * Filters fulfillment rate data by supplier and date range.
 */
export function filterFulfillmentRateData(
  data: FulfillmentRatePo[],
  selectedSupplier: string,
  dateRange: DateRange | undefined,
) {
  let result = data;

  if (selectedSupplier !== "all") {
    result = result.filter((d) => d.supplierName === selectedSupplier);
  }

  if (dateRange?.from || dateRange?.to) {
    result = result.filter((d) => {
      try {
        const poDate = parse(d.poDate, "yyyy-MM-dd", new Date());
        const isAfterFrom = !dateRange.from || poDate >= dateRange.from;
        const isBeforeTo = !dateRange.to || poDate <= dateRange.to;
        return isAfterFrom && isBeforeTo;
      } catch {
        return true;
      }
    });
  }

  return result;
}

/**
 * Calculates summary metrics from fulfillment rate data.
 */
export function calculateFulfillmentRateMetrics(
  data: FulfillmentRatePo[],
): ScmSummaryMetrics {
  if (data.length === 0) {
    return {
      avgFulfillmentRate: 0,
      suppliersBelow95Count: 0,
      totalSuppliers: 0,
      totalPOs: 0,
      totalFulfillmentPct: 0,
    };
  }

  const totals = data.reduce(
    (acc, d) => ({
      ordered: acc.ordered + d.totalOrderedQty,
      received: acc.received + d.totalReceivedQty,
    }),
    { ordered: 0, received: 0 },
  );

  const supplierStats = new Map<
    string,
    { totalOrdered: number; totalReceived: number }
  >();
  data.forEach((d) => {
    const current = supplierStats.get(d.supplierName) || {
      totalOrdered: 0,
      totalReceived: 0,
    };
    supplierStats.set(d.supplierName, {
      totalOrdered: current.totalOrdered + d.totalOrderedQty,
      totalReceived: current.totalReceived + d.totalReceivedQty,
    });
  });

  const avgFulfillmentRate =
    totals.ordered > 0 ? (totals.received / totals.ordered) * 100 : 0;

  let belowTargetCount = 0;
  supplierStats.forEach((val) => {
    const rate =
      val.totalOrdered > 0 ? (val.totalReceived / val.totalOrdered) * 100 : 0;
    if (rate < 100) belowTargetCount++;
  });

  return {
    avgFulfillmentRate,
    suppliersBelow95Count: belowTargetCount, // Keeping property name for schema compatibility but using 100% threshold
    totalSuppliers: supplierStats.size,
    totalPOs: data.length,
    totalFulfillmentPct: avgFulfillmentRate,
  };
}

/**
 * Prepares data for the fulfillment rate bar chart.
 */
export function prepareSupplierChartData(data: FulfillmentRatePo[]) {
  const supplierMap = new Map<
    string,
    { totalOrdered: number; totalReceived: number }
  >();
  data.forEach((d) => {
    const current = supplierMap.get(d.supplierName) || {
      totalOrdered: 0,
      totalReceived: 0,
    };
    supplierMap.set(d.supplierName, {
      totalOrdered: current.totalOrdered + d.totalOrderedQty,
      totalReceived: current.totalReceived + d.totalReceivedQty,
    });
  });

  return Array.from(supplierMap.entries())
    .map(([name, val]) => {
      const fulfillmentRate =
        val.totalOrdered > 0 ? (val.totalReceived / val.totalOrdered) * 100 : 0;

      return {
        name,
        fulfillmentRate,
      };
    })
    .sort((a, b) => a.fulfillmentRate - b.fulfillmentRate);
}

/**
 * Prepares data for the fulfillment rate data table.
 */
export function prepareSupplierTableData(
  data: FulfillmentRatePo[],
): FulfillmentRateTableData[] {
  const supplierMap = new Map<
    string,
    {
      totalPOs: number;
      totalOrdered: number;
      totalReceived: number;
    }
  >();

  data.forEach((d) => {
    const current = supplierMap.get(d.supplierName) || {
      totalPOs: 0,
      totalOrdered: 0,
      totalReceived: 0,
    };

    supplierMap.set(d.supplierName, {
      totalPOs: current.totalPOs + 1,
      totalOrdered: current.totalOrdered + d.totalOrderedQty,
      totalReceived: current.totalReceived + d.totalReceivedQty,
    });
  });

  return Array.from(supplierMap.entries()).map(([name, val]) => {
    const rate =
      val.totalOrdered > 0 ? (val.totalReceived / val.totalOrdered) * 100 : 0;
    const shortfall = val.totalOrdered - val.totalReceived;
    return {
      supplierName: name,
      totalPOs: val.totalPOs,
      fulfillmentRate: rate,
      totalOrdered: val.totalOrdered,
      totalReceived: val.totalReceived,
      shortfall: shortfall > 0 ? shortfall : 0,
      status:
        rate >= 120
          ? "Critical"
          : rate >= 100
            ? "Good"
            : rate >= 80
              ? "Warning"
              : rate >= 0
                ? "Poor"
                : "",
    };
  });
}
