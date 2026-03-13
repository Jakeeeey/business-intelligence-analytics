// src/modules/business-intelligence-analytics/sales-report/stt-report/utils/exportExcel.ts

import type { STTReportRecord } from "../types";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export type ExportContext = {
  dateFrom: string;
  dateTo: string;
  branches: string[];
  salesmen: string[];
  statuses: string[];
  suppliers: string[];
};

const HEADERS = [
  "Invoice ID",
  "Invoice No",
  "Order ID",
  "Customer Code",
  "Customer Name",
  "Store Type ID",
  "Store Type",
  "Customer Address",
  "Salesman",
  "Division ID",
  "Division Name",
  "Branch",
  "Invoice Date",
  "Dispatch Date",
  "Due Date",
  "Payment Terms",
  "Transaction Status",
  "Payment Status",
  "Total Amount",
  "Discount Amount",
  "Amount",
  "Return Amount Total",
  "Return Discount Total",
  "Collection",
  "Sales Type",
  "Invoice Type",
  "Price Type",
  "Created By",
  "Created Date",
  "Modified By",
  "Modified Date",
  "Is Receipt",
  "Is Posted",
  "Is Dispatched",
  "Is Remitted",
  "Product Name",
  "Product Category",
  "Product Brand",
  "Product Supplier",
  "Product Unit Price",
  "Product Quantity",
  "Product Unit",
  "Product Total Amount",
  "Product Discount Amount",
  "Product Net Amount",
  "Return Quantity",
  "Return Total Amount",
  "Return Discount Amount",
  "Return Net Amount",
  "Product Sales Amount",
];

function recordToRow(r: STTReportRecord): unknown[] {
  return [
    r.invoiceId,
    r.invoiceNo,
    r.orderId,
    r.customerCode,
    r.customerName,
    r.storeTypeId,
    r.storeType,
    r.customerAddress,
    r.salesman,
    r.divisionId,
    r.divisionName,
    r.branch,
    r.invoiceDate,
    r.dispatchDate,
    r.dueDate,
    r.paymentTerms ?? "",
    r.transactionStatus,
    r.paymentStatus,
    r.totalAmount,
    r.discountAmount,
    r.amount,
    r.returnTotalAmount,
    r.returnDiscountAmount,
    r.collection,
    r.salesType,
    r.invoiceType,
    r.priceType,
    r.createdBy,
    r.createdDate,
    r.modifiedBy,
    r.modifiedDate,
    r.isReceipt,
    r.isPosted,
    r.isDispatched,
    r.isRemitted ?? "",
    r.productName,
    r.productCategory,
    r.productBrand,
    r.productSupplier,
    r.productUnitPrice,
    r.productQuantity,
    r.productUnit,
    r.productTotalAmount,
    r.productDiscountAmount,
    r.productNetAmount,
    r.returnQuantity,
    r.returnTotalAmount,
    r.returnDiscountAmount,
    r.returnNetAmount ,
    r.productSalesAmount,
  ];
}

export function exportToExcel(
  data: STTReportRecord[],
  ctx: ExportContext,
): void {
  const loadingId = toast.loading("Preparing Excel export...");

  try {
    const metaLines = [
      ["Sales Report Summary"],
      [`Date Range: ${ctx.dateFrom} to ${ctx.dateTo}`],
      [`Branches: ${ctx.branches.length ? ctx.branches.join("; ") : "All"}`],
      [`Salesmen: ${ctx.salesmen.length ? ctx.salesmen.join("; ") : "All"}`],
      [`Statuses: ${ctx.statuses.length ? ctx.statuses.join("; ") : "All"}`],
      [`Suppliers: ${ctx.suppliers.length ? ctx.suppliers.join("; ") : "All"}`],
      [`Exported: ${new Date().toLocaleString("en-PH")}`],
      [`Total Rows: ${data.length}`],
      [],
    ];

    const rows = data.map(recordToRow);

    const aoa: unknown[][] = [...metaLines, HEADERS, ...rows];

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    /* ---------- AUTO COLUMN WIDTH ---------- */

    const colWidths = HEADERS.map((header, colIndex) => {
      const maxLength = Math.max(
        header.length,
        ...rows.map((r) => String(r[colIndex] ?? "").length),
      );

      return { wch: Math.min(maxLength + 2, 50) }; // cap width
    });

    ws["!cols"] = colWidths;

    /* ---------- FREEZE HEADER ---------- */

    ws["!freeze"] = { xSplit: 0, ySplit: metaLines.length + 1 };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");

    // Also produce a deduplicated Invoices sheet (invoice-level totals, first-row-wins)
    const invoiceMap = new Map<number, STTReportRecord>();
    data.forEach((r) => {
      if (!invoiceMap.has(r.invoiceId)) invoiceMap.set(r.invoiceId, r);
    });

    const INVOICE_HEADERS = [
      "Invoice ID",
      "Invoice No",
      "Invoice Date",
      "Customer Code",
      "Customer Name",
      "Salesman",
      "Branch",
      "Total Amount",
      "Discount Amount",
      "Collection",
      "Transaction Status",
      "Payment Status",
      "Division Name",
    ];

    const invoiceRows = Array.from(invoiceMap.values()).map((r) => [
      r.invoiceId,
      r.invoiceNo,
      r.invoiceDate,
      r.customerCode,
      r.customerName,
      r.salesman,
      r.branch,
      r.totalAmount,
      r.discountAmount || 0,
      r.collection,
      r.transactionStatus,
      r.paymentStatus,
      r.divisionName,
    ]);

    const invAoa: unknown[][] = [["Invoices (deduplicated by invoiceId)"], [`Date Range: ${ctx.dateFrom} to ${ctx.dateTo}`], [], INVOICE_HEADERS, ...invoiceRows];
    const invWs = XLSX.utils.aoa_to_sheet(invAoa);
    // autosize invoice sheet cols
    invWs["!cols"] = INVOICE_HEADERS.map((h, i) => ({ wch: Math.min(Math.max(10, String(h).length + 2), 50) }));
    XLSX.utils.book_append_sheet(wb, invWs, "Invoices");

    const fileName = `sales-report-summary_${ctx.dateFrom}_${ctx.dateTo}.xlsx`;

    XLSX.writeFile(wb, fileName);

    toast.success("Excel export ready", { id: loadingId });
  } catch (err) {
    toast.error("Failed to export Excel");
    throw err;
  }
}
