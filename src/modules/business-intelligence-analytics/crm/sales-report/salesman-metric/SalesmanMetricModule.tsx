"use client";

import * as React from "react";
import { FiltersBar } from "./components/FiltersBar";
import { MetricGridOne } from "./components/MetricGridOne";
import { MetricGridTwo } from "./components/MetricGridTwo";
import { DatePreset, MetricRow, SalesmanMetricFilters, SalesmanOption } from "./types";

// Helper to format Date to YYYY-MM-DD
function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Compute start and end date based on preset choice
function getDateRangeFromPreset(preset: DatePreset): { start: string; end: string } {
  const now = new Date(); // Local system date
  let start = now;
  let end = now;

  switch (preset) {
    case "today":
      start = now;
      end = now;
      break;

    case "this-week": {
      // Find start of the current week (Monday)
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      start = monday;
      end = sunday;
      break;
    }

    case "this-month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;

    case "this-year":
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      break;

    case "custom":
    default:
      // Default custom range can be this-month or similar
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
  }

  return {
    start: formatDateString(start),
    end: formatDateString(end),
  };
}

export default function SalesmanMetricModule() {
  const [salesmen, setSalesmen] = React.useState<SalesmanOption[]>([]);
  const [filters, setFilters] = React.useState<SalesmanMetricFilters>(() => {
    const range = getDateRangeFromPreset("this-month");
    return {
      salesmanId: "",
      salesmanCode: "",
      datePreset: "this-month",
      startDate: range.start,
      endDate: range.end,
    };
  });

  const [loading, setLoading] = React.useState<boolean>(false);
  const [rows, setRows] = React.useState<MetricRow[]>([]);

  // Fetch salesmen options on mount
  React.useEffect(() => {
    async function loadLookups() {
      try {
        const response = await fetch("/api/bia/crm/sales-report/salesman-metric?mode=lookups");
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          setSalesmen(json.data);
        }
      } catch (err) {
        console.error("Failed to load lookups:", err);
      }
    }
    loadLookups();
  }, []);

  // Fetch metrics data when filters change
  React.useEffect(() => {
    let active = true;

    async function fetchMetrics() {
      setLoading(true);
      try {
        const salesmanCode =
          filters.salesmanId !== ""
            ? salesmen.find((s) => s.salesmanId === filters.salesmanId)?.salesmanCode || ""
            : "";

        const queryParams = new URLSearchParams({
          mode: "report",
          salesmanId: filters.salesmanId === "" ? "all" : String(filters.salesmanId),
          salesmanCode,
          startDate: filters.startDate,
          endDate: filters.endDate,
        });

        const res = await fetch(`/api/bia/crm/sales-report/salesman-metric?${queryParams.toString()}`);
        const json = await res.json();
        if (active && json.success && Array.isArray(json.data)) {
          setRows(json.data);
        }
      } catch (err) {
        console.error("Error fetching salesman metrics:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    // Only load if lookups have loaded or we are fetching all
    fetchMetrics();

    return () => {
      active = false;
    };
  }, [filters.salesmanId, filters.startDate, filters.endDate, salesmen]);

  const handleSalesmanChange = (id: number | "") => {
    const code = id !== "" ? salesmen.find((s) => s.salesmanId === id)?.salesmanCode || "" : "";
    setFilters((prev) => ({
      ...prev,
      salesmanId: id,
      salesmanCode: code,
    }));
  };

  const handleDatePresetChange = (preset: DatePreset) => {
    const range = getDateRangeFromPreset(preset);
    setFilters((prev) => ({
      ...prev,
      datePreset: preset,
      startDate: range.start,
      endDate: range.end,
    }));
  };

  const handleCustomDatesChange = (start: string, end: string) => {
    setFilters((prev) => ({
      ...prev,
      startDate: start,
      endDate: end,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Salesman Metric Performance</h1>
        <p className="text-sm text-muted-foreground">
          View key metrics performance, reach, frequency, and targets for salesmen.
        </p>
      </div>

      {/* Filters Section */}
      <FiltersBar
        salesmen={salesmen}
        selectedSalesmanId={filters.salesmanId}
        selectedDatePreset={filters.datePreset}
        startDate={filters.startDate}
        endDate={filters.endDate}
        onChangeSalesman={handleSalesmanChange}
        onChangeDatePreset={handleDatePresetChange}
        onChangeCustomDates={handleCustomDatesChange}
        loading={loading}
      />

      {/* Metric Grids */}
      <div className="grid grid-cols-1 gap-6">
        <MetricGridOne rows={rows} loading={loading} />
        <MetricGridTwo rows={rows} loading={loading} />
      </div>
    </div>
  );
}
