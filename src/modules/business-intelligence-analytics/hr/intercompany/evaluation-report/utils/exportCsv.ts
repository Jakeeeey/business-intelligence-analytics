import { IntercompanyEvaluationRecord } from "../types";

export function exportEvaluationsToCsv(
  records: IntercompanyEvaluationRecord[],
  filename = "intercompany_evaluation_report.csv"
): void {
  const headers = [
    "Evaluation ID",
    "Company Name",
    "Company Code",
    "Employee ID",
    "Employee Name",
    "Position",
    "Department",
    "Email",
    "Contact",
    "Evaluation Type",
    "Evaluation Date",
    "Total Score",
    "Rating Band",
    "Result",
    "Evaluator Name",
    "Evaluator Comments",
    "Career Milestone Status",
    "Regularized Date",
    "Separation Type",
    "Tenure at Company",
    "Criteria Items Count",
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
    escapeCsv(r.evalType),
    escapeCsv(r.evaluationDateFormatted),
    escapeCsv(r.totalScore),
    escapeCsv(r.ratingBand),
    escapeCsv(r.result),
    escapeCsv(r.evaluatorName || "-"),
    escapeCsv(r.evaluatorComments || "-"),
    escapeCsv(r.tracking?.careerStatus || "ACTIVE"),
    escapeCsv(r.tracking?.regularizedAtFormatted || "-"),
    escapeCsv(r.tracking?.separationType || "-"),
    escapeCsv(r.tenureFormatted || "-"),
    escapeCsv(r.items.length),
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

