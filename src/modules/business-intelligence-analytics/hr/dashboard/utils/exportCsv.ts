import { EmployeeRecord, DepartmentHeadcount } from "../types";

export function exportEmployeesCsv(
  items: EmployeeRecord[],
  filename = "employees_directory.csv"
) {
  if (items.length === 0) return;

  const headers = [
    "Employee ID",
    "Full Name",
    "Position",
    "Department",
    "Employment Status",
    "Date of Hire",
    "Tenure (Years)",
    "Gender",
    "Email",
    "Contact Number",
    "City",
    "Province",
    "Is Dept Head",
  ];

  const rows = items.map((i) => [
    `"${(i.employeeId || "").replace(/"/g, '""')}"`,
    `"${(i.name || "").replace(/"/g, '""')}"`,
    `"${(i.position || "").replace(/"/g, '""')}"`,
    `"${(i.department || "").replace(/"/g, '""')}"`,
    `"${(i.employmentStatus || "").replace(/"/g, '""')}"`,
    i.dateOfHire ? `"${i.dateOfHire}"` : "N/A",
    i.tenureYears,
    `"${(i.gender || "").replace(/"/g, '""')}"`,
    `"${(i.email || "").replace(/"/g, '""')}"`,
    `"${(i.contact || "").replace(/"/g, '""')}"`,
    `"${(i.city || "").replace(/"/g, '""')}"`,
    `"${(i.province || "").replace(/"/g, '""')}"`,
    i.isDepartmentHead ? "Yes" : "No",
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  downloadBlob(csvContent, filename);
}

export function exportDepartmentHeadcountCsv(
  items: DepartmentHeadcount[],
  filename = "department_headcount_summary.csv"
) {
  if (items.length === 0) return;

  const headers = [
    "Department",
    "Total Headcount",
    "Workforce Percentage (%)",
  ];

  const rows = items.map((i) => [
    `"${(i.department || "").replace(/"/g, '""')}"`,
    i.headcount,
    `${i.percentage}%`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  downloadBlob(csvContent, filename);
}

// Backward-compatible alias for cached bundles
export const exportAttendanceCsv = exportEmployeesCsv;

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
