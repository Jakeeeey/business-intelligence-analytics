"use client";

import * as React from "react";
import { toast } from "sonner";

import type {
  TacticalSkuChartPoint,
  TacticalSkuFilters,
  TacticalSkuKpis,
  TacticalSkuProductRow,
} from "../types";
import { fetchTacticalSkuReport } from "../providers/fetchProviders";
import {
  buildTacticalSkuChartData,
  buildTacticalSkuKpis,
  buildTacticalSkuRows,
  getDefaultMonth,
  getMonthDateRange,
} from "../utils/report";

function matchesSearch(row: TacticalSkuProductRow, term: string): boolean {
  if (!term) return true;

  const q = term.toLowerCase();
  const productMatch =
    row.productName.toLowerCase().includes(q) ||
    row.productCode.toLowerCase().includes(q) ||
    row.brand.toLowerCase().includes(q) ||
    row.category.toLowerCase().includes(q);

  if (productMatch) return true;

  return row.salesmen.some(
    (s) => s.salesmanName.toLowerCase().includes(q) || s.code.toLowerCase().includes(q),
  );
}

export function useTacticalSkuReport() {
  const [filters, setFilters] = React.useState<TacticalSkuFilters>({
    month: getDefaultMonth(),
    search: "",
  });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [warnings, setWarnings] = React.useState<string[]>([]);
  const [expandedKey, setExpandedKey] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<TacticalSkuProductRow[]>([]);
  const [kpis, setKpis] = React.useState<TacticalSkuKpis>({
    totalProducts: 0,
    totalInventory: 0,
    totalReach: 0,
    totalTarget: 0,
    overallPercent: 0,
  });
  const [chartData, setChartData] = React.useState<TacticalSkuChartPoint[]>([]);

  const filteredRows = React.useMemo(
    () => rows.filter((row) => matchesSearch(row, filters.search.trim())),
    [rows, filters.search],
  );

  async function generateReport() {
    setLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = getMonthDateRange(filters.month);
      const data = await fetchTacticalSkuReport({
        month: filters.month,
        startDate,
        endDate,
      });

      const shapedRows = buildTacticalSkuRows(data.rows, data.inventory);
      const shapedKpis = buildTacticalSkuKpis(shapedRows);
      const shapedCharts = buildTacticalSkuChartData(shapedRows);

      setRows(shapedRows);
      setKpis(shapedKpis);
      setChartData(shapedCharts);
      setWarnings(data.warnings ?? []);

      if (data.warnings?.length) {
        toast.warning("Report loaded with warnings. Check the warning panel.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load Tactical SKU report.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function toggleExpanded(key: string) {
    setExpandedKey((prev) => (prev === key ? null : key));
  }

  React.useEffect(() => {
    generateReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    filters,
    setFilters,
    loading,
    error,
    warnings,
    rows: filteredRows,
    rawRows: rows,
    kpis,
    chartData,
    expandedKey,
    setExpandedKey,
    toggleExpanded,
    generateReport,
  };
}