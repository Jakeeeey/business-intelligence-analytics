"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Download, Calendar, ShoppingCart, RotateCcw } from "lucide-react";
import { DataTable } from "@/components/ui/new-data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColumnDef } from "@tanstack/react-table";
import {
  MonthlyCustomerAggregate,
  CustomerAnnualSaleItem,
} from "../types/customer-annual-sales.schema";
import { formatCurrency, MONTH_LABELS } from "../utils/customer-annual-sales.utils";
import { GroupedCustomerSalesTable } from "./GroupedCustomerSalesTable";

export interface ConsolidatedSaleItem {
  customerId?: number | null;
  customerCode?: string | null;
  customerName?: string | null;
  salesmanName?: string | null;
  supplierName?: string | null;
  productId?: number | null;
  productName?: string | null;
  productCategory?: string | null;
  unitName?: string | null;
  priceTypeName?: string | null;
  month?: number | null;
  year?: number | null;
  monthYear: string;
  monthLabel?: string;
  cases: number;
  pieces: number;
  soldQuantity: number;
  soldAmount: number;
  returnedQuantity: number;
  returnedAmount: number;
}

interface CustomerAnnualSalesTableProps {
  monthlyData: MonthlyCustomerAggregate[];
  rawItems: CustomerAnnualSaleItem[];
  isLoading: boolean;
  unitName?: string;
}

