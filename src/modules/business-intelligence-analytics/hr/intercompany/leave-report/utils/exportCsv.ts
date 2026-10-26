import { EmployeeLeaveAndOtSummary } from "../types";

export function exportLeaveOtToCsv(
  records: EmployeeLeaveAndOtSummary[],
  filename = "intercompany_leave_overtime_report.csv"
) {
  if (!records || records.length === 0) return;

  const headers = [
    "Employee ID",
    "Full Name",
    "Company Code",
    "Company Name",
    "Department",
    "Position",
    "Total Overtime Requests",
    "Approved Overtime Requests",
    "Total Overtime Hours",
    "Approved Overtime Hours",
    "Pending Overtime Requests",
    "Rejected Overtime Requests",
    "Total Leave Requests",
    "Approved Leave Requests",
    "Approved Leave Days",
    "Pending Leave Requests",
  ];

  const rows = records.map((r) => [
    r.employeeId,
    `"${r.name.replace(/"/g, '""')}"`,
    r.companyCode,
    `"${r.companyName.replace(/"/g, '""')}"`,
    `"${r.department.replace(/"/g, '""')}"`,
    `"${r.position.replace(/"/g, '""')}"`,
    r.totalOtRequests,
    r.approvedOtRequests,
    r.totalOtHours,
    r.approvedOtHours,
    r.pendingOtRequests,
    r.rejectedOtRequests,
    r.totalLeaveRequests,
    r.approvedLeaveRequests,
    r.approvedLeaveDays,
    r.pendingLeaveRequests,
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
