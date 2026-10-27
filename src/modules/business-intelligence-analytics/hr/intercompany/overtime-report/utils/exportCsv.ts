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
    "Actual Overtime (Hours)",
    "Filed Overtime (Hours)",
    "Actual Approved Overtime (Hours)",
    "Total Overtime Requests",
    "Approved Overtime Requests",
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
    r.totalActualOtHours,
    r.totalFiledOtHours,
    r.totalApprovedOtHours,
    r.totalOtRequests,
    r.approvedOtRequests,
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
    "Sched Timeout",
    "Actual Punch Out",
    "Actual Overtime (Minutes)",
    "Actual Overtime (Hours)",
    "Filed Overtime (Minutes)",
    "Filed Overtime (Hours)",
    "Actual Approved Overtime (Minutes)",
    "Actual Approved Overtime (Hours)",
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
    r.schedTimeout ? r.schedTimeout.substring(0, 5) : (r.otFrom ? r.otFrom.substring(0, 5) : "--:--"),
    r.actualTimeOut ? r.actualTimeOut.substring(0, 5) : "--:--",
    r.actualOtMinutes,
    r.actualOtHours,
    r.filedOtMinutes,
    r.filedOtHours,
    r.actualApprovedOtMinutes,
    r.actualApprovedOtHours,
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
