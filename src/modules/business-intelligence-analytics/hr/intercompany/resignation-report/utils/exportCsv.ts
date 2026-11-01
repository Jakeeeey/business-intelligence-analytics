import { IntercompanyResignationRecord } from "../types";

export function exportResignationsToCsv(
  records: IntercompanyResignationRecord[],
  filename = "intercompany_resignation_report.csv"
): void {
  const headers = [
    "Record ID",
    "Company Name",
    "Company Code",
    "Employee ID",
    "Employee Name",
    "Position",
    "Department",
    "Email",
    "Contact",
    "Filing Date",
    "Effective Resignation Date",
    "Notice Period (Days)",
    "Notice Compliance",
    "Reason Category",
    "Reason Statement",
    "Status",
    "HR Remarks",
    "Reviewed By",
    "Reviewed At",
    "Date of Hire",
    "Tenure at Resignation",
    "Has Attachment",
  ];

  const escapeCsv = (str?: string | number | null): string => {
    if (str === null || str === undefined) return '""';
    const clean = String(str).replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = records.map((r) => [
    escapeCsv(r.id),
    escapeCsv(r.companyName),
    escapeCsv(r.companyCode),
    escapeCsv(r.employeeId),
    escapeCsv(r.name),
    escapeCsv(r.position),
    escapeCsv(r.department),
    escapeCsv(r.email),
    escapeCsv(r.contact),
    escapeCsv(r.filingDateFormatted),
    escapeCsv(r.resignationDateFormatted),
    escapeCsv(r.noticeDays),
    escapeCsv(r.noticeCategory),
    escapeCsv(r.reasonCategory),
    escapeCsv(r.reason),
    escapeCsv(r.status),
    escapeCsv(r.hrRemarks || "-"),
    escapeCsv(r.reviewerName || "-"),
    escapeCsv(r.reviewedAtFormatted || "-"),
    escapeCsv(r.dateOfHire || "-"),
    escapeCsv(r.tenureFormatted || "-"),
    escapeCsv(r.attachmentUrl ? "Yes" : "No"),
  ]);

  const csvContent =
    "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");

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

