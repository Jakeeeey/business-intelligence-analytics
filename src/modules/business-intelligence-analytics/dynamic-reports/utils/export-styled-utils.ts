import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

/**
 * Premium Export using ExcelJS for full styling support.
 * This provides colors, borders, and professional formatting.
 */
export interface ExportRow {
  depth: number;
  getValue: (colId: string) => unknown;
}

export interface ExportColumn {
  id: string;
  header: string;
}

export interface ExportHeader {
  id: string;
  header: string;
  colSpan: number;
  isPlaceholder: boolean;
}

export async function exportStyledPivotToExcel(
  visibleRows: ExportRow[], 
  columns: ExportColumn[], 
  fileName: string = "pivoted_report.xlsx",
  footerRow?: Record<string, unknown>,
  multiLevelHeaders?: ExportHeader[][]
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Pivot Export");
  
  // Set outline properties for "Accordion" style grouping
  worksheet.properties.outlineProperties = {
    summaryBelow: false,
    summaryRight: false,
  };

  // 1. Clean up headers to match Web UI exactly
  const cleanHeader = (header: string) => {
    let clean = header.toString();
    
    // First, convert underscores to spaces and uppercase
    clean = clean.replace(/_/g, ' ').trim().toUpperCase();
    
    // Explicit Mapping for Metrics to match Web UI
    if (clean.includes('TOTALAMOUNT')) return 'TOTAL AMOUNT (SUM)';
    if (clean.includes('PRICE')) return 'PRICE (SUM)';
    if (clean === 'GT' || clean === 'GRAND TOTAL' || clean === 'HORIZONTAL GRAND TOTAL') return 'GRAND TOTAL';
    if (clean === 'ROW LABELS' || clean === 'ROWLABELS') return 'ROW LABELS';
    
    // Finally, remove technical prefixes (COL, HORIZONTAL, GT)
    clean = clean.replace(/^(COL|HORIZONTAL|GT)\s+/gi, '');
    clean = clean.replace(/\b(COL|HORIZONTAL|GT)\b/gi, '');
    
    return clean.trim().toUpperCase();
  };

  // 2. Render Headers
  if (multiLevelHeaders && multiLevelHeaders.length > 0) {
    multiLevelHeaders.forEach((level) => {
      const rowValues: (string | number | null)[] = [];
      let currentCol = 1;
      const merges: { s: number, e: number }[] = [];

      level.forEach((h) => {
        rowValues.push(cleanHeader(h.header));
        if (h.colSpan > 1) {
          merges.push({ s: currentCol, e: currentCol + h.colSpan - 1 });
          for (let i = 1; i < h.colSpan; i++) rowValues.push(null);
          currentCol += h.colSpan;
        } else {
          currentCol++;
        }
      });

      const headerRow = worksheet.addRow(rowValues);
      headerRow.height = 25; // Compact header
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9, name: 'Segoe UI' };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF334155' } },
          left: { style: 'thin', color: { argb: 'FF334155' } },
          right: { style: 'thin', color: { argb: 'FF334155' } },
          bottom: { style: 'thin', color: { argb: 'FF334155' } }
        };
      });

      // Apply horizontal merges
      merges.forEach(m => {
        worksheet.mergeCells(headerRow.number, m.s, headerRow.number, m.e);
      });
    });

    // Vertical merge for placeholders (like ROW LABELS)
    const firstLevel = multiLevelHeaders[0];
    const rowCount = multiLevelHeaders.length;
    firstLevel.forEach((h, idx) => {
      if (h.isPlaceholder || h.header === 'ROW LABELS' || h.header === 'REPORT DIMENSIONS') {
        worksheet.mergeCells(1, idx + 1, rowCount, idx + 1);
      }
    });
  } else {
    const headers = columns.map(col => cleanHeader(col.header || col.id));
    const headerRow = worksheet.addRow(headers);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9, name: 'Segoe UI' };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
  }

  // 3. Add Data Rows
  visibleRows.forEach((row) => {
    const dataRowValues = columns.map(col => {
      const val = row.getValue(col.id);
      return typeof val === 'number' ? val : (val || "");
    });
    const excelRow = worksheet.addRow(dataRowValues);
    excelRow.height = 18; // High-density row height
    excelRow.outlineLevel = row.depth; // Enable grouping buttons in Excel
    
    // Zebra Striping & Full Borders
    excelRow.eachCell((cell, colIndex) => {
      const colId = columns[colIndex - 1].id;
      const isRowLabel = colId === 'rowLabels';
      const depth = row.depth || 0;

      // Color coding based on hierarchy depth (Subtle Premium Theme)
      let bgColor = 'FFFFFFFF'; // Default White
      let textColor = 'FF1E293B'; // Slate-800
      
      if (depth === 0) {
        bgColor = 'FFE0E7FF';   // Level 0: Indigo 100
        textColor = 'FF1E1B4B'; // Indigo 950
      } else if (depth === 1) {
        bgColor = 'FFCCFBF1';   // Level 1: Teal 100
        textColor = 'FF134E4A'; // Teal 950
      }

      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.font = { 
        bold: depth === 0, 
        size: 8.5, 
        color: { argb: textColor }, 
        name: 'Segoe UI' 
      };
      
      cell.alignment = { 
        vertical: 'middle', 
        horizontal: isRowLabel ? 'left' : 'right',
        indent: isRowLabel ? depth * 2 : 0
      };

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };

      // Number formatting
      if (typeof cell.value === 'number') {
        cell.numFmt = '#,##0.00';
      }
    });
  });

  // 4. Add Footer/Grand Total if provided
  if (footerRow) {
    const footerValues = columns.map((col, idx) => {
      if (idx === 0) return "GRAND TOTAL";
      const val = footerRow[col.id];
      return typeof val === 'number' ? val : (val || "");
    });

    const totalRow = worksheet.addRow(footerValues);
    totalRow.height = 28; // Slightly taller for the SUMMARY tag
    totalRow.eachCell((cell, colIndex) => {
      cell.font = { bold: true, color: { argb: 'FF0D9488' }, size: 9, name: 'Segoe UI' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDFA' } };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF0D9488' } },
        bottom: { style: 'medium', color: { argb: 'FF0D9488' } },
        left: { style: 'thin', color: { argb: 'FF0D9488' } },
        right: { style: 'thin', color: { argb: 'FF0D9488' } }
      };
      
      if (colIndex === 1) {
        // Multi-line rich text for the "SUMMARY / GRAND TOTAL" feel
        cell.value = {
          richText: [
            { font: { size: 7, color: { argb: 'FF94A3B8' }, name: 'Segoe UI' }, text: 'SUMMARY\n' },
            { font: { bold: true, size: 9, color: { argb: 'FF0D9488' }, name: 'Segoe UI' }, text: 'GRAND TOTAL' }
          ]
        };
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      } else if (typeof cell.value === 'number') {
        cell.numFmt = '#,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    });
  }

  // 5. Auto-size columns with a compact limit
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      let val = 10;
      if (cell.value && typeof cell.value === 'object' && 'richText' in cell.value) {
        val = 15; // Buffer for rich text
      } else {
        val = cell.value ? cell.value.toString().length : 10;
      }
      if (val > maxLength) maxLength = val;
    });
    column.width = Math.min(Math.max(maxLength + 2, 12), 40);
  });

  // 6. Generate and save file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, fileName);
}

