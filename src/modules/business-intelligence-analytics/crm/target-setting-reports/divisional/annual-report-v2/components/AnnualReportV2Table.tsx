"use client";

import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Table2, Receipt, FileText } from "lucide-react";
import { DataTable } from "@/components/ui/new-data-table";
import { GroupedPurchaseTable } from "./GroupedPurchaseTable";
import { GroupedSalesTable } from "./GroupedSalesTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { columns as monthlyColumns } from "./data-table/Columns";
import { salesColumns } from "./data-table/SalesColumns";
import { purchaseColumns } from "./data-table/PurchaseColumns";
import type {
  MonthlyAggregate,
  SalesTransaction,
  PurchaseTransaction,
} from "../types/annual-report.schema";

interface AnnualReportV2TableProps {
  data: MonthlyAggregate[];
  salesData?: SalesTransaction[];
  purchaseData?: PurchaseTransaction[];
  isLoading: boolean;
  unitName?: string;
}

export function AnnualReportV2Table({
  data,
  salesData = [],
  purchaseData = [],
  isLoading,
  unitName,
}: AnnualReportV2TableProps) {
  const [activeTab, setActiveTab] = useState("monthly");

  const sortedPurchaseData = React.useMemo(() => {
    return [...purchaseData].sort((a, b) => {
      const dateA = a.receiptDate ? new Date(a.receiptDate).getTime() : 0;
      const dateB = b.receiptDate ? new Date(b.receiptDate).getTime() : 0;
      return dateA - dateB; // Ascending order
    });
  }, [purchaseData]);

  const sortedSalesData = React.useMemo(() => {
    return [...salesData].sort((a, b) => {
      const dateA = a.invoiceDate ? new Date(a.invoiceDate).getTime() : 0;
      const dateB = b.invoiceDate ? new Date(b.invoiceDate).getTime() : 0;
      return dateA - dateB; // Ascending order
    });
  }, [salesData]);

  const handleExportCSV = useCallback(() => {
    let csvContent = "";
    let filename = "";

    if (activeTab === "monthly") {
      const headers = [
        "Month",
        "Total Sales",
        "Total Purchases",
        "Variance",
        "Bias %",
      ];
      const rows = data.map((row) => [
        row.monthLabel,
        row.totalSales.toFixed(2),
        row.totalPurchases.toFixed(2),
        row.variance.toFixed(2),
        row.biasPercentage.toFixed(2),
      ]);
      csvContent = [
        headers.join(","),
        ...rows.map((r) => r.join(",")),
      ].join("\n");
      filename = `monthly-breakdown-${new Date().toISOString().split("T")[0]}.csv`;
    } else if (activeTab === "sales") {
      const headers = ["Product Name", "Cases", "Total Amount"];
      const rows = salesData.map((row) => [
        `"${(row.productName || "Unknown Product").replace(/"/g, '""')}"`,
        String(row.cases ?? 0),
        (row.totalInvoiceAmount ?? 0).toFixed(2),
      ]);
      csvContent = [
        headers.join(","),
        ...rows.map((r) => r.join(",")),
      ].join("\n");
      filename = `sales-report-${new Date().toISOString().split("T")[0]}.csv`;
    } else if (activeTab === "purchases") {
      const headers = [
        "Receipt No",
        "Receipt Date",
        "Supplier Name",
        "Cases",
        "Total Receipt Amount",
      ];
      const rows = purchaseData.map((row) => [
        row.receiptNo,
        row.receiptDate,
        `"${(row.supplierName || "Unknown Supplier").replace(/"/g, '""')}"`,
        String(row.cases ?? 0),
        (row.totalReceiptAmount ?? 0).toFixed(2),
      ]);
      csvContent = [
        headers.join(","),
        ...rows.map((r) => r.join(",")),
      ].join("\n");
      filename = `purchase-report-${new Date().toISOString().split("T")[0]}.csv`;
    }

    if (!csvContent) return;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, salesData, purchaseData, activeTab]);

  return (
    <div className="space-y-4">
      {/* Title row — no Export CSV here anymore */}
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Table2 className="h-5 w-5 text-muted-foreground" />
        Data Reports
      </h3>

      <Tabs defaultValue="monthly" value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Tabs + Export CSV on same row */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <TabsList className="w-fit bg-muted/60 p-1">
            <TabsTrigger value="monthly" className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
              <Table2 className="h-4 w-4" />
              Monthly Breakdown
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
              <FileText className="h-4 w-4" />
              Sales Report
            </TabsTrigger>
            <TabsTrigger value="purchases" className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
              <Receipt className="h-4 w-4" />
              Purchase Report
            </TabsTrigger>
          </TabsList>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={
              (activeTab === "monthly" && !data.length) ||
              (activeTab === "sales" && !salesData.length) ||
              (activeTab === "purchases" && !purchaseData.length)
            }
            className="h-8 text-xs shrink-0"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>
        </div>

        <TabsContent value="monthly" className="m-0 animate-in fade-in-50 zoom-in-[0.98] duration-300">
          <DataTable
            columns={monthlyColumns(unitName)}
            data={data}
            searchKey="monthLabel"
            isLoading={isLoading}
            emptyTitle="No data available"
            emptyDescription="No monthly data matches the current filter criteria."
          />
        </TabsContent>

        <TabsContent value="sales" className="m-0 animate-in fade-in-50 zoom-in-[0.98] duration-300">
          <GroupedSalesTable
            columns={salesColumns(unitName)}
            data={sortedSalesData}
            searchKey="productName"
            isLoading={isLoading}
            emptyTitle="No sales data available"
            emptyDescription="No sales transactions found for the selected period."
            unitName={unitName}
          />
        </TabsContent>

        <TabsContent value="purchases" className="m-0 animate-in fade-in-50 zoom-in-[0.98] duration-300">
          <GroupedPurchaseTable
            columns={purchaseColumns(unitName)}
            data={sortedPurchaseData}
            searchKey="supplierName"
            isLoading={isLoading}
            emptyTitle="No purchase data available"
            emptyDescription="No purchase transactions found for the selected period."
            unitName={unitName}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