export function CustomerAnnualSalesTable({
  monthlyData,
  rawItems,
  isLoading,
  unitName,
}: CustomerAnnualSalesTableProps) {
  const [activeTab, setActiveTab] = useState("monthly");
  const normUnit = unitName?.toLowerCase();
  const isUnitQty = normUnit === "pieces" || normUnit === "box";

  // Tab 1: Monthly Columns
  const monthlyColumns: ColumnDef<MonthlyCustomerAggregate>[] = useMemo(
    () => [
      {
        accessorKey: "monthLabel",
        header: "Month",
        cell: ({ row }) => (
          <span className="font-semibold text-foreground">
            {row.original.monthLabel}
          </span>
        ),
      },
      {
        accessorKey: isUnitQty ? "soldQuantity" : "soldAmount",
        header: isUnitQty ? "Sold Quantity" : "Sales Orders",
        cell: ({ row }) => (
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            {isUnitQty
              ? row.original.soldQuantity.toLocaleString()
              : formatCurrency(row.original.soldAmount)}
          </span>
        ),
      },
      {
        accessorKey: isUnitQty ? "returnedQuantity" : "returnedAmount",
        header: isUnitQty ? "Returned Quantity" : "Returns Amount",
        cell: ({ row }) => (
          <span className="text-rose-600 dark:text-rose-400 font-semibold">
            {isUnitQty
              ? row.original.returnedQuantity.toLocaleString()
              : formatCurrency(row.original.returnedAmount)}
          </span>
        ),
      },
      {
        accessorKey: "netAmount",
        header: "Net Sales",
        cell: ({ row }) => (
          <span className="text-blue-600 dark:text-blue-400 font-bold">
            {isUnitQty
              ? (
                  row.original.soldQuantity - row.original.returnedQuantity
                ).toLocaleString()
              : formatCurrency(row.original.netAmount)}
          </span>
        ),
      },
    ],
    [isUnitQty]
  );

  // Consolidate raw sales by Supplier + Category + Product + Month
  const consolidatedSales = useMemo(() => {
    const map = new Map<string, ConsolidatedSaleItem>();

    for (const item of rawItems) {
      const itemCases = item.conversionToCases ?? 0;
      const itemPieces = item.conversionToPieces ?? 0;
      const sAmount = item.soldAmount ?? 0;
      const sQty = item.soldQuantity ?? 0;

      // Only sales items (must have positive soldAmount or soldQuantity)
      if (sAmount <= 0 && sQty <= 0) continue;

      const sName = item.supplierName || "s_none";
      const cat = item.productCategory || "cat_none";
      const pId = item.productId ?? item.productName ?? "p_none";
      const m = item.month ?? 1;
      const y = item.year ?? new Date().getFullYear();
      const monthYear = `${MONTH_LABELS[m - 1] || `Month ${m}`} ${y}`;
      const key = `${sName}_${cat}_${pId}_${m}_${y}`;

      const existing = map.get(key);
      if (existing) {
        existing.soldQuantity += sQty;
        existing.soldAmount += sAmount;
        existing.cases += itemCases;
        existing.pieces += itemPieces;
      } else {
        map.set(key, {
          customerId: item.customerId,
          customerCode: item.customerCode,
          customerName: item.customerName,
          salesmanName: item.salesmanName,
          supplierName: item.supplierName,
          productId: item.productId,
          productName: item.productName,
          productCategory: item.productCategory,
          unitName: item.unitName,
          priceTypeName: item.priceTypeName,
          month: m,
          year: y,
          monthYear,
          monthLabel: MONTH_LABELS[m - 1] || `Month ${m}`,
          cases: itemCases,
          pieces: itemPieces,
          soldQuantity: sQty,
          soldAmount: sAmount,
          returnedQuantity: 0,
          returnedAmount: 0,
        });
      }
    }

    // Primary sort: month ascending (Jan - Dec)
    // Secondary sort: soldAmount descending (highest to lowest within the month)
    return Array.from(map.values()).sort((a, b) => {
      const monthDiff = (a.month ?? 0) - (b.month ?? 0);
      if (monthDiff !== 0) return monthDiff;
      return b.soldAmount - a.soldAmount;
    });
  }, [rawItems]);

  // Consolidate raw returns by Supplier + Category + Product + Month
  const consolidatedReturns = useMemo(() => {
    const map = new Map<string, ConsolidatedSaleItem>();

    for (const item of rawItems) {
      const itemCases = item.conversionToCases ?? 0;
      const itemPieces = item.conversionToPieces ?? 0;
      const rAmount = item.returnedAmount ?? 0;
      const rQty = item.returnedQuantity ?? 0;

      // Returns must have returnedAmount > 0 or returnedQuantity > 0
      if (rAmount <= 0 && rQty <= 0) continue;

      const sName = item.supplierName || "s_none";
      const cat = item.productCategory || "cat_none";
      const pId = item.productId ?? item.productName ?? "p_none";
      const m = item.month ?? 1;
      const y = item.year ?? new Date().getFullYear();
      const monthYear = `${MONTH_LABELS[m - 1] || `Month ${m}`} ${y}`;
      const key = `${sName}_${cat}_${pId}_${m}_${y}`;

      const existing = map.get(key);
      if (existing) {
        existing.returnedQuantity += rQty;
        existing.returnedAmount += rAmount;
        existing.cases += itemCases;
        existing.pieces += itemPieces;
      } else {
        map.set(key, {
          customerId: item.customerId,
          customerCode: item.customerCode,
          customerName: item.customerName,
          salesmanName: item.salesmanName,
          supplierName: item.supplierName,
          productId: item.productId,
          productName: item.productName,
          productCategory: item.productCategory,
          unitName: item.unitName,
          priceTypeName: item.priceTypeName,
          month: m,
          year: y,
          monthYear,
          monthLabel: MONTH_LABELS[m - 1] || `Month ${m}`,
          cases: itemCases,
          pieces: itemPieces,
          soldQuantity: 0,
          soldAmount: 0,
          returnedQuantity: item.returnedQuantity ?? 0,
          returnedAmount: item.returnedAmount ?? 0,
        });
      }
    }

    // Primary sort: month ascending (Jan - Dec)
    // Secondary sort: returnedAmount descending (highest to lowest within the month)
    return Array.from(map.values()).sort((a, b) => {
      const monthDiff = (a.month ?? 0) - (b.month ?? 0);
      if (monthDiff !== 0) return monthDiff;
      return b.returnedAmount - a.returnedAmount;
    });
  }, [rawItems]);

  // Tab 2: Accordion-enabled Sales Columns: Supplier | Category | Product/SKU | Cases | Pieces | Sold Amount
  const salesColumns: ColumnDef<ConsolidatedSaleItem>[] = useMemo(
    () => [
      {
        id: "monthYear",
        accessorKey: "monthYear",
        header: "Month",
        enableHiding: false,
      },
      {
        accessorKey: "supplierName",
        header: "Supplier",
        cell: ({ row }) => (
          <span className="font-semibold text-foreground text-xs">
            {row.original.supplierName || "N/A"}
          </span>
        ),
        meta: { label: "Supplier" },
      },
      {
        accessorKey: "productCategory",
        header: "Category",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-medium">
            {row.original.productCategory || "N/A"}
          </span>
        ),
        meta: { label: "Category" },
      },
      {
        accessorKey: "productName",
        header: "Product / SKU",
        cell: ({ row }) => (
          <div className="flex flex-col max-w-[280px]">
            <span
              className="font-medium text-foreground truncate text-xs"
              title={row.original.productName ?? undefined}
            >
              {row.original.productName || "N/A"}
            </span>
          </div>
        ),
        meta: { label: "Product / SKU" },
      },
      {
        accessorKey: "cases",
        header: () => <div className="text-right">Cases</div>,
        cell: ({ row }) => (
          <div className="text-right font-medium text-foreground tabular-nums text-xs">
            {row.original.cases.toLocaleString()}
          </div>
        ),
        meta: { label: "Cases" },
      },
      {
        accessorKey: "pieces",
        header: () => <div className="text-right">Pieces</div>,
        cell: ({ row }) => (
          <div className="text-right font-semibold text-foreground tabular-nums text-xs">
            {row.original.pieces.toLocaleString()}
          </div>
        ),
        meta: { label: "Pieces" },
      },
      {
        accessorKey: "soldAmount",
        header: () => <div className="text-right">Sold Amount</div>,
        cell: ({ row }) => (
          <div className="text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums text-xs">
            {formatCurrency(row.original.soldAmount)}
          </div>
        ),
        meta: { label: "Sold Amount" },
      },
    ],
    []
  );

  // Tab 3: Accordion-enabled Return Columns: Supplier | Category | Product/SKU | Cases | Pieces | Return Amount
  const returnColumns: ColumnDef<ConsolidatedSaleItem>[] = useMemo(
    () => [
      {
        id: "monthYear",
        accessorKey: "monthYear",
        header: "Month",
        enableHiding: false,
      },
      {
        accessorKey: "supplierName",
        header: "Supplier",
        cell: ({ row }) => (
          <span className="font-semibold text-foreground text-xs">
            {row.original.supplierName || "N/A"}
          </span>
        ),
        meta: { label: "Supplier" },
      },
      {
        accessorKey: "productCategory",
        header: "Category",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-medium">
            {row.original.productCategory || "N/A"}
          </span>
        ),
        meta: { label: "Category" },
      },
      {
        accessorKey: "productName",
        header: "Product / SKU",
        cell: ({ row }) => (
          <div className="flex flex-col max-w-[280px]">
            <span
              className="font-medium text-foreground truncate text-xs"
              title={row.original.productName ?? undefined}
            >
              {row.original.productName || "N/A"}
            </span>
          </div>
        ),
        meta: { label: "Product / SKU" },
      },
      {
        accessorKey: "cases",
        header: () => <div className="text-right">Cases</div>,
        cell: ({ row }) => (
          <div className="text-right font-medium text-foreground tabular-nums text-xs">
            {row.original.cases.toLocaleString()}
          </div>
        ),
        meta: { label: "Cases" },
      },
      {
        accessorKey: "pieces",
        header: () => <div className="text-right">Pieces</div>,
        cell: ({ row }) => (
          <div className="text-right font-semibold text-foreground tabular-nums text-xs">
            {row.original.pieces.toLocaleString()}
          </div>
        ),
        meta: { label: "Pieces" },
      },
      {
        accessorKey: "returnedAmount",
        header: () => <div className="text-right">Return Amount</div>,
        cell: ({ row }) => (
          <div className="text-right font-bold text-rose-600 dark:text-rose-400 tabular-nums text-xs">
            {formatCurrency(row.original.returnedAmount)}
          </div>
        ),
        meta: { label: "Return Amount" },
      },
    ],
    []
  );

  // CSV Export handler
  const handleExportCSV = useCallback(() => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = "";

    const escapeCsv = (str?: string | null) => `"${(str || "").replace(/"/g, '""')}"`;

    if (activeTab === "monthly") {
      headers = [
        "Month",
        isUnitQty ? "Sold Quantity" : "Sales Orders (PHP)",
        isUnitQty ? "Returned Quantity" : "Returns Amount (PHP)",
        isUnitQty ? "Net Quantity" : "Net Sales (PHP)",
      ];
      rows = monthlyData.map((r) => [
        escapeCsv(r.monthLabel),
        isUnitQty ? String(r.soldQuantity) : r.soldAmount.toFixed(2),
        isUnitQty ? String(r.returnedQuantity) : r.returnedAmount.toFixed(2),
        isUnitQty
          ? String(r.soldQuantity - r.returnedQuantity)
          : r.netAmount.toFixed(2),
      ]);
      filename = `monthly-customer-sales-${new Date().toISOString().split("T")[0]}.csv`;
    } else if (activeTab === "sales") {
      headers = [
        "Month",
        "Supplier",
        "Category",
        "Product / SKU",
        "Cases",
        "Pieces",
        "Sold Amount",
      ];
      rows = consolidatedSales.map((r) => [
        escapeCsv(r.monthYear),
        escapeCsv(r.supplierName),
        escapeCsv(r.productCategory),
        escapeCsv(r.productName),
        String(r.cases),
        String(r.pieces),
        r.soldAmount.toFixed(2),
      ]);
      filename = `consolidated-sales-orders-${new Date().toISOString().split("T")[0]}.csv`;
    } else if (activeTab === "returns") {
      headers = [
        "Month",
        "Supplier",
        "Category",
        "Product / SKU",
        "Cases",
        "Pieces",
        "Returned Amount",
      ];
      rows = consolidatedReturns.map((r) => [
        escapeCsv(r.monthYear),
        escapeCsv(r.supplierName),
        escapeCsv(r.productCategory),
        escapeCsv(r.productName),
        String(r.cases),
        String(r.pieces),
        r.returnedAmount.toFixed(2),
      ]);
      filename = `consolidated-sales-returns-${new Date().toISOString().split("T")[0]}.csv`;
    }

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [activeTab, monthlyData, consolidatedSales, consolidatedReturns, isUnitQty]);

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2">
          <TabsList className="bg-muted p-1 rounded-xl">
            <TabsTrigger
              value="monthly"
              className="flex items-center gap-2 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg"
            >
              <Calendar className="h-3.5 w-3.5" />
              Monthly Breakdown
            </TabsTrigger>
            <TabsTrigger
              value="sales"
              className="flex items-center gap-2 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Sales Orders ({consolidatedSales.length})
            </TabsTrigger>
            <TabsTrigger
              value="returns"
              className="flex items-center gap-2 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Sales Returns ({consolidatedReturns.length})
            </TabsTrigger>
          </TabsList>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={isLoading}
            className="h-8 text-xs font-medium flex items-center gap-1.5 border-border bg-card hover:bg-accent"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>

        <TabsContent value="monthly" className="mt-0">
          <DataTable
            columns={monthlyColumns}
            data={monthlyData}
            isLoading={isLoading}
            pagination={{ pageIndex: 0, pageSize: 50 }}
          />
        </TabsContent>

        <TabsContent value="sales" className="mt-0">
          <GroupedCustomerSalesTable
            columns={salesColumns}
            data={consolidatedSales}
            searchKey="productName"
            isLoading={isLoading}
            unitName={unitName}
            type="sales"
          />
        </TabsContent>

        <TabsContent value="returns" className="mt-0">
          <GroupedCustomerSalesTable
            columns={returnColumns}
            data={consolidatedReturns}
            searchKey="productName"
            isLoading={isLoading}
            unitName={unitName}
            type="returns"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
