import * as XLSX from "xlsx";
import { ReportData } from "../types";

/**
 * Enhanced Excel export that supports flat JSON data.
 * In TanStack V8, the table model can be quite complex to flatten, 
 * so we export the current filtered and sorted flat data.
 */
export function exportRawToExcel(data: ReportData[], fileName: string = "report.xlsx"): void {
  if (!data || data.length === 0) return;

  // 1. Create a worksheet from the JSON data
  const ws = XLSX.utils.json_to_sheet(data);

  // 2. Add some styling (standard auto-width logic is limited in XLSX, but we can set column widths)
  const colWidths = Object.keys(data[0]).map(key => ({
    wch: Math.max(key.length, 15)
  }));
  ws["!cols"] = colWidths;

  // 3. Create Workbook and Download
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data Export");
  
  XLSX.writeFile(wb, fileName);
}

interface PivotRow {
  getValue: (id: string) => unknown;
}

interface PivotColumn {
  id: string;
  header: string;
}

/**
 * Specifically exports the current visible state of a TanStack Table.
 * This is used when we want to capture the pivoted/grouped view.
 */
export function exportPivotedViewToExcel(
  visibleRows: PivotRow[], 
  columns: PivotColumn[], 
  fileName: string = "pivoted_report.xlsx",
  footerRow?: (string | number)[]
): void {
  // Clean up headers for a professional Excel feel
  const cleanHeader = (header: string) => {
    const clean = header.replace(/(_totalAmount|_amount|_qty|_count|_sum|_avg|_min|_max)/gi, '');
    if (clean.toLowerCase() === 'gt') return 'GRAND TOTAL';
    return clean
      .replace(/_/g, ' ')
      .trim()
      .toUpperCase();
  };

  const headers = columns.map(col => cleanHeader(col.header || col.id));
  
  // Construct data rows by traversing the visible rows
  const exportData = visibleRows.map(row => {
    return columns.map(col => {
      const val = row.getValue(col.id);
      // Format numbers nicely if they are numeric
      if (typeof val === 'number') return val;
      return typeof val === 'object' ? JSON.stringify(val) : val;
    });
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...exportData]);

  // Append Footer Row if provided
  if (footerRow && footerRow.length > 0) {
    XLSX.utils.sheet_add_aoa(ws, [footerRow], { origin: -1 });
  }

  // Set column widths for a premium experience
  const colWidths = headers.map(h => ({ wch: Math.max(h.length, 12) }));
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pivot Export");
  XLSX.writeFile(wb, fileName);
}