/**
 * Premium Export for Raw Data (Flat Tables)
 */
export async function exportStyledRawToExcel(
  data: Record<string, unknown>[],
  columns: string[],
  fileName: string = "raw_data_report.xlsx"
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Data Export");

  // 1. Clean Header Formatter
  const formatHeader = (key: string): string => {
    if (!key) return "";
    const result = key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
    return result.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ').toUpperCase();
  };

  // 2. Add Header Row
  const headers = columns.map(col => formatHeader(col));
  const headerRow = worksheet.addRow(headers);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9, name: 'Segoe UI' };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF334155' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'thin', color: { argb: 'FF334155' } }
    };
  });

  // 3. Add Data Rows
  data.forEach((row, rowIndex) => {
    const rowValues = columns.map(col => {
      const val = row[col];
      return val === null || val === undefined ? "-" : val;
    });
    const excelRow = worksheet.addRow(rowValues);
    excelRow.height = 18;

    const isEven = rowIndex % 2 === 0;
    excelRow.eachCell((cell) => {
      cell.fill = { 
        type: 'pattern', 
        pattern: 'solid', 
        fgColor: { argb: isEven ? 'FFF1F5F9' : 'FFFFFFFF' } 
      };
      cell.font = { size: 8.5, name: 'Segoe UI', color: { argb: 'FF1E293B' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
      
      if (typeof cell.value === 'number') {
        cell.numFmt = '#,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
      }
    });
  });

  // 4. Auto-size columns
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const val = cell.value ? cell.value.toString().length : 10;
      if (val > maxLength) maxLength = val;
    });
    column.width = Math.min(Math.max(maxLength + 4, 15), 50);
  });

  // 5. Generate and save file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, fileName);
}
