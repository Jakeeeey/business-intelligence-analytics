import type {
  CustomerDeliveredSummary,
  DeliveredItemRecord,
  ProductDeliveredSummary,
} from "../types";

function downloadCsvBlob(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportCustomerDeliveredCsv(
  data: CustomerDeliveredSummary[],
  filename: string = "customer_delivered_items_report.csv"
) {
  const headers = [
    "Customer Name",
    "City",
    "Province",
    "Total Items Delivered",
    "Total Delivered Amount (PHP)",
    "Unique Products Delivered",
    "Top Delivered Product",
    "Last Delivery Date",
  ];

  const rows = data.map((item) => [
    `"${(item.customerName || "").replace(/"/g, '""')}"`,
    `"${(item.city || "").replace(/"/g, '""')}"`,
    `"${(item.province || "").replace(/"/g, '""')}"`,
    item.totalItemsDelivered,
    item.totalDeliveredAmount.toFixed(2),
    item.uniqueProductsCount,
    `"${(item.topProduct || "").replace(/"/g, '""')}"`,
    `"${item.lastDeliveryDate || ""}"`,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  downloadCsvBlob(csv, filename);
}

export function exportItemizedDeliveryCsv(
  data: DeliveredItemRecord[],
  filename: string = "itemized_delivered_items_report.csv"
) {
  const headers = [
    "Date (Invoice)",
    "Customer Name",
    "Order No",
    "Invoice No",
    "Product Name",
    "Quantity Delivered",
    "Amount (PHP)",
    "City",
    "Province",
    "Supplier",
  ];

  const rows = data.map((item) => [
    `"${item.date || ""}"`,
    `"${(item.customerName || "").replace(/"/g, '""')}"`,
    `"${(item.orderNo || "").replace(/"/g, '""')}"`,
    `"${(item.invoiceNo || "").replace(/"/g, '""')}"`,
    `"${(item.productName || "").replace(/"/g, '""')}"`,
    item.quantity,
    item.amount.toFixed(2),
    `"${(item.city || "").replace(/"/g, '""')}"`,
    `"${(item.province || "").replace(/"/g, '""')}"`,
    `"${(item.supplier || "").replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  downloadCsvBlob(csv, filename);
}

export function exportProductDeliveredCsv(
  data: ProductDeliveredSummary[],
  filename: string = "product_delivered_items_report.csv"
) {
  const headers = [
    "Product Name",
    "Supplier",
    "Total Quantity Delivered",
    "Total Revenue (PHP)",
    "Customers Reached",
  ];

  const rows = data.map((item) => [
    `"${(item.productName || "").replace(/"/g, '""')}"`,
    `"${(item.supplier || "").replace(/"/g, '""')}"`,
    item.totalQuantity,
    item.totalAmount.toFixed(2),
    item.customersCount,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  downloadCsvBlob(csv, filename);
}

