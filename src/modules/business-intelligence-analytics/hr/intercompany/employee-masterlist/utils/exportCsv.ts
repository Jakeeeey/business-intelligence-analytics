import { IntercompanyEmployeeMasterlistRecord } from "../types";

export function exportEmployeeMasterlistToCsv(
  records: IntercompanyEmployeeMasterlistRecord[],
  filename = "intercompany_employee_masterlist.csv"
) {
  if (!records || records.length === 0) return;

  const headers = [
    "Employee ID",
    "Biometric ID",
    "RFID",
    "Full Name",
    "Company Code",
    "Company Name",
    "Department",
    "Position",
    "Department Head",
    "Employment Status",
    "Roster Status",
    "Date of Hire",
    "Tenure (Years)",
    "Gender",
    "Civil Status",
    "Birthday",
    "Age",
    "Email",
    "Contact",
    "City",
    "Province",
    "Separation Date",
    "Separation Cause",
  ];

  const rows = records.map((r) => [
    r.employeeId,
    r.biometricId || "N/A",
    r.rfId || "N/A",
    `"${r.name.replace(/"/g, '""')}"`,
    r.companyCode,
    `"${r.companyName.replace(/"/g, '""')}"`,
    `"${r.department.replace(/"/g, '""')}"`,
    `"${r.position.replace(/"/g, '""')}"`,
    r.isDepartmentHead ? "Yes" : "No",
    `"${r.employmentStatus.replace(/"/g, '""')}"`,
    r.rosterStatus,
    r.dateOfHire || "N/A",
    r.tenureYears,
    r.gender,
    r.civilStatus,
    r.birthday || "N/A",
    r.age ?? "N/A",
    r.email || "",
    r.contact || "",
    `"${(r.city || "").replace(/"/g, '""')}"`,
    `"${(r.province || "").replace(/"/g, '""')}"`,
    r.separationDate || "N/A",
    `"${(r.separationCause || "").replace(/"/g, '""')}"`,
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

