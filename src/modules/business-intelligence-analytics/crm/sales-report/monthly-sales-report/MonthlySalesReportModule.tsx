"use client";

import * as React from "react";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ChevronRight } from "lucide-react";
import DateSelector from "./components/DateSelector";
import DailySalesChart from "./components/DailySalesChart";
import RankingsDashboard, { RankItem } from "./components/RankingsDashboard";
import type { SalesPerformanceItem, MonthlySalesReportPayload } from "./types";

const formatYMD = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function MonthlySalesReportModule() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Raw states
  const [salesPerformance, setSalesPerformance] = React.useState<SalesPerformanceItem[]>([]);

  // Selection states (Default: Month-to-Date)
  const [dateFrom, setDateFrom] = React.useState(() => {
    const now = new Date();
    return formatYMD(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [dateTo, setDateTo] = React.useState(() => {
    return formatYMD(new Date());
  });

  // Drill-down states
  const [selectedSalesmanId, setSelectedSalesmanId] = React.useState<number | null>(null);
  const [selectedSalesmanName, setSelectedSalesmanName] = React.useState("");
  const [selectedSupplierId, setSelectedSupplierId] = React.useState<number | null>(null);
  const [selectedSupplierName, setSelectedSupplierName] = React.useState("");

  // Load datasets on date range changes
  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/bia/crm/sales-report/monthly-sales-report?startDate=${dateFrom}&endDate=${dateTo}`);
        if (!res.ok) {
          throw new Error(`Failed to load data: ${res.statusText}`);
        }
        const data: MonthlySalesReportPayload = await res.json();
        setSalesPerformance(data.salesPerformance || []);
      } catch (err: unknown) {
        console.error(err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [dateFrom, dateTo]);

  // Filter items that fall within the custom date range
  const mtdOrders = React.useMemo(() => {
    return salesPerformance.filter((item) => {
      if (!item.transactionDate) return false;
      const cleanDate = item.transactionDate.substring(0, 10);
      return cleanDate >= dateFrom && cleanDate <= dateTo;
    });
  }, [salesPerformance, dateFrom, dateTo]);

  // Compute daily sales for the trend line chart dynamically over the date range
  const dailySalesData = React.useMemo(() => {
    const list: { dateKey: string; label: string; dateStr: string; amount: number }[] = [];

    const startParts = dateFrom.split("-").map(Number);
    const endParts = dateTo.split("-").map(Number);
    if (startParts.length < 3 || endParts.length < 3) return [];

    const start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
    const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);

    const current = new Date(start);
    while (current <= end) {
      const dateKey = formatYMD(current);
      const label = current.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dateStr = current.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

      list.push({
        dateKey,
        label,
        dateStr,
        amount: 0,
      });

      current.setDate(current.getDate() + 1);
    }

    // Map amounts to their respective date keys
    const amountMap = new Map<string, number>();
    for (const item of mtdOrders) {
      if (item.transactionDate) {
        const cleanDate = item.transactionDate.substring(0, 10);
        const amount = Number(item.netAmount ?? 0);
        amountMap.set(cleanDate, (amountMap.get(cleanDate) || 0) + amount);
      }
    }

    for (const point of list) {
      point.amount = amountMap.get(point.dateKey) || 0;
    }

    return list;
  }, [mtdOrders, dateFrom, dateTo]);

  // TIER 1: Salesman Rankings
  const salesmenRankings = React.useMemo<RankItem[]>(() => {
    const sums = new Map<number, { name: string; amount: number }>();
    for (const item of mtdOrders) {
      if (item.salesmanId !== undefined && item.salesmanId !== null) {
        const sId = Number(item.salesmanId);
        const amount = Number(item.netAmount ?? 0);
        const current = sums.get(sId) || {
          name: item.salesmanName || `Salesman #${sId}`,
          amount: 0
        };
        current.amount += amount;
        sums.set(sId, current);
      }
    }

    return Array.from(sums.entries())
      .map(([id, info]) => ({
        id,
        name: info.name,
        amount: info.amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [mtdOrders]);

  // TIER 2: Supplier Rankings (Filtered by selected Salesman)
  const suppliersRankings = React.useMemo<RankItem[]>(() => {
    if (selectedSalesmanId === null) return [];

    const sums = new Map<number, { name: string; amount: number }>();
    for (const item of mtdOrders) {
      if (
        item.salesmanId !== undefined &&
        item.salesmanId !== null &&
        Number(item.salesmanId) === selectedSalesmanId &&
        item.supplierId !== undefined &&
        item.supplierId !== null
      ) {
        const supId = Number(item.supplierId);
        const amount = Number(item.netAmount ?? 0);
        const current = sums.get(supId) || {
          name: item.supplierName || `Supplier #${supId}`,
          amount: 0
        };
        current.amount += amount;
        sums.set(supId, current);
      }
    }

    return Array.from(sums.entries())
      .map(([id, info]) => ({
        id,
        name: info.name,
        amount: info.amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [mtdOrders, selectedSalesmanId]);

  // TIER 3: Customer Rankings (Filtered by selected Salesman + Supplier combo)
  const customersRankings = React.useMemo<RankItem[]>(() => {
    if (selectedSalesmanId === null || selectedSupplierId === null) return [];

    const sums = new Map<string, { name: string; amount: number }>();
    for (const item of mtdOrders) {
      if (
        item.salesmanId !== undefined &&
        item.salesmanId !== null &&
        Number(item.salesmanId) === selectedSalesmanId &&
        item.supplierId !== undefined &&
        item.supplierId !== null &&
        Number(item.supplierId) === selectedSupplierId &&
        item.customerCode
      ) {
        const amount = Number(item.netAmount ?? 0);
        const code = item.customerCode.trim().toLowerCase();
        const current = sums.get(code) || {
          name: item.storeName || item.customerCode || `Customer [${item.customerCode.toUpperCase()}]`,
          amount: 0
        };
        current.amount += amount;
        sums.set(code, current);
      }
    }

    return Array.from(sums.entries())
      .map(([code, info]) => ({
        id: code,
        name: info.name,
        amount: info.amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [mtdOrders, selectedSalesmanId, selectedSupplierId]);

  // Reset drilldown when date range shifts
  React.useEffect(() => {
    setSelectedSalesmanId(null);
    setSelectedSalesmanName("");
    setSelectedSupplierId(null);
    setSelectedSupplierName("");
  }, [dateFrom, dateTo]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Data</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <DateSelector
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />

      {/* Daily sales trend line/area chart */}
      {loading ? (
        <div className="h-72 rounded-lg bg-muted/30 animate-pulse border flex items-center justify-center">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      ) : (
        <DailySalesChart
          data={dailySalesData}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      )}

      {/* Drill-down Rankings */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-80 rounded-lg bg-muted/30 animate-pulse border" />
          <div className="h-80 rounded-lg bg-muted/30 animate-pulse border" />
        </div>
      ) : (
        <div className="space-y-2">
          {/* Drilldown breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg border">
            <span
              onClick={() => {
                setSelectedSalesmanId(null);
                setSelectedSalesmanName("");
                setSelectedSupplierId(null);
                setSelectedSupplierName("");
              }}
              className={`font-semibold cursor-pointer hover:text-primary transition-colors ${
                selectedSalesmanId === null ? "text-primary" : ""
              }`}
            >
              Salesmen
            </span>

            {selectedSalesmanId !== null && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span
                  onClick={() => {
                    setSelectedSupplierId(null);
                    setSelectedSupplierName("");
                  }}
                  className={`font-semibold cursor-pointer hover:text-primary transition-colors ${
                    selectedSupplierId === null ? "text-primary" : ""
                  }`}
                >
                  {selectedSalesmanName}
                </span>
              </>
            )}

            {selectedSupplierId !== null && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span className="font-semibold text-primary">
                  {selectedSupplierName}
                </span>
              </>
            )}
          </div>

          <RankingsDashboard
            salesmenData={salesmenRankings}
            suppliersData={suppliersRankings}
            customersData={customersRankings}
            selectedSalesmanId={selectedSalesmanId}
            selectedSalesmanName={selectedSalesmanName}
            selectedSupplierId={selectedSupplierId}
            selectedSupplierName={selectedSupplierName}
            onSelectSalesman={(id, name) => {
              setSelectedSalesmanId(id);
              setSelectedSalesmanName(name);
            }}
            onSelectSupplier={(id, name) => {
              setSelectedSupplierId(id);
              setSelectedSupplierName(name);
            }}
          />
        </div>
      )}
    </div>
  );
}
