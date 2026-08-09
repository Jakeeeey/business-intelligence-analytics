"use client";

import * as React from "react";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ChevronRight } from "lucide-react";
import DateSelector from "./components/DateSelector";
import DailySalesChart from "./components/DailySalesChart";
import RankingsDashboard, { RankItem } from "./components/RankingsDashboard";
import type { SalesOrder, Customer, Salesman, Supplier, MonthlySalesReportPayload } from "./types";

const MONTHS_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function MonthlySalesReportModule() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Raw states
  const [salesOrders, setSalesOrders] = React.useState<SalesOrder[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [salesmen, setSalesmen] = React.useState<Salesman[]>([]);
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);

  // Selection states
  const [selectedMonth, setSelectedMonth] = React.useState(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = React.useState(() => new Date().getFullYear());

  // Drill-down states
  const [selectedSalesmanId, setSelectedSalesmanId] = React.useState<number | null>(null);
  const [selectedSalesmanName, setSelectedSalesmanName] = React.useState("");
  const [selectedSupplierId, setSelectedSupplierId] = React.useState<number | null>(null);
  const [selectedSupplierName, setSelectedSupplierName] = React.useState("");

  // Load datasets on mount
  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/bia/crm/sales-report/monthly-sales-report");
        if (!res.ok) {
          throw new Error(`Failed to load data: ${res.statusText}`);
        }
        const data: MonthlySalesReportPayload = await res.json();
        setSalesOrders(data.salesOrders || []);
        setCustomers(data.customers || []);
        setSalesmen(data.salesmen || []);
        setSuppliers(data.suppliers || []);
      } catch (err: unknown) {
        console.error(err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter orders by Month and Year
  const mtdOrders = React.useMemo(() => {
    return salesOrders.filter((order) => {
      if (!order.order_date) return false;
      const parts = order.order_date.split("-").map(Number);
      if (parts.length < 3) return false;
      const [y, m] = parts;
      return y === selectedYear && m - 1 === selectedMonth;
    });
  }, [salesOrders, selectedMonth, selectedYear]);

  // Compute daily sales for the line chart (1 to last day of selected month)
  const dailySalesData = React.useMemo(() => {
    const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const daysArr = Array.from({ length: totalDays }, (_, i) => ({
      day: i + 1,
      dateStr: `${MONTHS_NAMES[selectedMonth]} ${i + 1}`,
      amount: 0,
    }));

    for (const order of mtdOrders) {
      const parts = order.order_date.split("-").map(Number);
      if (parts.length >= 3) {
        const dayIdx = parts[2] - 1;
        if (dayIdx >= 0 && dayIdx < totalDays) {
          const amount = order.net_amount ?? order.total_amount ?? 0;
          daysArr[dayIdx].amount += amount;
        }
      }
    }

    return daysArr;
  }, [mtdOrders, selectedMonth, selectedYear]);

  // Maps for fast lookups
  const salesmenMap = React.useMemo(() => new Map(salesmen.map((s) => [s.id, s.salesman_name])), [salesmen]);
  const suppliersMap = React.useMemo(() => new Map(suppliers.map((s) => [s.id, s.supplier_name])), [suppliers]);
  const customersMap = React.useMemo(
    () => new Map(customers.map((c) => [c.customer_code.toLowerCase(), c.customer_name || c.store_name || "Unknown Customer"])),
    [customers]
  );

  // TIER 1: Salesman Rankings
  const salesmenRankings = React.useMemo<RankItem[]>(() => {
    const sums = new Map<number, number>();
    for (const order of mtdOrders) {
      if (order.salesman_id !== undefined && order.salesman_id !== null) {
        const amount = order.net_amount ?? order.total_amount ?? 0;
        sums.set(order.salesman_id, (sums.get(order.salesman_id) || 0) + amount);
      }
    }

    return Array.from(sums.entries())
      .map(([id, amount]) => ({
        id,
        name: salesmenMap.get(id) || `Salesman #${id}`,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [mtdOrders, salesmenMap]);

  // TIER 2: Supplier Rankings (Filtered by selected Salesman)
  const suppliersRankings = React.useMemo<RankItem[]>(() => {
    if (selectedSalesmanId === null) return [];

    const sums = new Map<number, number>();
    for (const order of mtdOrders) {
      if (order.salesman_id === selectedSalesmanId && order.supplier_id !== undefined && order.supplier_id !== null) {
        const amount = order.net_amount ?? order.total_amount ?? 0;
        sums.set(order.supplier_id, (sums.get(order.supplier_id) || 0) + amount);
      }
    }

    return Array.from(sums.entries())
      .map(([id, amount]) => ({
        id,
        name: suppliersMap.get(id) || `Supplier #${id}`,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [mtdOrders, selectedSalesmanId, suppliersMap]);

  // TIER 3: Customer Rankings (Filtered by selected Salesman + Supplier combo)
  const customersRankings = React.useMemo<RankItem[]>(() => {
    if (selectedSalesmanId === null || selectedSupplierId === null) return [];

    const sums = new Map<string, number>();
    for (const order of mtdOrders) {
      if (order.salesman_id === selectedSalesmanId && order.supplier_id === selectedSupplierId && order.customer_code) {
        const amount = order.net_amount ?? order.total_amount ?? 0;
        const code = order.customer_code.trim().toLowerCase();
        sums.set(code, (sums.get(code) || 0) + amount);
      }
    }

    return Array.from(sums.entries())
      .map(([code, amount]) => ({
        id: code,
        name: customersMap.get(code) || `Customer [${code.toUpperCase()}]`,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [mtdOrders, selectedSalesmanId, selectedSupplierId, customersMap]);

  // Reset drilldown when date range shifts
  React.useEffect(() => {
    setSelectedSalesmanId(null);
    setSelectedSalesmanName("");
    setSelectedSupplierId(null);
    setSelectedSupplierName("");
  }, [selectedMonth, selectedYear]);

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
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
      />

      {/* Daily sales trend line/area chart */}
      {loading ? (
        <div className="h-72 rounded-lg bg-muted/30 animate-pulse border flex items-center justify-center">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      ) : (
        <DailySalesChart
          data={dailySalesData}
          monthName={MONTHS_NAMES[selectedMonth]}
          year={selectedYear}
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
