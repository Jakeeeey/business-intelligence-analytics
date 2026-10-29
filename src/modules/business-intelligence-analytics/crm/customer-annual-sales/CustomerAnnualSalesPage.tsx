"use client";

import React, { useMemo } from "react";
import { ErrorPage } from "@/app/(business-intelligence-analytics)/bia/_components/ErrorPage";
import { useCustomerAnnualSalesFilters } from "./providers/CustomerAnnualSalesFilterProvider";
import { useCustomerAnnualSales } from "./hooks/useCustomerAnnualSales";
import { CustomerAnnualSalesFilters } from "./components/CustomerAnnualSalesFilters";
import { CustomerAnnualSalesKPICards } from "./components/CustomerAnnualSalesKPICards";
import { CustomerAnnualSalesChart } from "./components/CustomerAnnualSalesChart";
import { CustomerAnnualSalesTable } from "./components/CustomerAnnualSalesTable";
import { CustomerTransactionDocumentsTable } from "./components/CustomerTransactionDocumentsTable";
import {
  aggregateMonthlyCustomerData,
  calculateCustomerSummary,
} from "./utils/customer-annual-sales.utils";
import { CustomerAnnualSaleItem } from "./types/customer-annual-sales.schema";
import { Building2 } from "lucide-react";

export default function CustomerAnnualSalesPage() {
  const { filters } = useCustomerAnnualSalesFilters();

  // Prepare query params to pass to Next.js API route
  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (filters.year) params.year = filters.year;
    if (filters.salesmanId && !filters.salesmanId.includes("|") && filters.salesmanId !== "NONE") {
      params.salesmanId = filters.salesmanId;
    }
    if (filters.customerName) params.customerName = filters.customerName;
    return params;
  }, [filters.year, filters.salesmanId, filters.customerName]);

  const { data, isLoading, error, refresh } = useCustomerAnnualSales(queryParams);

  const rawItems = useMemo(
    () => (data?.data as CustomerAnnualSaleItem[]) ?? [],
    [data]
  );

  const suppliers = useMemo(() => data?.suppliers ?? [], [data]);
  const salesmen = useMemo(() => data?.salesmen ?? [], [data]);
  const categories = useMemo(() => data?.categories ?? [], [data]);
  const priceTypes = useMemo(() => data?.priceTypes ?? [], [data]);
  const customers = useMemo(() => data?.customers ?? [], [data]);

  const hasSelectedCustomer = Boolean(filters.customerName && filters.customerName.trim().length > 0);

  // Client-side filtering
  const filteredData = useMemo(() => {
    // If no customer is selected yet, gate data loading
    if (!hasSelectedCustomer) {
      return {
        monthlyData: [],
        summary: {
          totalSoldAmount: 0,
          totalReturnedAmount: 0,
          totalNetAmount: 0,
          totalSoldQuantity: 0,
          totalReturnedQuantity: 0,
        },
        items: [],
      };
    }

    if (
      filters.month === "NONE" ||
      filters.salesmanId === "NONE" ||
      filters.supplierName === "NONE" ||
      filters.categoryName === "NONE" ||
      filters.priceType === "NONE"
    ) {
      return {
        monthlyData: [],
        summary: {
          totalSoldAmount: 0,
          totalReturnedAmount: 0,
          totalNetAmount: 0,
          totalSoldQuantity: 0,
          totalReturnedQuantity: 0,
        },
        items: [],
      };
    }

    const allowedMonths = filters.month
      ? filters.month.split(",").map(Number).filter((n) => !isNaN(n))
      : [];

    const salesmanList = filters.salesmanId
      ? filters.salesmanId.split("|").map((s) => s.trim()).filter(Boolean)
      : [];
    const customerQuery = filters.customerName?.trim().toLowerCase();
    const supplierList = filters.supplierName
      ? filters.supplierName.split("|").map((s) => s.trim().toLowerCase()).filter(Boolean)
      : [];
    const categoryList = filters.categoryName
      ? filters.categoryName.split("|").map((c) => c.trim().toLowerCase()).filter(Boolean)
      : [];
    const priceTypeList = filters.priceType
      ? filters.priceType.split("|").map((p) => p.trim()).filter(Boolean)
      : [];
    const unitQuery = filters.unitName?.trim().toLowerCase();

    let items = rawItems;

    // Filter by allowed months
    if (allowedMonths.length > 0 && allowedMonths.length < 12) {
      items = items.filter((item) => item.month && allowedMonths.includes(item.month));
    }

    // Filter by salesmen
    if (salesmanList.length > 0) {
      items = items.filter(
        (item) => item.salesmanId != null && salesmanList.includes(String(item.salesmanId))
      );
    }

    // Filter by customer name or customer code
    if (customerQuery) {
      items = items.filter(
        (item) =>
          item.customerName?.toLowerCase().includes(customerQuery) ||
          item.customerCode?.toLowerCase().includes(customerQuery)
      );
    }

    // Filter by suppliers (exact trimmed match)
    if (supplierList.length > 0) {
      items = items.filter(
        (item) =>
          item.supplierName &&
          supplierList.includes(item.supplierName.trim().toLowerCase())
      );
    }

    // Filter by categories (exact trimmed match)
    if (categoryList.length > 0) {
      items = items.filter(
        (item) =>
          item.productCategory &&
          categoryList.includes(item.productCategory.trim().toLowerCase())
      );
    }

    // Filter by price type
    if (priceTypeList.length > 0) {
      items = items.filter(
        (item) => item.priceTypeName && priceTypeList.includes(item.priceTypeName.trim())
      );
    }

    // Note: When Pieces or Box is selected, it switches the metric view (conversionToPieces / conversionToCases)
    // rather than filtering out items of other packaging units.
    if (unitQuery && unitQuery !== "pieces" && unitQuery !== "box") {
      items = items.filter(
        (item) => item.unitName?.trim().toLowerCase() === unitQuery
      );
    }

    const selectedYear = Number(filters.year) || new Date().getFullYear();
    const monthlyData = aggregateMonthlyCustomerData(
      items,
      selectedYear,
      filters.unitName,
      allowedMonths
    );
    const summary = calculateCustomerSummary(monthlyData);

    return {
      monthlyData,
      summary,
      items,
    };
  }, [
    rawItems,
    hasSelectedCustomer,
    filters.month,
    filters.salesmanId,
    filters.customerName,
    filters.supplierName,
    filters.categoryName,
    filters.priceType,
    filters.unitName,
    filters.year,
  ]);

  const { monthlyData, summary, items } = filteredData;

  if (error) return <ErrorPage message={error} onRefresh={refresh} />;

  return (
    <div className="space-y-6 p-4 md:p-8 pt-6 pb-16 min-h-full">
      {/* Row 1: Header section with Module Title and Prominent Highlighted Customer Display */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Customer Annual Sales {filters.year}
            </h2>
            {hasSelectedCustomer && (
              <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground bg-muted/60">
                {items.length} records
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Supplier perspective: Customer sales orders, returns, and net performance breakdown
          </p>
        </div>

        {/* Prominent Highlighted Customer Name */}
        {hasSelectedCustomer && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 shadow-xs max-w-full sm:max-w-md">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                Selected Customer
              </span>
              <span className="text-sm sm:text-base font-bold text-foreground truncate" title={filters.customerName}>
                {filters.customerName}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Row 2: Dedicated Filter Bar with spacious layout */}
      <div className="w-full">
        <CustomerAnnualSalesFilters
          suppliers={suppliers}
          salesmen={salesmen}
          categories={categories}
          priceTypes={priceTypes}
          customers={customers}
          isLoadingOptions={isLoading && customers.length === 0}
        />
      </div>

      {!hasSelectedCustomer ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border bg-card/50">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
            <span className="text-xl font-bold">!</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground">No Customer Selected</h3>
          <p className="text-sm text-muted-foreground max-w-md mt-1">
            Please select a customer from the filter above to load their sales orders, returns, and annual performance breakdown.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <CustomerAnnualSalesKPICards
            summary={summary}
            isLoading={isLoading}
            unitName={filters.unitName}
          />

          {/* Monthly Chart */}
          <CustomerAnnualSalesChart
            data={monthlyData}
            isLoading={isLoading}
            unitName={filters.unitName}
            amountType={filters.amountType}
          />

          {/* Data Table */}
          <CustomerAnnualSalesTable
            monthlyData={monthlyData}
            rawItems={items}
            isLoading={isLoading}
            unitName={filters.unitName}
          />

          {/* Transaction Documents Table: PO, SO, PDP, CLDTO, SI, DP, Delivered Date */}
          <CustomerTransactionDocumentsTable
            items={items}
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  );
}
