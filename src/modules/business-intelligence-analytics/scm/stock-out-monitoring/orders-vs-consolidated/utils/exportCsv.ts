// src/modules/business-intelligence-analytics/scm/stock-out-monitoring/orders-vs-consolidated/utils/exportCsv.ts
import type { OrdersRecord, OrdersFilters } from "../types";
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

function recordToRow(r: OrdersRecord): unknown[] {
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

const PENDING_STATUS = "For Consolidation";

export function exportToExcel(
  records: OrdersRecord[],
  filters: Pick<
    OrdersFilters,
    "dateFrom" | "dateTo" | "suppliers" | "brands" | "categories" | "statuses"
  >,
): void {
  try {
    const wb = XLSX.utils.book_new();
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    // ── Sheet 1: Metadata ──────────────────────────────────────────────────
    const metaRows: unknown[][] = [
      ["Report", "Orders vs Consolidated"],
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
      ["Total Records (rows)", records.length],
    ];
    const wsMeta = XLSX.utils.aoa_to_sheet(metaRows);
    XLSX.utils.book_append_sheet(wb, wsMeta, "Metadata");

    // ── Sheet 2: Raw Rows ──────────────────────────────────────────────────
    const rawData = [HEADERS, ...records.map(recordToRow)];
    const wsRaw = XLSX.utils.aoa_to_sheet(rawData);
    XLSX.utils.book_append_sheet(wb, wsRaw, "Raw Data");

    // ── Sheet 3: Orders Summary (canonical dedupe) ─────────────────────────
    const orderMap = new Map<
      number,
      {
        orderNo: string;
        orderDate: string;
        orderStatus: string;
        supplierName: string;
        productIds: Set<number>;
        totalOrdered: number;
        netAmount: number;
        isConsolidated: boolean;
      }
    >();
    for (const r of records) {
      const e = orderMap.get(r.orderId);
      if (e) {
        e.totalOrdered += r.orderedQuantity;
        e.netAmount += r.netAmount;
        e.productIds.add(r.productId);
      } else {
        orderMap.set(r.orderId, {
          orderNo: r.orderNo,
          orderDate: r.orderDate,
          orderStatus: r.orderStatus,
          supplierName: r.supplierName,
          productIds: new Set([r.productId]),
          totalOrdered: r.orderedQuantity,
          netAmount: r.netAmount,
          isConsolidated: r.orderStatus !== PENDING_STATUS,
        });
      }
    }
    const orderRows: unknown[][] = [
      [
        "Order ID",
        "Order No",
        "Order Date",
        "Order Status",
        "Supplier",
        "Product Count",
        "Total Ordered",
        "Net Amount",
        "Consolidated?",
      ],
      ...[...orderMap.entries()]
        .sort(([, a], [, b]) => b.orderDate.localeCompare(a.orderDate))
        .map(([id, o]) => [
          id,
          o.orderNo,
          o.orderDate,
          o.orderStatus,
          o.supplierName,
          o.productIds.size,
          o.totalOrdered,
          o.netAmount,
          o.isConsolidated ? "Yes" : "No",
        ]),
    ];
    const wsOrders = XLSX.utils.aoa_to_sheet(orderRows);
    XLSX.utils.book_append_sheet(wb, wsOrders, "Orders");

    // ── Sheet 4: Product Summary ───────────────────────────────────────────
    const productMap = new Map<
      number,
      {
        productName: string;
        brandName: string;
        categoryName: string;
        unit: string;
        totalOrdered: number;
        orderIds: Set<number>;
        netAmount: number;
      }
    >();
    for (const r of records) {
      const e = productMap.get(r.productId);
      if (e) {
        e.totalOrdered += r.orderedQuantity;
        e.orderIds.add(r.orderId);
        e.netAmount += r.netAmount;
      } else {
        productMap.set(r.productId, {
          productName: r.productName,
          brandName: r.brandName,
          categoryName: r.categoryName,
          unit: r.unit,
          totalOrdered: r.orderedQuantity,
          orderIds: new Set([r.orderId]),
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
        "Order Count",
        "Total Ordered",
        "Net Amount",
      ],
      ...[...productMap.entries()]
        .sort(([, a], [, b]) => b.totalOrdered - a.totalOrdered)
        .map(([id, p]) => [
          id,
          p.productName,
          p.brandName,
          p.categoryName,
          p.unit,
          p.orderIds.size,
          p.totalOrdered,
          p.netAmount,
        ]),
    ];
    const wsProducts = XLSX.utils.aoa_to_sheet(productRows);
    XLSX.utils.book_append_sheet(wb, wsProducts, "Top Products");

    // ── Write file ─────────────────────────────────────────────────────────
    const safeDateFrom = filters.dateFrom.replace(/-/g, "");
    const safeDateTo = filters.dateTo.replace(/-/g, "");
    const fileName = `orders-vs-consolidated_${safeDateFrom}_${safeDateTo}_${Date.now()}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Export successful — " + fileName);
  } catch (err) {
    console.error("Export failed:", err);
    toast.error("Export failed. Please try again.");
  }
}
