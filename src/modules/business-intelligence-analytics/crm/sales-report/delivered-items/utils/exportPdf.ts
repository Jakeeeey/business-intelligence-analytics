// src/modules/business-intelligence-analytics/crm/sales-report/delivered-items/utils/exportPdf.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  CustomerDeliveredSummary,
  DeliveredItemsFilters,
  DeliveredItemsKpis,
  ProductDeliveredSummary,
} from "../types";

const numFmt = new Intl.NumberFormat("en-US");
const phpFmt = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function exportCustomerDeliveredPdf(
  data: CustomerDeliveredSummary[],
  filters: DeliveredItemsFilters,
  kpis: DeliveredItemsKpis,
  filename: string = "delivered_items_customer_summary.pdf"
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Primary Theme Colors
  const primaryColor: [number, number, number] = [30, 41, 59]; // slate-800
  const emeraldColor: [number, number, number] = [16, 185, 129]; // emerald-500

  // 1. Top Decorative Bar
  doc.setFillColor(...emeraldColor);
  doc.rect(0, 0, pageWidth, 4, "F");

  // 2. Report Header
  let currentY = 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...primaryColor);
  doc.text("DELIVERED ITEMS REPORT", margin, currentY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Customer Delivered Quantities & Sales Value Summary", margin, currentY + 5);

  // Right-aligned report metadata
  const now = new Date();
  const timestampStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  doc.setFontSize(8);
  doc.text(`Generated: ${timestampStr}`, pageWidth - margin, currentY, { align: "right" });
  doc.text("VOS BI & Analytics System", pageWidth - margin, currentY + 5, { align: "right" });

  currentY += 12;

  // 3. Metadata & Filter Summary Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 14, 2, 2, "FD");

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  const filterCustomerText =
    filters.selectedCustomers && filters.selectedCustomers.length > 0
      ? `${filters.selectedCustomers.length} selected (${filters.selectedCustomers.slice(0, 2).join(", ")}${
          filters.selectedCustomers.length > 2 ? "..." : ""
        })`
      : "All Customers";

  doc.text(`Date Range: ${filters.startDate} to ${filters.endDate}`, margin + 4, currentY + 5.5);
  doc.text(`Customer Filter: ${filterCustomerText}`, margin + 4, currentY + 10.5);

  const searchInfo = filters.searchTerm ? `Search: "${filters.searchTerm}"` : "Filter: All items";
  doc.text(searchInfo, pageWidth - margin - 4, currentY + 5.5, { align: "right" });
  doc.text(`Total Customers Listed: ${data.length}`, pageWidth - margin - 4, currentY + 10.5, {
    align: "right",
  });

  currentY += 18;

  // 4. KPI Highlights Cards
  const cardWidth = (pageWidth - margin * 2 - 8) / 3;
  const cardHeight = 15;

  const kpiItems = [
    {
      label: "TOTAL CUSTOMERS",
      val: numFmt.format(kpis.activeCustomersCount),
      color: primaryColor,
    },
    {
      label: "TOTAL UNITS DELIVERED",
      val: numFmt.format(kpis.totalDeliveredItems),
      color: [2, 132, 199] as [number, number, number], // sky-600
    },
    {
      label: "TOTAL SALES VALUE",
      val: phpFmt.format(kpis.totalDeliveredAmount),
      color: [5, 150, 105] as [number, number, number], // emerald-600
    },
  ];

  kpiItems.forEach((kpi, idx) => {
    const cardX = margin + idx * (cardWidth + 4);
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, "FD");

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, cardX + 3.5, currentY + 4.5);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...kpi.color);
    doc.text(kpi.val, cardX + 3.5, currentY + 11.5);
  });

  currentY += cardHeight + 6;

  // 5. Data Table
  const tableHeaders = [
    [
      "#",
      "Customer Name",
      "Location",
      "Units Delivered",
      "Total Amount (PHP)",
      "Top Delivered Product",
    ],
  ];

  let sumQty = 0;
  let sumAmount = 0;

  const tableRows = data.map((item, idx) => {
    sumQty += item.totalItemsDelivered || 0;
    sumAmount += item.totalDeliveredAmount || 0;

    const location = [item.city, item.province].filter(Boolean).join(", ") || "—";
    return [
      String(idx + 1),
      item.customerName || "—",
      location,
      numFmt.format(item.totalItemsDelivered),
      phpFmt.format(item.totalDeliveredAmount),
      item.topProduct || "—",
    ];
  });

  const tableFoot = [
    [
      "",
      `Grand Total (${data.length} Customers)`,
      "",
      numFmt.format(sumQty),
      phpFmt.format(sumAmount),
      "",
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: tableHeaders,
    body: tableRows,
    foot: tableFoot,
    margin: { left: margin, right: margin, bottom: 15 },
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 2.8,
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 7.5,
      cellPadding: 2.4,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    footStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 2.8,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 9 },
      1: { cellWidth: 52 },
      2: { cellWidth: 32 },
      3: { halign: "right", cellWidth: 25 },
      4: { halign: "right", cellWidth: 30 },
      5: { cellWidth: "auto" },
    },
    styles: {
      overflow: "linebreak",
    },
  });

  // 6. Draw Page Numbers and Footers across all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    // Left footer
    doc.text(
      "VOS BI & Analytics • CRM Delivered Items Summary Report",
      margin,
      pageHeight - 8
    );

    // Right footer
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, {
      align: "right",
    });
  }

  // 7. Save / Trigger Download
  doc.save(filename);
}

