import { IntercompanyVacancyRecord } from "../types";

export function exportVacanciesToCsv(
  vacancies: IntercompanyVacancyRecord[],
  filename = "intercompany_vacancies_report.csv"
): void {
  if (!vacancies || vacancies.length === 0) {
    alert("No vacancy records available to export.");
    return;
  }

  const headers = [
    "Request No",
    "Company Code",
    "Company Name",
    "Position Title",
    "Department",
    "Division",
    "Headcount Needed",
    "Hired Count",
    "Open Vacancies",
    "Fulfillment (%)",
    "Purpose",
    "Replacement Name",
    "Employment Type",
    "Rate (PHP)",
    "Total Allocated Budget",
    "Urgency Level",
    "Aging (Days)",
    "Status",
    "Approved Date",
    "Date Created",
  ];

  const escapeCsv = (str: string | number | null | undefined): string => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = vacancies.map((v) => [
    escapeCsv(v.requestNo),
    escapeCsv(v.companyCode),
    escapeCsv(v.companyName),
    escapeCsv(v.position),
    escapeCsv(v.department),
    escapeCsv(v.division),
    escapeCsv(v.totalNeeded),
    escapeCsv(v.hiredCount),
    escapeCsv(v.openVacancies),
    escapeCsv(`${v.fulfillmentRate}%`),
    escapeCsv(v.purpose),
    escapeCsv(v.replacementName || "-"),
    escapeCsv(v.employmentType),
    escapeCsv(v.rate),
    escapeCsv(v.totalAllocatedBudget),
    escapeCsv(v.urgency),
    escapeCsv(v.agingDays),
    escapeCsv(v.status),
    escapeCsv(v.approvedAtFormatted || "-"),
    escapeCsv(v.createdAtFormatted),
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

