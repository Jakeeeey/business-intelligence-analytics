import type { SalesReportRow } from "../types";

function esc(v: any) {
  const s = (v ?? "").toString();
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportSalesReportCsv(rows: SalesReportRow[], filename = "sales-report.csv") {
  const headers = [
    "Classification",
    "Customer Name",
    "Freq 1 (1-15) Allocated SO",
    "Freq 1 SO Date",
    "Freq 1 Net Sales SI",
    "Freq 1 SI Date",
    "Freq 2 (16-end) Allocated SO",
    "Freq 2 SO Date",
    "Freq 2 Net Sales SI",
    "Freq 2 SI Date",
    "Total Net Sales (SI)",
  ];

  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        esc(r.classification),
        esc(r.customer_name),
        esc(r.so_1_15),
        esc(r.so_1_15_date),
        esc(r.si_1_15),
        esc(r.si_1_15_date),
        esc(r.so_16_eom),
        esc(r.so_16_eom_date),
        esc(r.si_16_eom),
        esc(r.si_16_eom_date),
        esc(r.total_si),
      ].join(","),
    ),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}
