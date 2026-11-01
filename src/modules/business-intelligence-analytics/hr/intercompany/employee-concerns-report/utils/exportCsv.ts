import { IntercompanyConcernRecord } from "../types";

export function exportConcernsToCsv(
  records: IntercompanyConcernRecord[],
  filename = "intercompany_employee_concerns_report.csv"
) {
  if (!records || records.length === 0) return;

  const headers = [
    "Concern ID",
    "Date Submitted",
    "Company Code",
    "Company Name",
    "Department",
    "Employee ID",
    "Employee Name",
    "Position",
    "Is Anonymous",
    "Subject of Concern",
    "Category",
    "Status",
    "Concern Details",
    "Email",
    "Contact",
  ];

  const rows = records.map((r) => [
    r.concernId,
    r.createdAtFormatted,
    r.companyCode,
    `"${r.companyName.replace(/"/g, '""')}"`,
    `"${r.department.replace(/"/g, '""')}"`,
    r.isAnonymous ? "ANONYMOUS" : r.employeeId,
    `"${(r.isAnonymous ? "Anonymous Employee" : r.name).replace(/"/g, '""')}"`,
    `"${(r.isAnonymous ? "Undisclosed" : r.position).replace(/"/g, '""')}"`,
    r.isAnonymous ? "Yes" : "No",
    `"${r.subjectOfConcern.replace(/"/g, '""')}"`,
    `"${r.category.replace(/"/g, '""')}"`,
    r.status,
    `"${r.concern.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`,
    r.isAnonymous ? "" : r.email || "",
    r.isAnonymous ? "" : r.contact || "",
  ]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

