"use client";

import React, { useMemo } from "react";
import { ErrorPage } from "@/app/(business-intelligence-analytics)/bia/_components/ErrorPage";
import { useAnnualReportV2Filters } from "./providers/AnnualReportV2FilterProvider";
import { useAnnualReportV2 } from "./hooks/useAnnualReportV2";
import { AnnualReportV2Filters } from "./components/AnnualReportV2Filters";
import { AnnualReportV2KPICards } from "./components/AnnualReportV2KPICards";
import { AnnualReportV2Chart } from "./components/AnnualReportV2Chart";
import { AnnualReportV2Table } from "./components/AnnualReportV2Table";
import { AnnualReportV2Skeleton } from "./components/AnnualReportV2Skeleton";
import { aggregateMonthlyData, calculateSummary } from "./utils/annual-report.utils";
import type { SalesTransaction, PurchaseTransaction } from "./types/annual-report.schema";


const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function AnnualReportV2Page() {
  const { filters } = useAnnualReportV2Filters();

  // Only pass date parameters to the API hook
  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.year) params.year = filters.year;
    return params;
  }, [filters.dateFrom, filters.dateTo, filters.year]);

  const { data, isLoading, error, refresh } = useAnnualReportV2(queryParams);

  // Raw data from the server
  const rawSales = useMemo(() => (data?.salesTransactions as SalesTransaction[]) ?? [], [data]);
  const rawPurchases = useMemo(() => (data?.purchaseTransactions as PurchaseTransaction[]) ?? [], [data]);

  const suppliers = useMemo(() => data?.suppliers ?? [], [data]);
  const categories = useMemo(() => data?.categories ?? [], [data]);
  const uoms = useMemo(() => data?.uoms ?? [], [data]);

  // Apply client-side filters
  const filteredData = useMemo(() => {
    // Fast-fail if any multi-select is fully deselected (set to "NONE")
    if (
      filters.month === "NONE" ||
      filters.supplierName === "NONE" ||
      filters.categoryName === "NONE"
    ) {
      return {
        monthlyData: [],
        summary: { totalSales: 0, totalPurchases: 0, netVariance: 0, biasPercentage: 0 },
        salesTransactions: [],
        purchaseTransactions: [],
      };
    }

    const allowedMonths = filters.month
      ? filters.month.split(",").map(Number).filter((n) => !isNaN(n))
      : [];
    const customerName = filters.customerName?.toLowerCase();
    const categoryName = filters.categoryName?.toLowerCase();
    const unitName = filters.unitName?.toLowerCase();
    const supplierName = filters.supplierName?.toLowerCase();
    const amountType = filters.amountType || "netAmount";
    const useQuantity = !!unitName;

    // Filter sales
    let filteredSales = rawSales;
    if (allowedMonths.length > 0 && allowedMonths.length < 12) {
      filteredSales = filteredSales.filter((item) => {
        if (!item.invoiceDate) return true;
        const m = new Date(item.invoiceDate).getMonth() + 1;
        return allowedMonths.includes(m);
      });
    }
    if (customerName) {
      filteredSales = filteredSales.filter((item) =>
        item.customerName?.toLowerCase().includes(customerName)
      );
    }
    if (categoryName) {
      const selectedCategories = categoryName.split("|").map((c) => c.trim()).filter(Boolean);
      filteredSales = filteredSales.filter((item) =>
        selectedCategories.some((cat) => item.productCategory?.toLowerCase().includes(cat))
      );
    }
    // Removed strict unitName filter to allow conversions
    if (supplierName) {
      const selectedSuppliers = supplierName.split("|").map((s) => s.trim()).filter(Boolean);
      if (selectedSuppliers.length > 0) {
        filteredSales = filteredSales.filter((item) =>
          item.productSupplier &&
          selectedSuppliers.some((supplier) =>
            item.productSupplier!.toLowerCase().includes(supplier)
          )
        );
      }
    }

    // In-memory date boundary filtering for sales
    if (filters.dateFrom || filters.dateTo) {
      const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
      const to = filters.dateTo ? new Date(filters.dateTo + "T23:59:59.999") : null;
      filteredSales = filteredSales.filter((item) => {
        if (!item.invoiceDate) return true;
        const d = new Date(item.invoiceDate);
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }

    // Group sales by product + month
    const salesGroupedMap = new Map<string, Partial<SalesTransaction>>();
    for (const item of filteredSales) {
      let amountToAdd = 0;
      if (useQuantity) {
        if (unitName === "pieces") {
          amountToAdd = item.conversionToPieces || item.quantity || 0;
        } else if (unitName === "box") {
          amountToAdd = item.conversionToCases || item.quantity || 0;
        } else {
          amountToAdd = item.quantity || 0;
        }
      }
      else if (amountType === "grossAmount") amountToAdd = item.grossAmount || 0;
      else if (amountType === "netOfReturns") amountToAdd = item.netOfReturns || 0;
      else amountToAdd = item.netAmount || 0;

      const dateStr = item.invoiceDate || "";
      let monthKey = "unknown_month";
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          monthKey = `${d.getFullYear()}-${d.getMonth() + 1}`;
        }
      }

      const pName = item.productName || "Unknown Product";
      const compositeKey = `${pName}_${monthKey}`;

      const existing = salesGroupedMap.get(compositeKey);
      if (existing) {
        existing.totalInvoiceAmount = (existing.totalInvoiceAmount ?? 0) + amountToAdd;
        existing.cases = (existing.cases ?? 0) + (item.cases ?? 0);
      } else {
        salesGroupedMap.set(compositeKey, {
          productName: item.productName,
          invoiceDate: item.invoiceDate,
          totalInvoiceAmount: amountToAdd,
          productCategory: item.productCategory,
          productSupplier: item.productSupplier,
          cases: item.cases || 0,
        });
      }
    }
    const salesTransactions = Array.from(salesGroupedMap.values()) as SalesTransaction[];

    // Filter purchases
    let filteredPurchases = rawPurchases;
    if (allowedMonths.length > 0 && allowedMonths.length < 12) {
      filteredPurchases = filteredPurchases.filter((item) => {
        if (!item.receiptDate) return true;
        const m = new Date(item.receiptDate).getMonth() + 1;
        return allowedMonths.includes(m);
      });
    }
    
    // In-memory date boundary filtering
    if (filters.dateFrom || filters.dateTo) {
      const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
      const to = filters.dateTo ? new Date(filters.dateTo + "T23:59:59.999") : null;
      filteredPurchases = filteredPurchases.filter((item) => {
        if (!item.receiptDate) return true;
        const d = new Date(item.receiptDate);
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }

    if (supplierName) {
      const selectedSuppliers = supplierName.split("|").map((s) => s.trim()).filter(Boolean);
      if (selectedSuppliers.length > 0) {
        filteredPurchases = filteredPurchases.filter((item) =>
          selectedSuppliers.some((supplier) =>
            item.supplierName?.toLowerCase().includes(supplier)
          )
        );
      }
    }
    if (categoryName) {
      const selectedCategories = categoryName.split("|").map((c) => c.trim()).filter(Boolean);
      filteredPurchases = filteredPurchases.filter((item) =>
        selectedCategories.some((cat) => item.productCategory?.toLowerCase().includes(cat))
      );
    }
    // Removed strict unitName filter to allow conversions

    // Group purchases by receiptNo
    const purchaseGroupedMap = new Map<string, Partial<PurchaseTransaction>>();
    for (const item of filteredPurchases) {
      let amountToAdd = 0;
      if (useQuantity) {
        if (unitName === "pieces") {
          amountToAdd = item.conversionToPieces || item.quantity || 0;
        } else if (unitName === "box") {
          amountToAdd = item.conversionToCases || item.quantity || 0;
        } else {
          amountToAdd = item.quantity || 0;
        }
      }
      else if (amountType === "grossAmount") amountToAdd = item.grossAmount || 0;
      else if (amountType === "netOfReturns") amountToAdd = item.netOfReturns || 0;
      else amountToAdd = item.netAmount || 0;

      const existing = purchaseGroupedMap.get(item.receiptNo);
      if (existing) {
        existing.totalReceiptAmount = (existing.totalReceiptAmount ?? 0) + amountToAdd;
        existing.cases = (existing.cases ?? 0) + (item.cases ?? 0);
      } else {
        purchaseGroupedMap.set(item.receiptNo, {
          receiptNo: item.receiptNo,
          receiptDate: item.receiptDate,
          supplierName: item.supplierName,
          totalReceiptAmount: amountToAdd,
          cases: item.cases || 0,
        });
      }
    }
    const purchaseTransactions = Array.from(purchaseGroupedMap.values()) as PurchaseTransaction[];

    const monthlyData = aggregateMonthlyData(salesTransactions, purchaseTransactions);
    const summary = calculateSummary(monthlyData);

    return {
      monthlyData,
      summary,
      salesTransactions,
      purchaseTransactions,
    };
  }, [
    rawSales,
    rawPurchases,
    filters.month,
    filters.customerName,
    filters.categoryName,
    filters.unitName,
    filters.supplierName,
    filters.amountType,
    filters.dateFrom,
    filters.dateTo,
  ]);

  const { monthlyData, summary, salesTransactions, purchaseTransactions } = filteredData;

  const periodCount = monthlyData.length;
  const yearCount = useMemo(
    () => new Set(monthlyData.map((d) => d.year)).size,
    [monthlyData],
  );

  const monthLabel = filters.month && filters.month !== "NONE"
    ? MONTH_LABELS[Number(filters.month.split(',')[0]) - 1] // Fix month label for multi-select
    : null;

  if (isLoading) return <AnnualReportV2Skeleton />;
  if (error) return <ErrorPage message={error} onRefresh={refresh} />;

  return (
    <div className="space-y-6 p-4 md:p-8 pt-6 h-full">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">
              {monthLabel && !filters.month.includes(',') ? `${monthLabel} ${filters.year}` : `Annual Report V2 ${filters.year}`}
            </h2>
            <span className="hidden sm:inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
              {periodCount > 0
                ? `${periodCount} ${periodCount === 1 ? "month" : "months"} · ${yearCount} ${yearCount === 1 ? "year" : "years"}`
                : "No data"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {monthLabel && !filters.month.includes(',')
              ? `Sell-In vs Sell-Out performance for ${monthLabel} ${filters.year}`
              : "Sell-In vs Sell-Out performance by month"}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <AnnualReportV2Filters
            suppliers={suppliers}
            categories={categories}
            uoms={uoms}
          />
        </div>
      </div>

      <AnnualReportV2KPICards
        summary={summary}
        isLoading={isLoading}
        unitName={filters.unitName}
      />
      
      <AnnualReportV2Chart 
        data={monthlyData} 
        isLoading={isLoading} 
        unitName={filters.unitName}
      />

      <AnnualReportV2Table
        data={monthlyData}
        salesData={salesTransactions}
        purchaseData={purchaseTransactions}
        isLoading={isLoading}
        unitName={filters.unitName}
      />
    </div>
  );
}
