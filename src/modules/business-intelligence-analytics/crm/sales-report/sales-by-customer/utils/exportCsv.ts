import { CustomerSummary } from "../types";

export function exportCustomerSalesCsv(data: CustomerSummary[], filename = "sales_by_customer_report.csv") {
    if (!data || data.length === 0) return;

    const headers = [
        "Rank",
        "Customer Name",
        "Customer Code",
        "Store Type",
        "Division",
        "Province",
        "City",
        "Transactions",
        "Total Sales (PHP)",
        "Share (%)",
        "Average Order Value (PHP)",
        "Top Supplier",
        "Top Salesman",
    ];

    const rows = data.map((item, index) => [
        index + 1,
        `"${(item.customerName || "").replace(/"/g, '""')}"`,
        `"${(item.customerCode || "").replace(/"/g, '""')}"`,
        `"${(item.storeType || "").replace(/"/g, '""')}"`,
        `"${(item.divisionName || "").replace(/"/g, '""')}"`,
        `"${(item.province || "").replace(/"/g, '""')}"`,
        `"${(item.city || "").replace(/"/g, '""')}"`,
        item.transactionCount,
        item.totalSales.toFixed(2),
        item.percentageShare.toFixed(2) + "%",
        item.averageOrderValue.toFixed(2),
        `"${(item.topSupplier || "").replace(/"/g, '""')}"`,
        `"${(item.topSalesman || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
