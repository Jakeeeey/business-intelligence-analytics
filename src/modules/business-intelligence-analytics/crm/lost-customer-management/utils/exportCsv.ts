import { LostCustomerRecord } from "../types";

export function exportLostCustomersCsv(
  items: LostCustomerRecord[],
  filename = "lost_customers_report.csv"
) {
  if (items.length === 0) return;

  const headers = [
    "Customer Code",
    "Customer Name",
    "Tagging",
    "Days with No Sales",
    "Last Sales Date",
    "Historical Sales (PHP)",
    "Salesman",
    "Branch",
    "Contact Number",
    "Email",
  ];

  const rows = items.map((i) => [
    `"${(i.customerCode || "").replace(/"/g, '""')}"`,
    `"${(i.customerName || "").replace(/"/g, '""')}"`,
    `"${(i.tagging || "").replace(/"/g, '""')}"`,
    i.minDaysNoSales,
    i.lastSalesDate ? `"${i.lastSalesDate}"` : "N/A",
    i.totalHistoricalSales.toFixed(2),
    `"${(i.salesmanName || "").replace(/"/g, '""')}"`,
    `"${(i.branchName || "").replace(/"/g, '""')}"`,
    `"${(i.contactNumber || "").replace(/"/g, '""')}"`,
    `"${(i.email || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
    "\n"
  );
  downloadBlob(csvContent, filename);
}

function downloadBlob(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
