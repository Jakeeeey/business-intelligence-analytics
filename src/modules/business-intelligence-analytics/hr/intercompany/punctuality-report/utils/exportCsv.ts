import { IntercompanyPunctualityRecord } from "../types";

export function exportPunctualityToCsv(
  records: IntercompanyPunctualityRecord[],
  filename = "intercompany_punctuality_report.csv"
) {
  if (!records || records.length === 0) return;

  const headers = [
    "Date",
    "Employee ID",
    "Full Name",
    "Company Code",
    "Company Name",
    "Department",
    "Position",
    "Scheduled Time",
    "Actual Time In",
    "Actual Time Out",
    "Punctuality Status",
    "Delay (Minutes)",
    "Undertime (Minutes)",
    "Filed Leave",
    "Leave Type",
    "Email",
    "Contact",
  ];

  const rows = records.map((r) => [
    r.logDate,
    r.employeeId,
    `"${r.name.replace(/"/g, '""')}"`,
    r.companyCode,
    `"${r.companyName.replace(/"/g, '""')}"`,
    `"${r.department.replace(/"/g, '""')}"`,
    `"${r.position.replace(/"/g, '""')}"`,
    r.scheduledTimeIn,
    r.timeIn || "--:--",
    r.timeOut || "--:--",
    r.punctualityStatus,
    r.delayMinutes,
    r.undertimeMinutes,
    r.hasFiledLeave ? (r.leaveStatus === "approved" ? "Approved Leave" : "Pending Leave") : "No",
    r.leaveType ? `"${r.leaveType.replace(/"/g, '""')}"` : "N/A",
    r.email || "",
    r.contact || "",
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
