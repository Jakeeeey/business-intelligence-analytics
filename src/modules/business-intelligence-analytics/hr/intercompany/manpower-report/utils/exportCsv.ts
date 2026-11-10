import { IntercompanyManpowerRecord } from "../types";

export function exportManpowerToCsv(
  records: IntercompanyManpowerRecord[],
  filename = "intercompany_manpower_report.csv"
): void {
  const headers = [
    "Request ID",
    "Request No",
    "Company Name",
    "Company Code",
    "Position",
    "Department",
    "Division",
    "Headcount Needed",
    "Hired Count",
    "Fulfillment Rate (%)",
    "Purpose",
    "Replacement Name",
    "Employment Type",
    "Rate (PHP)",
    "Total Estimated Budget (PHP)",
    "Status",
    "Requested By",
    "Date Filed",
    "Approved By",
    "Approved Date",
    "Reason / Justification",
    "Qualification",
    "Qualification Details",
    "Candidate Recommendations Count",
  ];

  const escapeCsv = (str?: string | number | null): string => {
    if (str === null || str === undefined) return '""';
    const clean = String(str).replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = records.map((r) => [
    escapeCsv(r.id),
    escapeCsv(r.requestNo),
    escapeCsv(r.companyName),
    escapeCsv(r.companyCode),
    escapeCsv(r.position),
    escapeCsv(r.department),
    escapeCsv(r.division),
    escapeCsv(r.noManpowerNeeded),
    escapeCsv(r.hiredCount),
    escapeCsv(`${r.fulfillmentRate}%`),
    escapeCsv(r.purpose),
    escapeCsv(r.replacementName || "-"),
    escapeCsv(r.employmentType),
    escapeCsv(r.rate),
    escapeCsv(r.totalEstimatedBudget),
    escapeCsv(r.status),
    escapeCsv(r.requestedByName || "-"),
    escapeCsv(r.createdAtFormatted),
    escapeCsv(r.approvedByName || "-"),
    escapeCsv(r.approvedAtFormatted || "-"),
    escapeCsv(r.reasonJustification || "-"),
    escapeCsv(r.qualification || "Any"),
    escapeCsv(r.qualificationDescription || "-"),
    escapeCsv(r.recommendations.length),
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

