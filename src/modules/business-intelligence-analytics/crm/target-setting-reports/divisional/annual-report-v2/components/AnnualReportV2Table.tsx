"use client";

import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Table2, Receipt, FileText } from "lucide-react";
import { DataTable } from "@/components/ui/new-data-table";
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
}

export function AnnualReportV2Table({
  data,
  salesData = [],
  purchaseData = [],
  isLoading,
}: AnnualReportV2TableProps) {
  const [activeTab, setActiveTab] = useState("monthly");
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
      const headers = ["Invoice No", "Invoice Date", "Customer Name", "Cases", "Total Invoice Amount"];
      const rows = salesData.map((row) => [
        row.invoiceNo,
        row.invoiceDate,
        `"${row.customerName.replace(/"/g, '""')}"`,
        String(row.cases ?? 0),
        row.totalInvoiceAmount.toFixed(2),
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
        `"${row.supplierName.replace(/"/g, '""')}"`,
        String(row.cases ?? 0),
        row.totalReceiptAmount.toFixed(2),
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
          <TabsList className="w-fit">
            <TabsTrigger value="monthly" className="flex items-center gap-2 whitespace-nowrap">
              <Table2 className="h-4 w-4" />
              Monthly Breakdown
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2 whitespace-nowrap">
              <FileText className="h-4 w-4" />
              Sales Report
            </TabsTrigger>
            <TabsTrigger value="purchases" className="flex items-center gap-2 whitespace-nowrap">
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

        <TabsContent value="monthly" className="m-0">
          <DataTable
            columns={monthlyColumns}
            data={data}
            searchKey="monthLabel"
            isLoading={isLoading}
            emptyTitle="No data available"
            emptyDescription="No monthly data matches the current filter criteria."
          />
        </TabsContent>

        <TabsContent value="sales" className="m-0">
          <DataTable
            columns={salesColumns}
            data={salesData}
            searchKey="customerName"
            isLoading={isLoading}
            emptyTitle="No sales data available"
            emptyDescription="No sales transactions found for the selected period."
          />
        </TabsContent>

        <TabsContent value="purchases" className="m-0">
          <DataTable
            columns={purchaseColumns}
            data={purchaseData}
            searchKey="supplierName"
            isLoading={isLoading}
            emptyTitle="No purchase data available"
            emptyDescription="No purchase transactions found for the selected period."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

