import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";

import type { DisbursementRecord, ExpenseFilters, ExportFormat } from "../type";
import { PdfEngine } from "@/components/pdf-layout-design/PdfEngine";
import type {
  PdfConfig,
  CompanyData,
} from "@/components/pdf-layout-design/types";
import {
  pdfTemplateService,
  type PdfTemplate,
} from "@/components/pdf-layout-design/services/pdf-template";

// Prefer template label used by the project's PDF templates collection
const TEMPLATE_NAME = "Letter - Portrait";

export type ExportOptions = {
  records: DisbursementRecord[];
  filters: ExpenseFilters;
  format: ExportFormat;
  groupBy?: "coa" | "division";
  userName?: string;
  preview?: boolean; // when true return Blob for preview
  templateName?: string; // optional template override
};

const fmtCurrency = (n = 0) =>
  Number(n || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtDate = (d?: string) => {
  if (!d) return "";
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return String(d);
  }
};

/** Group records by key preserving insertion order */
const groupRecords = (rows: DisbursementRecord[], by: "coa" | "division") => {
  const map = new Map<string, DisbursementRecord[]>();
  for (const r of rows) {
    const key =
      by === "coa"
        ? r.coaTitle || "(Unspecified)"
        : r.divisionName || "(Unspecified)";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return Array.from(map.entries()).map(([key, rows]) => ({ key, rows }));
};

export async function exportToPDF(
  opts: ExportOptions,
): Promise<void | Blob | null | undefined> {
  const {
    records = [],
    filters,
    format = "detailed",
    groupBy = "coa",
    userName = "System",
    preview = false,
    templateName = TEMPLATE_NAME,
  } = opts;

  function formatDateTime(value: Date): string {
    return value.toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function normalizeFilterValue(
    value: string | string[] | undefined,
  ): string | null {
    if (!value) return null;
    if (Array.isArray(value)) {
      const normalized = value
        .map((v) => String(v).trim())
        .filter((v) => v && v.toLowerCase() !== "all");
      return normalized.length > 0 ? normalized.join(", ") : null;
    }
    const trimmed = String(value).trim();
    if (!trimmed || trimmed.toLowerCase() === "all") return null;
    return trimmed;
  }

  function buildActiveFiltersText(filters?: ExpenseFilters): string {
    if (!filters) return "All";
    const parts: string[] = [];
    const employees = normalizeFilterValue(
      filters.employees as unknown as string | string[] | undefined,
    );
    if (employees) parts.push(`Employees: ${employees}`);
    const divisions = normalizeFilterValue(
      filters.divisions as unknown as string | string[] | undefined,
    );
    if (divisions) parts.push(`Divisions: ${divisions}`);
    const enc = normalizeFilterValue(
      filters.encoders as unknown as string | string[] | undefined,
    );
    if (enc) parts.push(`Encoders: ${enc}`);
    const coas = normalizeFilterValue(
      filters.coaAccounts as unknown as string | string[] | undefined,
    );
    if (coas) parts.push(`Account(s): ${coas}`);
    const tx = normalizeFilterValue(
      filters.transactionTypes as unknown as string | string[] | undefined,
    );
    if (tx) parts.push(`Transaction Type(s): ${tx}`);
    const stats = normalizeFilterValue(
      filters.statuses as unknown as string | string[] | undefined,
    );
    if (stats) parts.push(`Statuses: ${stats}`);
    return parts.length > 0 ? parts.join("\n") : "All";
  }

  // Fetch company profile used by the PDF template header
  async function fetchCompanyData(): Promise<CompanyData | null> {
    try {
      const res = await fetch("/api/pdf/company", { credentials: "include" });
      if (!res.ok) return null;

      const result = (await res.json()) as {
        data?: CompanyData[] | CompanyData;
      };
      if (Array.isArray(result.data)) return result.data[0] ?? null;
      return result.data ?? null;
    } catch {
      return null;
    }
  }

  function resolveTemplateName(templates: PdfTemplate[]): string {
    const exact = templates.find((t) => t.name === TEMPLATE_NAME);
    if (exact) return exact.name;

    const caseInsensitive = templates.find(
      (t) => t.name.toLowerCase() === TEMPLATE_NAME.toLowerCase(),
    );
    if (caseInsensitive) return caseInsensitive.name;

    const byConfig = templates.find(
      (t) =>
        t.config?.paperSize === "Letter" &&
        t.config?.orientation === "portrait",
    );
    if (byConfig) return byConfig.name;

    return TEMPLATE_NAME;
  }

  // Prevent running on the server
  if (typeof window === "undefined") {
    console.warn("exportToPDF: called on server, skipping PDF generation");
    return null;
  }

  console.log("[exportToPDF] start", {
    format,
    groupBy,
    records: records.length,
    templateName,
  });

  try {
    // Renderer that builds the table body inside the provided template frame
    const renderBody = async (
      doc: jsPDF,
      startY: number,
      config: PdfConfig,
    ) => {
      const pageWidth = doc.internal.pageSize.getWidth();
      const margins = config?.margins || {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10,
      };

      const leftX = margins.left ?? 10;
      const rightX = pageWidth - (margins.right ?? 10);

      // Header area (small summary above table)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      // center title similar to screenshot
      doc.text("Disbursement Report", pageWidth / 2, startY + 6, {
        align: "center",
      });

      // Header: active filters (left) and generated info (right)
      const activeFiltersText = buildActiveFiltersText(filters);
      const usableWidth =
        pageWidth - (margins.left ?? 10) - (margins.right ?? 10);
      const filterLines = doc.splitTextToSize(
        activeFiltersText,
        usableWidth * 0.6,
      );

      // Filters label (bold) and rows (normal)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text("Filters:", leftX, startY + 14, { baseline: "top" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);
      // print filter rows starting slightly below the label
      const filtersStartY = startY + 18;
      doc.text(filterLines, leftX, filtersStartY, { baseline: "top" });

      // Right side info block
      const generatedOn = new Date();
      const generatedDateStr = formatDateTime(generatedOn);
      const dateRangeStr = `${filters?.dateFrom || "-"} to ${filters?.dateTo || "-"}`;
      const rightInfo = [
        `Generated By: ${userName}`,
        `Generated Date: ${generatedDateStr}`,

        `Date Range: ${dateRangeStr}`,
      ];

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(rightInfo, rightX, startY + 14, {
        align: "right",
        baseline: "top",
      });

      // small right-side totals (grand total) below the header block
      const grandTotal = records.reduce(
        (s, r) => s + (r.lineAmount ?? r.totalAmount ?? 0),
        0,
      );
      doc.setFont("helvetica", "bold");
      const lineH = 5;
      // header includes the Filters label + filter lines
      const headerLinesCount = Math.max(
        filterLines.length + 1 || 1,
        rightInfo.length || 1,
      );
      const headerBottomY = startY + 14 + headerLinesCount * lineH;

      doc.text(
        `Grand Total: ${fmtCurrency(grandTotal)}`,
        rightX,
        headerBottomY + 2,
        { align: "right" },
      );
      doc.setFont("helvetica", "normal");

      const tableStart = headerBottomY + 5;

      // Build autoTable body grouped by COA or Division
      const groups = groupRecords(records, groupBy);

      const body: RowInput[] = [];

      for (const grp of groups) {
        // Group header row spanning all columns
        body.push([
          {
            content: `Account: ${grp.key}`,
            colSpan: 5,
            // remove internal borders for group header row; only outer table sides will be drawn
            styles: {
              halign: "left",
              fontStyle: "bold",
              fillColor: [240, 240, 240],
              lineWidth: 0,
              lineColor: [255, 255, 255],
            },
          },
        ]);

        // Records
        for (const r of grp.rows) {
          body.push([
            fmtDate(r.lineDate || r.transactionDate),
            r.payeeName || "-",
            r.coaTitle || "-",
            {
              content: fmtCurrency(r.lineAmount ?? r.totalAmount ?? 0),
              styles: { halign: "right" },
            },
            r.lineRemarks || r.disbursementRemarks || "",
          ]);
        }

        // Subtotal row for the group
        const subtotal = grp.rows.reduce(
          (s, rr) => s + (rr.lineAmount ?? rr.totalAmount ?? 0),
          0,
        );
        body.push([
          {
            content: `Subtotal (${grp.key})`,
            colSpan: 4,
            // remove internal borders for subtotal row as well
            styles: { halign: "right", fontStyle: "bold", lineWidth: 0, lineColor: [255, 255, 255] },
          },
          {
            content: fmtCurrency(subtotal),
            styles: { halign: "right", fontStyle: "bold", lineWidth: 0, lineColor: [255, 255, 255] },
          },
        ]);
      }

      // Overall grand total row (highlighted)
      body.push([
        {
          content: "GRAND TOTAL",
          colSpan: 4,
          // match subtotal styling: remove internal borders so only side borders remain
          styles: {
            halign: "right",
            fontStyle: "bold",
            fillColor: [255, 249, 196],
            lineWidth: 0,
            lineColor: [255, 255, 255],
          },
        },
        {
          content: fmtCurrency(grandTotal),
          styles: {
            halign: "right",
            fontStyle: "bold",
            fillColor: [255, 249, 196],
            lineWidth: 0,
            lineColor: [255, 255, 255],
          },
        },
      ]);

      // Column widths (approx) - compute dynamically and ensure they fit inside usable width
      // assign widths in mm and guarantee the sum does not exceed usableWidth
      const colWidths: Record<number, number> = (() => {
        const minRemarks = 20;
        const base = { 0: 20, 1: 62, 2: 58, 3: 22 };
        const used = base[0] + base[1] + base[2] + base[3];
        let remaining = usableWidth - used;
        if (remaining < minRemarks) {
          // scale down the base columns proportionally while enforcing sensible minimums
          const scale = Math.max(0.45, (usableWidth - minRemarks) / used);
          const s0 = Math.max(10, Math.round(base[0] * scale));
          const s1 = Math.max(20, Math.round(base[1] * scale));
          const s2 = Math.max(20, Math.round(base[2] * scale));
          const s3 = Math.max(10, Math.round(base[3] * scale));
          remaining = usableWidth - (s0 + s1 + s2 + s3);
          return {
            0: s0,
            1: s1,
            2: s2,
            3: s3,
            4: Math.max(remaining, minRemarks),
          };
        }
        return { 0: base[0], 1: base[1], 2: base[2], 3: base[3], 4: remaining };
      })();

      // Draw table using jspdf-autotable - respect the page margins
      autoTable(doc, {
        startY: tableStart,
        margin: { left: leftX, right: margins.right ?? 10 },
        head: [["Date", "Payee", "Account", "Amount", "Remarks"]],
        body: body,
        theme: "grid",
        // default (body) grid lines
        tableLineWidth: 0.25,
        tableLineColor: [180, 180, 180],
        styles: {
          fontSize: 8,
          cellPadding: 3,
          overflow: "linebreak",
          textColor: 0,
          lineWidth: 0.25,
          lineColor: [180, 180, 180],
        },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: 0,
          fontStyle: "bold",
          halign: "center",
          // keep per-cell value small so plugin still draws cell rects, but we'll draw a stronger bottom border via hook
          lineWidth: 0.25,
          lineColor: [120, 120, 120],
        },
        columnStyles: {
          0: { cellWidth: colWidths[0], lineWidth: 0.25 },
          1: { cellWidth: colWidths[1], lineWidth: 0.25 },
          2: { cellWidth: colWidths[2], lineWidth: 0.25 },
          3: { cellWidth: colWidths[3], halign: "right", lineWidth: 0.25 },
          4: { cellWidth: colWidths[4], lineWidth: 0.25 },
        },
        bodyStyles: {
          valign: "middle",
          textColor: 0,
          lineWidth: 0.25,
          lineColor: [180, 180, 180],
        },
        // Draw a single continuous bottom border for the header row to ensure consistent thickness
        // Provide a minimal typed shape for the hook param to avoid lint errors
        didDrawCell: (hookData: {
          section?: string;
          column?: { index?: number };
          cell?: {
            x: number;
            y: number;
            height: number;
            width: number;
            colSpan?: number;
          };
          doc?: jsPDF;
        }) => {
          try {
            const docRef = hookData.doc || doc;

            // 1) Draw a single continuous bottom border for the header row to ensure consistent thickness
            // if (
            //   hookData.section === "head" &&
            //   hookData.column &&
            //   hookData.column.index === 0 &&
            //   hookData.cell
            // ) {
            //   const cell = hookData.cell;
            //   const y = cell.y + cell.height;
            //   docRef.setDrawColor(0, 0, 0);
            //   // stronger header bottom line
            //   docRef.setLineWidth(0);
            //   docRef.line(leftX, y, rightX, y);
            // }

            // 2) If this is a grouped header row (we render `Account: ...` as a colSpan row),
            // draw vertical separators so the group header visually matches the column grid.
            // For colSpan rows (group header / subtotal / grand total) draw only the
            // outer side borders (left and right) so no internal vertical separators appear.
            if (
              hookData.section === "body" &&
              hookData.column &&
              hookData.column.index === 0 &&
              hookData.cell &&
              typeof hookData.cell.colSpan === "number" &&
              hookData.cell.colSpan > 1
            ) {
              const cell = hookData.cell;
              const topY = cell.y;
              const bottomY = cell.y + cell.height;
              docRef.setDrawColor(180, 180, 180);
              docRef.setLineWidth(0.25);
              // left border
              docRef.line(leftX, topY, leftX, bottomY);
              // right border
              docRef.line(rightX, topY, rightX, bottomY);
            }
          } catch {
            // ignore drawing errors
          }
        },
      });
    };

    // Try generating with template engine first (apply saved template header/footer)
    let doc: jsPDF | null = null;
    try {
      const [companyData, templates] = await Promise.all([
        fetchCompanyData(),
        pdfTemplateService.fetchTemplates(),
      ]);

      const resolvedTemplateName = resolveTemplateName(templates);

      doc = await PdfEngine.generateWithFrame(
        resolvedTemplateName,
        companyData,
        renderBody,
      );
      console.log("[exportToPDF] generated with PdfEngine", {
        pages: doc.getNumberOfPages(),
        template: resolvedTemplateName,
      });
    } catch (e) {
      console.error("[exportToPDF] PdfEngine.generateWithFrame failed:", e);
    }

    // Fallback: create a plain jsPDF doc if PdfEngine failed
    if (!doc) {
      console.warn("[exportToPDF] falling back to direct jsPDF generation");
      const fallbackConfig: PdfConfig = {
        paperSize: "Letter",
        customSize: { width: 215.9, height: 279.4 },
        orientation: "portrait",
        elements: {},
        margins: { top: 10, right: 10, bottom: 10, left: 10 },
        showGrid: false,
        snapToGrid: false,
        pageNumber: {
          show: false,
          format: "",
          position: "bottom-right",
          fontSize: 9,
          fontFamily: "helvetica",
          color: "#000000",
          marginY: 5,
          marginX: 10,
        },
      } as unknown as PdfConfig;

      // Use default Letter size and call the same renderBody
      const doc2: jsPDF = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "letter",
      });
      await renderBody(doc2, fallbackConfig.margins.top || 10, fallbackConfig);
      doc = doc2;
      console.log("[exportToPDF] fallback doc ready", {
        pages: doc.getNumberOfPages(),
      });
    }

    // Add footer page numbers on each page (e.g. "Page 1 of 3")
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageText = `Page ${i} of ${pageCount}`;
      // draw centered at the bottom
      doc.text(pageText, pageWidth / 2, pageHeight - 8, { align: "center" });
    }

    if (preview) {
      return doc.output("blob");
    }

    const fileName = `Expense_Report_${format}_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error("Error generating PDF:", error);
    if (preview) return null;
  }
}

// export default exportToPDF;
