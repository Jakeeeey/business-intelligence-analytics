import { IntercompanyEmployeeRecord } from "../types";

export function exportIntercompanyAttendanceCsv(
  records: IntercompanyEmployeeRecord[],
  filename = "intercompany_attendance_report.csv"
): void {
  if (!records || records.length === 0) return;

  const headers = [
    "Employee ID",
    "Full Name",
    "Company Code",
    "Company Name",
    "Department",
    "Position",
    "Attendance Status",
    "Filed Leave",
    "Leave Status",
    "Leave Type",
    "Leave Dates",
    "Leave Reason",
    "Time In",
    "Time Out",
    "Log Date",
    "Approval Status",
    "Email",
    "Contact Number",
    "Gender",
  ];

  const escapeField = (val: unknown): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = records.map((r) => [
    escapeField(r.employeeId),
    escapeField(r.name),
    escapeField(r.companyCode),
    escapeField(r.companyName),
    escapeField(r.department),
    escapeField(r.position),
    escapeField(r.attendanceStatus),
    escapeField(r.hasFiledLeave ? "Yes" : "No"),
    escapeField(r.leaveStatus ? (r.leaveStatus === "approved" ? "Approved" : "Pending") : "--"),
    escapeField(r.leaveType || "--"),
    escapeField(r.leaveDates || "--"),
    escapeField(r.leaveReason || "--"),
    escapeField(r.timeIn || "--:--"),
    escapeField(r.timeOut || "--:--"),
    escapeField(r.logDate),
    escapeField(r.approveStatus || "--"),
    escapeField(r.email || "--"),
    escapeField(r.contact || "--"),
    escapeField(r.gender || "--"),
  ]);

  const csvContent = [headers.map((h) => `"${h}"`).join(","), ...rows.map((row) => row.join(","))].join("\r\n");

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
