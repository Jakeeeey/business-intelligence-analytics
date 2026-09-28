import { CollectionReceiptItem, SalesmanComparisonItem } from "../types";

export function exportSalesmenComparisonCsv(items: SalesmanComparisonItem[], filename = "salesmen_collection_vs_sales.csv") {
    if (items.length === 0) return;

    const headers = [
        "Salesman Name",
        "Total Sales (PHP)",
        "Total Collections (PHP)",
        "Variance (PHP)",
        "Collection Efficiency (%)",
        "Total Receipts",
    ];

    const rows = items.map((i) => [
        `"${(i.salesmanName || "").replace(/"/g, '""')}"`,
        i.sales.toFixed(2),
        i.collections.toFixed(2),
        i.variance.toFixed(2),
        i.efficiency.toFixed(2),
        i.receiptsCount,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadBlob(csvContent, filename);
}

export function exportReceiptsCsv(items: CollectionReceiptItem[], filename = "collection_receipts.csv") {
    if (items.length === 0) return;

    const headers = [
        "Doc No",
        "Receipt No",
        "Collection Date",
        "Salesman",
        "Collected By",
        "Payment Method",
        "Account Type",
        "Amount (PHP)",
        "Remarks",
    ];

    const rows = items.map((i) => [
        `"${(i.docNo || "").replace(/"/g, '""')}"`,
        `"${(i.receiptNo || "").replace(/"/g, '""')}"`,
        i.collectionDate,
        `"${(i.salesmanName || "").replace(/"/g, '""')}"`,
        `"${(i.collectedBy || "").replace(/"/g, '""')}"`,
        `"${(i.paymentMethod || "").replace(/"/g, '""')}"`,
        `"${(i.accountTitle || "").replace(/"/g, '""')}"`,
        i.amount.toFixed(2),
        `"${(i.remarks || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
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
