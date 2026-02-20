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

  const poFulfillmentRates = data.map((d) =>
    d.totalOrderedQty > 0 ? (d.totalReceivedQty / d.totalOrderedQty) * 100 : 0,
  );

  const totalFulfillment = poFulfillmentRates.reduce(
    (acc, curr) => acc + curr,
    0,
  );
  const avgFulfillmentRate = totalFulfillment / data.length;

  const supplierStats = new Map<string, { totalPct: number; count: number }>();
  data.forEach((d) => {
    const current = supplierStats.get(d.supplierName) || {
      totalPct: 0,
      count: 0,
    };
    const poRate =
      d.totalOrderedQty > 0
        ? (d.totalReceivedQty / d.totalOrderedQty) * 100
        : 0;
    supplierStats.set(d.supplierName, {
      totalPct: current.totalPct + poRate,
      count: current.count + 1,
    });
  });

  let below95Count = 0;
  supplierStats.forEach((val) => {
    if (val.totalPct / val.count < 95) below95Count++;
  });

  return {
    avgFulfillmentRate,
    suppliersBelow95Count: below95Count,
    totalSuppliers: supplierStats.size,
    totalPOs: data.length,
    totalFulfillmentPct: avgFulfillmentRate,
  };
}

/**
 * Prepares data for the fulfillment rate bar chart.
 */
export function prepareSupplierChartData(data: FulfillmentRatePo[]) {
  const supplierMap = new Map<string, { totalPct: number; count: number }>();
  data.forEach((d) => {
    const current = supplierMap.get(d.supplierName) || {
      totalPct: 0,
      count: 0,
    };
    const poRate =
      d.totalOrderedQty > 0
        ? (d.totalReceivedQty / d.totalOrderedQty) * 100
        : 0;
    supplierMap.set(d.supplierName, {
      totalPct: current.totalPct + poRate,
      count: current.count + 1,
    });
  });

  return Array.from(supplierMap.entries())
    .map(([name, val]) => ({
      name,
      fulfillmentRate: val.totalPct / val.count,
    }))
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
      totalFulfillmentPct: number;
    }
  >();

  data.forEach((d) => {
    const current = supplierMap.get(d.supplierName) || {
      totalPOs: 0,
      totalOrdered: 0,
      totalReceived: 0,
      totalFulfillmentPct: 0,
    };

    const poRate =
      d.totalOrderedQty > 0
        ? (d.totalReceivedQty / d.totalOrderedQty) * 100
        : 0;

    supplierMap.set(d.supplierName, {
      totalPOs: current.totalPOs + 1,
      totalOrdered: current.totalOrdered + d.totalOrderedQty,
      totalReceived: current.totalReceived + d.totalReceivedQty,
      totalFulfillmentPct: current.totalFulfillmentPct + poRate,
    });
  });

  return Array.from(supplierMap.entries()).map(([name, val]) => {
    const rate = val.totalFulfillmentPct / val.totalPOs;
    const shortfall = val.totalOrdered - val.totalReceived;
    return {
      supplierName: name,
      totalPOs: val.totalPOs,
      fulfillmentRate: rate,
      totalOrdered: val.totalOrdered,
      totalReceived: val.totalReceived,
      shortfall: shortfall > 0 ? shortfall : 0,
      status: rate >= 95 ? "Good" : "Below Target",
    };
  });
}
