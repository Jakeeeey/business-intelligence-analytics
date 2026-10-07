import { NewCustomerItem } from "../types";

export function exportNewCustomersCsv(data: NewCustomerItem[], filename = "new_customer_report.csv") {
    if (!data || data.length === 0) return;

    const headers = [
        "ID",
        "Customer Code",
        "Customer Name",
        "Store Name",
        "Store Signage",
        "Store Type",
        "Customer Type",
        "Barangay",
        "City",
        "Province",
        "Contact Number",
        "Email",
        "Date Entered",
        "Status",
        "VAT",
        "EWT",
        "Prospect Status",
        "Assigned Salesman",
        "TIN",
    ];

    const rows = data.map((item) => [
        item.id,
        `"${(item.customerCode || "").replace(/"/g, '""')}"`,
        `"${(item.customerName || "").replace(/"/g, '""')}"`,
        `"${(item.storeName || "").replace(/"/g, '""')}"`,
        `"${(item.storeSignage || "").replace(/"/g, '""')}"`,
        `"${(item.storeType || "").replace(/"/g, '""')}"`,
        `"${(item.type || "").replace(/"/g, '""')}"`,
        `"${(item.brgy || "").replace(/"/g, '""')}"`,
        `"${(item.city || "").replace(/"/g, '""')}"`,
        `"${(item.province || "").replace(/"/g, '""')}"`,
        `"${(item.contactNumber || "").replace(/"/g, '""')}"`,
        `"${(item.customerEmail || "").replace(/"/g, '""')}"`,
        `"${(item.dateEntered || "").replace(/"/g, '""')}"`,
        item.isActive ? "Active" : "Inactive",
        item.isVAT ? "Yes" : "No",
        item.isEWT ? "Yes" : "No",
        `"${(item.prospectStatus || "").replace(/"/g, '""')}"`,
        `"${(item.salesmanName || "").replace(/"/g, '""')}"`,
        `"${(item.customerTin || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
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
