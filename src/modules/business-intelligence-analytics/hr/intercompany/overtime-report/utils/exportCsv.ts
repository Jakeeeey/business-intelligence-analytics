import { EmployeeOvertimeSummary, IntercompanyOvertimeRecord } from "../types";

export function exportOvertimeEmployeesToCsv(
  records: EmployeeOvertimeSummary[],
  filename = "intercompany_overtime_employees.csv"
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
    "Approval Rate (%)",
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
    `${r.approvalRate}%`,
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportDetailedOvertimeToCsv(
  records: IntercompanyOvertimeRecord[],
  filename = "intercompany_overtime_requests.csv"
) {
  if (!records || records.length === 0) return;

  const headers = [
    "Request Date",
    "Employee ID",
    "Full Name",
    "Company Code",
    "Company Name",
    "Department",
    "Position",
    "OT Window (From - To)",
    "Duration (Minutes)",
    "Duration (Hours)",
    "Status",
    "Purpose / Reason",
    "Filed At",
    "Approved At",
  ];

  const rows = records.map((r) => [
    r.requestDate,
    r.employeeId,
    `"${r.name.replace(/"/g, '""')}"`,
    r.companyCode,
    `"${r.companyName.replace(/"/g, '""')}"`,
    `"${r.department.replace(/"/g, '""')}"`,
    `"${r.position.replace(/"/g, '""')}"`,
    `"${r.otFrom || "--:--"} - ${r.otTo || "--:--"}"`,
    r.durationMinutes,
    r.durationHours,
    r.status.toUpperCase(),
    `"${(r.purpose || "").replace(/"/g, '""')}"`,
    r.filedAt ? new Date(r.filedAt).toLocaleDateString() : "",
    r.approvedAt ? new Date(r.approvedAt).toLocaleDateString() : "",
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
