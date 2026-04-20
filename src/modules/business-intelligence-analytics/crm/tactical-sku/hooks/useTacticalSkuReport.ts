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
    sku: "",
    salesman: "",
    search: "",
  });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [warnings, setWarnings] = React.useState<string[]>([]);
  const [expandedKey, setExpandedKey] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<TacticalSkuProductRow[]>([]);
  const skuOptions = React.useMemo(() => {
    const byLabel = new Map<string, { value: string; label: string }>();
    for (const row of rows) {
      const label = row.productName.trim();
      if (!label) continue;
      if (!byLabel.has(label)) byLabel.set(label, { value: label, label });
    }
    return Array.from(byLabel.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [rows]);

  const salesmanOptions = React.useMemo(() => {
    const byLabel = new Map<string, { value: string; label: string }>();
    for (const row of rows) {
      for (const s of row.salesmen) {
        const label = s.salesmanName.trim();
        if (!label) continue;
        if (!byLabel.has(label)) byLabel.set(label, { value: label, label });
      }
    }
    return Array.from(byLabel.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [rows]);

  const filteredRows = React.useMemo(
    () => {
      const sku = filters.sku.trim().toLowerCase();
      const salesman = filters.salesman.trim().toLowerCase();
      const search = filters.search.trim();

      const byFilter = rows.filter((row) => {
        if (sku && row.productName.toLowerCase() !== sku) return false;
        if (salesman && !row.salesmen.some((s) => s.salesmanName.toLowerCase() === salesman)) {
          return false;
        }
        return true;
      });

      const bySearch = byFilter.filter((row) => matchesSearch(row, search));
      return bySearch.map((row, idx) => ({ ...row, rank: idx + 1 }));
    },
    [rows, filters.search, filters.sku, filters.salesman],
  );

  const kpis = React.useMemo<TacticalSkuKpis>(() => buildTacticalSkuKpis(filteredRows), [filteredRows]);
  const chartData = React.useMemo<TacticalSkuChartPoint[]>(
    () => buildTacticalSkuChartData(filteredRows, 10),
    [filteredRows],
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
        productName: filters.sku || undefined,
        salesmanName: filters.salesman || undefined,
      });

      const shapedRows = buildTacticalSkuRows(data.rows, data.inventory);

      setRows(shapedRows);
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
    skuOptions,
    salesmanOptions,
    kpis,
    chartData,
    expandedKey,
    setExpandedKey,
    toggleExpanded,
    generateReport,
  };
}