import { PurchaseOrderItem, SupplierBreakdownItem } from "../types";

export function exportPurchaseOrdersCsv(items: PurchaseOrderItem[], filename = "purchase_orders_report.csv") {
    if (items.length === 0) return;

    const headers = [
        "PO Number",
        "Reference",
        "PO Date",
        "Supplier",
        "Branch",
        "Gross Amount (PHP)",
        "Discount (PHP)",
        "VAT (PHP)",
        "Total Amount (PHP)",
        "Received Amount (PHP)",
        "Pending Amount (PHP)",
        "Fulfillment (%)",
        "Status",
        "Items Count",
    ];

    const rows = items.map((i) => [
        `"${(i.purchaseOrderNo || "").replace(/"/g, '""')}"`,
        `"${(i.reference || "").replace(/"/g, '""')}"`,
        i.poDate,
        `"${(i.supplierName || "").replace(/"/g, '""')}"`,
        `"${(i.branchName || "").replace(/"/g, '""')}"`,
        i.grossAmount.toFixed(2),
        i.discountAmount.toFixed(2),
        i.vatAmount.toFixed(2),
        i.totalAmount.toFixed(2),
        i.receivedAmount.toFixed(2),
        i.pendingAmount.toFixed(2),
        i.fulfillmentRate.toFixed(2),
        i.status,
        i.itemsCount,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadBlob(csvContent, filename);
}

export function exportSupplierBreakdownCsv(items: SupplierBreakdownItem[], filename = "supplier_purchases_summary.csv") {
    if (items.length === 0) return;

    const headers = [
        "Supplier Name",
        "PO Count",
        "Ordered Amount (PHP)",
        "Received Amount (PHP)",
        "Pending Amount (PHP)",
        "Fulfillment Rate (%)",
    ];

    const rows = items.map((i) => [
        `"${(i.supplierName || "").replace(/"/g, '""')}"`,
        i.poCount,
        i.orderedAmount.toFixed(2),
        i.receivedAmount.toFixed(2),
        i.pendingAmount.toFixed(2),
        i.fulfillmentRate.toFixed(2),
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