export function exportProductDeliveredPdf(
  data: ProductDeliveredSummary[],
  filters: DeliveredItemsFilters,
  kpis: DeliveredItemsKpis,
  filename: string = "delivered_items_product_summary.pdf"
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const primaryColor: [number, number, number] = [30, 41, 59]; // slate-800
  const blueColor: [number, number, number] = [37, 99, 235]; // blue-600

  // 1. Top Decorative Bar
  doc.setFillColor(...blueColor);
  doc.rect(0, 0, pageWidth, 4, "F");

  // 2. Report Header
  let currentY = 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...primaryColor);
  doc.text("DELIVERED PRODUCTS REPORT", margin, currentY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Product Fulfillment, Quantities & Revenue Summary", margin, currentY + 5);

  const now = new Date();
  const timestampStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  doc.setFontSize(8);
  doc.text(`Generated: ${timestampStr}`, pageWidth - margin, currentY, { align: "right" });
  doc.text("VOS BI & Analytics System", pageWidth - margin, currentY + 5, { align: "right" });

  currentY += 12;

  // 3. Metadata Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 14, 2, 2, "FD");

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  const filterCustomerText =
    filters.selectedCustomers && filters.selectedCustomers.length > 0
      ? `${filters.selectedCustomers.length} selected (${filters.selectedCustomers.slice(0, 2).join(", ")}${
          filters.selectedCustomers.length > 2 ? "..." : ""
        })`
      : "All Customers";

  doc.text(`Date Range: ${filters.startDate} to ${filters.endDate}`, margin + 4, currentY + 5.5);
  doc.text(`Customer Filter: ${filterCustomerText}`, margin + 4, currentY + 10.5);

  const searchInfo = filters.searchTerm ? `Search: "${filters.searchTerm}"` : "Filter: All products";
  doc.text(searchInfo, pageWidth - margin - 4, currentY + 5.5, { align: "right" });
  doc.text(`Total SKUs Listed: ${data.length}`, pageWidth - margin - 4, currentY + 10.5, {
    align: "right",
  });

  currentY += 18;

  // 4. KPI Highlights Cards
  const cardWidth = (pageWidth - margin * 2 - 8) / 3;
  const cardHeight = 15;

  const kpiItems = [
    {
      label: "DISTINCT PRODUCTS",
      val: numFmt.format(data.length),
      color: [217, 119, 6] as [number, number, number], // amber-600
    },
    {
      label: "TOTAL UNITS DELIVERED",
      val: numFmt.format(kpis.totalDeliveredItems),
      color: [2, 132, 199] as [number, number, number], // sky-600
    },
    {
      label: "TOTAL REVENUE VALUE",
      val: phpFmt.format(kpis.totalDeliveredAmount),
      color: [5, 150, 105] as [number, number, number], // emerald-600
    },
  ];

  kpiItems.forEach((kpi, idx) => {
    const cardX = margin + idx * (cardWidth + 4);
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, "FD");

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, cardX + 3.5, currentY + 4.5);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...kpi.color);
    doc.text(kpi.val, cardX + 3.5, currentY + 11.5);
  });

  currentY += cardHeight + 6;

  // 5. Product Data Table
  const tableHeaders = [
    [
      "#",
      "Product Name",
      "Supplier",
      "Units Delivered",
      "Total Revenue (PHP)",
      "Accounts Reached",
    ],
  ];

  let sumQty = 0;
  let sumAmount = 0;

  const tableRows = data.map((item, idx) => {
    sumQty += item.totalQuantity || 0;
    sumAmount += item.totalAmount || 0;

    return [
      String(idx + 1),
      item.productName || "—",
      item.supplier || "—",
      numFmt.format(item.totalQuantity),
      phpFmt.format(item.totalAmount),
      `${item.customersCount} customer${item.customersCount !== 1 ? "s" : ""}`,
    ];
  });

  const tableFoot = [
    [
      "",
      `Grand Total (${data.length} Products)`,
      "",
      numFmt.format(sumQty),
      phpFmt.format(sumAmount),
      "",
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: tableHeaders,
    body: tableRows,
    foot: tableFoot,
    margin: { left: margin, right: margin, bottom: 15 },
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 2.8,
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 7.5,
      cellPadding: 2.4,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    footStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 2.8,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 9 },
      1: { cellWidth: 65 },
      2: { cellWidth: 35 },
      3: { halign: "right", cellWidth: 26 },
      4: { halign: "right", cellWidth: 30 },
      5: { halign: "center", cellWidth: 24 },
    },
    styles: {
      overflow: "linebreak",
    },
  });

  // 6. Draw Page Numbers and Footers across all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    doc.text(
      "VOS BI & Analytics • CRM Delivered Products Summary Report",
      margin,
      pageHeight - 8
    );

    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, {
      align: "right",
    });
  }

  // 7. Save / Trigger Download
  doc.save(filename);
}
