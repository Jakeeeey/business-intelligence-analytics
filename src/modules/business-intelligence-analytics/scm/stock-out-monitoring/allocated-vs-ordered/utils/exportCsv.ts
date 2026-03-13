// src/modules/business-intelligence-analytics/scm/stock-out-monitoring/allocated-vs-ordered/utils/exportCsv.ts
import type { AllocatedOrderedRecord, AllocationFilters } from "../types";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const HEADERS = [
  "Order ID",
  "Order No",
  "Order Date",
  "Order Status",
  "Supplier ID",
  "Supplier Name",
  "Product ID",
  "Product Name",
  "Product Code",
  "Unit",
  "Brand",
  "Category",
  "Unit Price",
  "Ordered Quantity",
  "Allocated Quantity",
  "Discrepancy Gap",
  "Net Amount",
];

function recordToRow(r: AllocatedOrderedRecord): unknown[] {
  return [
    r.orderId,
    r.orderNo,
    r.orderDate,
    r.orderStatus,
    r.supplierId,
    r.supplierName,
    r.productId,
    r.productName,
    r.productCode ?? "",
    r.unit,
    r.brandName,
    r.categoryName,
    r.unitPrice,
    r.orderedQuantity,
    r.allocatedQuantity,
    r.discrepancyGap,
    r.netAmount,
  ];
}

export function exportToExcel(
  records: AllocatedOrderedRecord[],
  filters: Pick<
    AllocationFilters,
    "dateFrom" | "dateTo" | "suppliers" | "brands" | "categories" | "statuses"
  >,
): void {
  try {
    const wb = XLSX.utils.book_new();
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    // ── Sheet 1: Metadata ──────────────────────────────────────────────────
    const metaRows: unknown[][] = [
      ["Report", "Allocated vs Ordered"],
      ["Generated At", timestamp],
      ["Date From", filters.dateFrom],
      ["Date To", filters.dateTo],
      [
        "Suppliers",
        filters.suppliers.length > 0 ? filters.suppliers.join(", ") : "All",
      ],
      ["Brands", filters.brands.length > 0 ? filters.brands.join(", ") : "All"],
      [
        "Categories",
        filters.categories.length > 0 ? filters.categories.join(", ") : "All",
      ],
      [
        "Statuses",
        filters.statuses.length > 0 ? filters.statuses.join(", ") : "All",
      ],
      ["Total Records", records.length],
    ];
    const wsMeta = XLSX.utils.aoa_to_sheet(metaRows);
    XLSX.utils.book_append_sheet(wb, wsMeta, "Metadata");

    // ── Sheet 2: Raw Rows ──────────────────────────────────────────────────
    const rawData = [HEADERS, ...records.map(recordToRow)];
    const wsRaw = XLSX.utils.aoa_to_sheet(rawData);
    XLSX.utils.book_append_sheet(wb, wsRaw, "Raw Data");

    // ── Sheet 3: Product Summary ───────────────────────────────────────────
    const productMap = new Map<
      number,
      {
        productName: string;
        brandName: string;
        categoryName: string;
        unit: string;
        totalOrdered: number;
        totalAllocated: number;
        gap: number;
        netAmount: number;
      }
    >();
    for (const r of records) {
      const e = productMap.get(r.productId);
      if (e) {
        e.totalOrdered += r.orderedQuantity;
        e.totalAllocated += r.allocatedQuantity;
        e.gap += r.discrepancyGap;
        e.netAmount += r.netAmount;
      } else {
        productMap.set(r.productId, {
          productName: r.productName,
          brandName: r.brandName,
          categoryName: r.categoryName,
          unit: r.unit,
          totalOrdered: r.orderedQuantity,
          totalAllocated: r.allocatedQuantity,
          gap: r.discrepancyGap,
          netAmount: r.netAmount,
        });
      }
    }
    const productRows: unknown[][] = [
      [
        "Product ID",
        "Product Name",
        "Brand",
        "Category",
        "Unit",
        "Total Ordered",
        "Total Allocated",
        "Gap",
        "Allocation Rate %",
        "Net Amount",
      ],
      ...[...productMap.entries()]
        .sort(([, a], [, b]) => b.gap - a.gap)
        .map(([id, p]) => [
          id,
          p.productName,
          p.brandName,
          p.categoryName,
          p.unit,
          p.totalOrdered,
          p.totalAllocated,
          p.gap,
          p.totalOrdered > 0
            ? Number(((p.totalAllocated / p.totalOrdered) * 100).toFixed(2))
            : 0,
          p.netAmount,
        ]),
    ];
    const wsProducts = XLSX.utils.aoa_to_sheet(productRows);
    XLSX.utils.book_append_sheet(wb, wsProducts, "Top Products");

    // ── Sheet 4: Supplier Summary ──────────────────────────────────────────
    const supplierMap = new Map<
      number,
      {
        supplierName: string;
        totalOrdered: number;
        totalAllocated: number;
        gap: number;
        netAmount: number;
        orderIds: Set<number>;
      }
    >();
    for (const r of records) {
      const e = supplierMap.get(r.supplierId);
      if (e) {
        e.totalOrdered += r.orderedQuantity;
        e.totalAllocated += r.allocatedQuantity;
        e.gap += r.discrepancyGap;
        e.netAmount += r.netAmount;
        e.orderIds.add(r.orderId);
      } else {
        supplierMap.set(r.supplierId, {
          supplierName: r.supplierName,
          totalOrdered: r.orderedQuantity,
          totalAllocated: r.allocatedQuantity,
          gap: r.discrepancyGap,
          netAmount: r.netAmount,
          orderIds: new Set([r.orderId]),
        });
      }
    }
    const supplierRows: unknown[][] = [
      [
        "Supplier ID",
        "Supplier Name",
        "Order Count",
        "Total Ordered",
        "Total Allocated",
        "Gap",
        "Allocation Rate %",
        "Net Amount",
      ],
      ...[...supplierMap.entries()]
        .sort(([, a], [, b]) => b.gap - a.gap)
        .map(([id, s]) => [
          id,
          s.supplierName,
          s.orderIds.size,
          s.totalOrdered,
          s.totalAllocated,
          s.gap,
          s.totalOrdered > 0
            ? Number(((s.totalAllocated / s.totalOrdered) * 100).toFixed(2))
            : 0,
          s.netAmount,
        ]),
    ];
    const wsSuppliers = XLSX.utils.aoa_to_sheet(supplierRows);
    XLSX.utils.book_append_sheet(wb, wsSuppliers, "Suppliers");

    // ── Write file ─────────────────────────────────────────────────────────
    const safeDateFrom = filters.dateFrom.replace(/-/g, "");
    const safeDateTo = filters.dateTo.replace(/-/g, "");
    const fileName = `allocated-vs-ordered_${safeDateFrom}_${safeDateTo}_${Date.now()}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Export successful — " + fileName);
  } catch (err) {
    console.error("Export failed:", err);
    toast.error("Export failed. Please try again.");
  }
}
