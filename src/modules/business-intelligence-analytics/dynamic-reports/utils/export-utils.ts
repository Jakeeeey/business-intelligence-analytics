import * as XLSX from "xlsx";
import { PivotResult } from "./pivot-utils";

/**
 * Exports the pivoted matrix to an Excel file.
 */
export function exportPivotToExcel(
  pivotResult: PivotResult,
  rowLabel: string,
  colLabel: string,
  fileName: string = "pivot_report.xlsx"
) {
  const { rows, columns, matrix, rowTotals, colTotals, grandTotal } = pivotResult;

  // 1. Construct the data array for XLSX
  // Header row: [RowLabel, ...Columns, "Grand Total"]
  const headerRow = [rowLabel, ...columns, "Grand Total"];
  const exportData: any[][] = [headerRow];

  // 2. Add rows
  rows.forEach((rowKey) => {
    const rowData: (string | number)[] = [rowKey];
    columns.forEach((colKey) => {
      const val = matrix[rowKey][colKey];
      rowData.push(val === true ? "✓" : val ?? 0);
    });
    // Add Row Total
    rowData.push(rowTotals[rowKey] ?? 0);
    exportData.push(rowData);
  });

  // 3. Add column totals row (Footer)
  const footerRow: (string | number)[] = ["Grand Total"];
  columns.forEach((colKey) => {
    footerRow.push(colTotals[colKey] ?? 0);
  });
  footerRow.push(grandTotal);
  exportData.push(footerRow);

  // 4. Create Workbook and Download
  const ws = XLSX.utils.aoa_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pivot View");
  
  XLSX.writeFile(wb, fileName);
}

/**
 * Helper to export raw data
 */
export function exportRawToExcel(data: any[], fileName: string = "raw_report.xlsx") {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Raw Data");
  XLSX.writeFile(wb, fileName);
}
