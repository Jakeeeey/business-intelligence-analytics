"use client";

import * as React from "react";
import { FiltersBar } from "./components/FiltersBar";
import { MetricGridOne } from "./components/MetricGridOne";
import { MetricGridTwo } from "./components/MetricGridTwo";
import { SupplierSalesModal } from "./components/SupplierSalesModal";
import { FrequencyDetailModal } from "./components/FrequencyDetailModal";
import { NewAccountsDetailModal } from "./components/NewAccountsDetailModal";
import { MetricRow, SalesmanMetricFilters, SalesmanOption } from "./types";

// Helper to compute first and last day of month based on YYYY-MM-DD fiscal period
function getFiscalPeriodRange(fiscalPeriod: string): { start: string; end: string } {
  const parts = fiscalPeriod.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const start = `${parts[0]}-${parts[1]}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${parts[0]}-${parts[1]}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export default function SalesmanMetricModule() {
  const [salesmen, setSalesmen] = React.useState<SalesmanOption[]>([]);
  const [filters, setFilters] = React.useState<SalesmanMetricFilters>(() => {
    const today = new Date();
    const currentFiscalPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
    const range = getFiscalPeriodRange(currentFiscalPeriod);
    return {
      salesmanId: "",
      salesmanCode: "",
      fiscalPeriod: currentFiscalPeriod,
      startDate: range.start,
      endDate: range.end,
    };
  });

  const [loading, setLoading] = React.useState<boolean>(false);
  const [rows, setRows] = React.useState<MetricRow[]>([]);

  // Modal State for Supplier Sales Breakdown
  const [modalOpen, setModalOpen] = React.useState<boolean>(false);
  const [selectedSalesmanId, setSelectedSalesmanId] = React.useState<number | "">("");
  const [selectedSalesmanName, setSelectedSalesmanName] = React.useState<string>("");

  // Modal State for Frequency Detailed Breakdown
  const [freqModalOpen, setFreqModalOpen] = React.useState<boolean>(false);
  const [freqSalesmanId, setFreqSalesmanId] = React.useState<number | "">("");
  const [freqSalesmanCode, setFreqSalesmanCode] = React.useState<string>("");
  const [freqSalesmanName, setFreqSalesmanName] = React.useState<string>("");

  // Modal State for New Accounts Detailed Breakdown
  const [newAccModalOpen, setNewAccModalOpen] = React.useState<boolean>(false);
  const [newAccSalesmanId, setNewAccSalesmanId] = React.useState<number | "">("");
  const [newAccSalesmanCode, setNewAccSalesmanCode] = React.useState<string>("");
  const [newAccSalesmanName, setNewAccSalesmanName] = React.useState<string>("");

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

  const handleFiscalPeriodChange = (fp: string) => {
    const range = getFiscalPeriodRange(fp);
    setFilters((prev) => ({
      ...prev,
      fiscalPeriod: fp,
      startDate: range.start,
      endDate: range.end,
    }));
  };

  const handleViewSupplierBreakdown = (salesmanId: number, salesmanName: string) => {
    setSelectedSalesmanId(salesmanId);
    setSelectedSalesmanName(salesmanName);
    setModalOpen(true);
  };

  const handleViewFrequencyDetail = (salesmanId: number, salesmanCode: string, salesmanName: string) => {
    setFreqSalesmanId(salesmanId);
    setFreqSalesmanCode(salesmanCode);
    setFreqSalesmanName(salesmanName);
    setFreqModalOpen(true);
  };

  const handleViewNewAccountsDetail = (salesmanId: number, salesmanCode: string, salesmanName: string) => {
    setNewAccSalesmanId(salesmanId);
    setNewAccSalesmanCode(salesmanCode);
    setNewAccSalesmanName(salesmanName);
    setNewAccModalOpen(true);
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
        fiscalPeriod={filters.fiscalPeriod}
        onChangeSalesman={handleSalesmanChange}
        onChangeFiscalPeriod={handleFiscalPeriodChange}
        loading={loading}
      />

      {/* Metric Grids */}
      <div className="grid grid-cols-1 gap-6">
        <MetricGridOne
          rows={rows}
          loading={loading}
          onViewSupplierBreakdown={handleViewSupplierBreakdown}
          onViewFrequencyDetail={handleViewFrequencyDetail}
          onViewNewAccountsDetail={handleViewNewAccountsDetail}
        />
        <MetricGridTwo rows={rows} loading={loading} />
      </div>

      {/* Supplier Breakdown Modal */}
      <SupplierSalesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        salesmanId={selectedSalesmanId}
        salesmanName={selectedSalesmanName}
        startDate={filters.startDate}
        endDate={filters.endDate}
      />

      {/* Frequency Details Modal */}
      <FrequencyDetailModal
        isOpen={freqModalOpen}
        onClose={() => setFreqModalOpen(false)}
        salesmanId={freqSalesmanId}
        salesmanCode={freqSalesmanCode}
        salesmanName={freqSalesmanName}
        startDate={filters.startDate}
        endDate={filters.endDate}
      />

      {/* New Accounts Details Modal */}
      <NewAccountsDetailModal
        isOpen={newAccModalOpen}
        onClose={() => setNewAccModalOpen(false)}
        salesmanId={newAccSalesmanId}
        salesmanCode={newAccSalesmanCode}
        salesmanName={newAccSalesmanName}
        startDate={filters.startDate}
        endDate={filters.endDate}
      />
    </div>
  );
}
