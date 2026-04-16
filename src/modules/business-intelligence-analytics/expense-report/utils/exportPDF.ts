/**
 * Expense Report PDF Export Module
 * Integrates with pdf-layout-design component for template-based PDF generation
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PdfEngine } from "@/components/pdf-layout-design/PdfEngine";
import { PdfConfig } from "@/components/pdf-layout-design/types";
import {
  DEFAULT_CONFIG,
  PAPER_SIZES,
} from "@/components/pdf-layout-design/constants";
import {
  drawPageNumbers,
  renderElement,
} from "@/components/pdf-layout-design/PdfGenerator";
import { pdfTemplateService } from "@/components/pdf-layout-design/services/pdf-template";
import type { DisbursementRecord, ExpenseFilters, ExportFormat } from "../type";

// ============================================================================
// Types & Constants
// ============================================================================

declare module "jspdf" {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
    };
  }
}

export type ExportOptions = {
  records: DisbursementRecord[];
  filters: ExpenseFilters;
  format: ExportFormat;
  groupBy?: "coa" | "division";
  userName?: string;
  companyName?: string;
  companyLogo?: string;
  companyEmail?: string;
  companyContact?: string;
  preview?: boolean;
};

type GroupedSection = {
  title: string;
  records: DisbursementRecord[];
  subtotal: number;
};

type SummaryRow = {
  category: string;
  count: number;
  amount: number;
};

const DEFAULT_COMPANY_NAME = "VERTEX";

const COLORS = {
  primary: [37, 99, 235] as [number, number, number],
  success: [22, 163, 74] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  text: {
    dark: [20, 20, 20] as [number, number, number],
    muted: [90, 90, 90] as [number, number, number],
  },
  bg: {
    page: [248, 250, 252] as [number, number, number],
    panel: [255, 255, 255] as [number, number, number],
  },
  border: [226, 232, 240] as [number, number, number],
};

type CompanyHeaderData = {
  company_name: string;
  company_logo?: string;
  company_email?: string;
  company_contact?: string;
};

const buildExpensePdfConfig = (companyData: CompanyHeaderData): PdfConfig => {
  const base = structuredClone(DEFAULT_CONFIG);
  //change default configuration here
  return {
    ...base,
    paperSize: "A4",
    orientation: "portrait",
    showGrid: false,
    snapToGrid: false,
    pageNumber: {
      ...base.pageNumber,
      show: true,
      format: "Page {pageNumber} of {totalPages}",
      position: "bottom-right",
      fontSize: 8,
      marginX: 10,
      marginY: 6,
      color: "#64748b",
      fontFamily: "helvetica",
    },
    bodyStart: 55,
    elements: {
      ...base.elements,
      company_logo: {
        ...base.elements.company_logo,
        visible: Boolean(companyData.company_logo),
        content: companyData.company_logo,
        x: 10,
        y: 10,
        width: 24,
        height: 24,
      },
      company_name: {
        ...base.elements.company_name,
        type: "custom_text",
        content: companyData.company_name,
        x: 38,
        y: 12,
        width: 150,
        height: 8,
        style: {
          ...base.elements.company_name.style,
          fontSize: 16,
          fontWeight: "bold",
          color: "#111827",
        },
      },
      company_contact: {
        ...base.elements.company_contact,
        type: "custom_text",
        visible: Boolean(companyData.company_contact),
        content: companyData.company_contact || "",
        x: 38,
        y: 24,
        width: 150,
        height: 5,
        style: {
          ...base.elements.company_contact.style,
          fontSize: 9,
          color: "#475569",
        },
      },
      company_email: {
        ...base.elements.company_email,
        type: "custom_text",
        visible: Boolean(companyData.company_email),
        content: companyData.company_email || "",
        x: 38,
        y: 29,
        width: 150,
        height: 5,
        style: {
          ...base.elements.company_email.style,
          fontSize: 9,
          color: "#475569",
        },
      },
      report_title: {
        id: "report_title",
        type: "custom_text",
        label: "Report Title",
        visible: true,
        x: 10,
        y: 40,
        width: 190,
        height: 6,
        align: "center",
        content: "Monthly Disbursement / Expense Report",
        style: {
          fontSize: 12,
          fontFamily: "helvetica",
          fontWeight: "bold",
          color: "#1f2937",
        },
      },
      header_line: {
        ...base.elements.header_line,
        y: 48,
      },
      company_address: { ...base.elements.company_address, visible: false },
      company_brgy: { ...base.elements.company_brgy, visible: false },
      company_city: { ...base.elements.company_city, visible: false },
      company_province: { ...base.elements.company_province, visible: false },
      company_zipCode: { ...base.elements.company_zipCode, visible: false },
    },
  };
};

const createDocFromConfig = (config: PdfConfig): jsPDF => {
  const paper =
    config.paperSize === "Custom"
      ? config.customSize
      : PAPER_SIZES[config.paperSize] || PAPER_SIZES.A4;

  return new jsPDF({
    orientation: config.orientation,
    unit: "mm",
    format: [paper.width, paper.height],
  });
};

const applyConfiguredHeader = (
  doc: jsPDF,
  config: PdfConfig,
  data: CompanyHeaderData,
): number => {
  let lowestY = config.margins?.top || 10;
  for (const el of Object.values(config.elements)) {
    if (!el.visible) continue;
    renderElement(doc, el, data);
    const bottom = el.y + el.height;
    if (bottom > lowestY) lowestY = bottom;
  }
  return config.bodyStart ?? lowestY + 5;
};

// ============================================================================
// Formatting Utilities
// ============================================================================

const money = (value: number | undefined | null): string =>
  `PHP ${new Intl.NumberFormat("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(Number(value)) ? Number(value) : 0)}`;

const formatDate = (date: Date | string): string =>
  new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(typeof date === "string" ? new Date(date) : date);

const safeText = (value: string | null | undefined): string =>
  value?.trim() || "—";

const dedupeByDocument = (
  records: DisbursementRecord[],
): DisbursementRecord[] => {
  const uniqueByDoc = new Map<number, DisbursementRecord>();
  records.forEach((record) => {
    if (!uniqueByDoc.has(record.disbursementId)) {
      uniqueByDoc.set(record.disbursementId, record);
    }
  });
  return Array.from(uniqueByDoc.values());
};

const groupRecords = (
  records: DisbursementRecord[],
  groupBy: "coa" | "division",
): GroupedSection[] => {
  const map = new Map<string, DisbursementRecord[]>();

  records.forEach((record) => {
    const key = groupBy === "coa" ? record.coaTitle : record.divisionName;
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(record);
  });

  return Array.from(map.entries())
    .map(([title, groupedRecords]) => ({
      title,
      records: groupedRecords.sort((a, b) => a.docNo.localeCompare(b.docNo)),
      subtotal: groupedRecords.reduce(
        (sum, record) => sum + (record.lineAmount || 0),
        0,
      ),
    }))
    .sort((a, b) => b.subtotal - a.subtotal);
};

const summarizeRecords = (
  records: DisbursementRecord[],
  groupBy: "coa" | "division",
): SummaryRow[] => {
  const dedupedRecords = dedupeByDocument(records);
  const map = new Map<string, { count: number; amount: number }>();

  dedupedRecords.forEach((record) => {
    const key = groupBy === "coa" ? record.coaTitle : record.divisionName;
    const current = map.get(key) ?? { count: 0, amount: 0 };
    map.set(key, {
      count: current.count + 1,
      amount: current.amount + (record.totalAmount || 0),
    });
  });

  return Array.from(map.entries())
    .map(([category, { count, amount }]) => ({
      category,
      count,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);
};

// ============================================================================
// PDF Template Renderers (using PdfEngine.generateWithFrame)
// ============================================================================

/**
 * Renders summary PDF body - KPIs, overview tables, charts
 */
const renderSummaryBody = (
  doc: jsPDF,
  startY: number,
  config: PdfConfig,
  options: ExportOptions,
): void => {
  let currentY = startY;

  // KPI Cards Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(
    COLORS.text.dark[0],
    COLORS.text.dark[1],
    COLORS.text.dark[2],
  );
  doc.text("Executive Summary", 14, currentY);
  currentY += 8;

  const dedupedRecords = dedupeByDocument(options.records);
  const totalAmount = options.records.reduce(
    (sum, r) => sum + (r.lineAmount || 0),
    0,
  );
  const paidAmount = options.records.reduce(
    (sum, r) => sum + (r.paidAmount || 0),
    0,
  );
  const balance = totalAmount - paidAmount;

  // Summary metrics in table format
  const kpiData = [
    ["Metric", "Value"],
    ["Total Transactions", dedupedRecords.length.toString()],
    ["Total Amount", money(totalAmount)],
    ["Paid Amount", money(paidAmount)],
    ["Balance", money(balance)],
    [
      "Date Range",
      `${formatDate(options.filters.dateFrom)} - ${formatDate(options.filters.dateTo)}`,
    ],
  ];

  doc.setFontSize(10);
  autoTable(doc, {
    head: kpiData.slice(0, 1) as string[][],
    body: kpiData.slice(1) as string[][],
    startY: currentY,
    margin: 14,
    theme: "grid",
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: COLORS.text.dark,
    },
    alternateRowStyles: {
      fillColor: COLORS.bg.page,
    },
  });

  const finalY = doc.lastAutoTable?.finalY ?? currentY + 30;
  currentY = finalY + 10;

  // Summary by Category/Division
  const summaryRows = summarizeRecords(
    options.records,
    options.groupBy || "coa",
  );
  const summaryTableData = [
    ["Category", "Count", "Amount"],
    ...summaryRows.map((row) => [
      row.category,
      row.count.toString(),
      money(row.amount),
    ]),
  ];

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Summary by ${options.groupBy === "division" ? "Division" : "Chart of Account"}`,
    14,
    currentY,
  );
  currentY += 6;

  autoTable(doc, {
    head: summaryTableData.slice(0, 1) as string[][],
    body: summaryTableData.slice(1) as string[][],
    startY: currentY,
    margin: 14,
    theme: "striped",
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: COLORS.text.dark,
    },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
    },
  });
};

/**
 * Renders detailed PDF body - full transaction tables grouped by category/division
 */
const renderDetailedBody = (
  doc: jsPDF,
  startY: number,
  config: PdfConfig,
  options: ExportOptions,
): void => {
  const margin = 14;
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = startY;

  const groupBy = options.groupBy || "coa";
  const groupedSections = groupRecords(options.records, groupBy);

  groupedSections.forEach((section) => {
    // Section header
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(
      COLORS.text.dark[0],
      COLORS.text.dark[1],
      COLORS.text.dark[2],
    );

    // Add new page if needed
    if (currentY + 25 > pageHeight - margin) {
      doc.addPage();
      currentY = margin + 8;
    }

    doc.text(`${section.title} - ${money(section.subtotal)}`, margin, currentY);
    currentY += 6;

    // Transaction table for this group
    const tableData = [
      ["Ref#", "Date", "Description", "Amount", "Paid", "Balance"],
      ...section.records.map((record) => [
        safeText(record.docNo),
        formatDate(record.lineDate),
        `${record.divisionName} / ${record.coaTitle}`,
        money(record.lineAmount),
        money(record.paidAmount),
        money((record.lineAmount || 0) - (record.paidAmount || 0)),
      ]),
    ];

    doc.setFontSize(8);
    autoTable(doc, {
      head: tableData.slice(0, 1) as string[][],
      body: tableData.slice(1) as string[][],
      startY: currentY,
      margin: margin,
      theme: "grid",
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: COLORS.text.dark,
      },
      columnStyles: {
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right" },
      },
    });

    const finalY = doc.lastAutoTable?.finalY ?? currentY + 20;
    currentY = finalY + 8;
  });

  // Footer note
  doc.setFontSize(8);
  doc.setTextColor(
    COLORS.text.muted[0],
    COLORS.text.muted[1],
    COLORS.text.muted[2],
  );
  doc.text(
    "Report filtered data reflects the active UI filters. All amounts are in PHP.",
    margin,
    pageHeight - margin - 2,
  );
};

// ============================================================================
// Main Export Functions
// ============================================================================

/**
 * Generates a PDF based on export options
 */
export async function exportToPDF(
  options: ExportOptions,
): Promise<void | Blob> {
  const {
    format,
    groupBy = "coa",
    userName = "User",
    companyName = DEFAULT_COMPANY_NAME,
    companyLogo,
    companyEmail,
    companyContact,
    preview = false,
  } = options;

  try {
    // Prepare company data for template
    const companyData: CompanyHeaderData = {
      company_name: companyName,
      company_logo: companyLogo,
      company_email: companyEmail,
      company_contact: companyContact,
    };

    const fallbackConfig = buildExpensePdfConfig(companyData);

    // Select body renderer based on format
    const renderBody =
      format === "summary"
        ? (doc: jsPDF, startY: number, config: PdfConfig) =>
            renderSummaryBody(doc, startY, config, options)
        : (doc: jsPDF, startY: number, config: PdfConfig) =>
            renderDetailedBody(doc, startY, config, {
              ...options,
              groupBy,
            });

    // Generate PDF using saved template if available; otherwise use fallback config.
    const templates = await pdfTemplateService.fetchTemplates();
    const templateName = "expense-report-template";
    const hasTemplate = templates.some((t) => t.name === templateName);

    const doc = hasTemplate
      ? await PdfEngine.generateWithFrame(templateName, companyData, renderBody)
      : await (async () => {
          const localDoc = createDocFromConfig(fallbackConfig);
          const startY = applyConfiguredHeader(
            localDoc,
            fallbackConfig,
            companyData,
          );
          await renderBody(localDoc, startY, fallbackConfig);
          if (fallbackConfig.pageNumber?.show) {
            drawPageNumbers(localDoc, fallbackConfig);
          }
          return localDoc;
        })();

    // Add footer metadata
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.text(
        `Generated by: ${userName} | ${new Date().toLocaleString("en-PH")}`,
        10,
        pageHeight - 8,
      );
    }

    // Return blob if preview mode, otherwise save
    if (preview) {
      return doc.output("blob");
    }

    const fileName = `Expense_Report_${format}_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error("Error generating PDF:", error);
    if (preview) {
      return undefined;
    }
  }
}

/**
 * Generates a summary-only PDF (lightweight export)
 */
export async function exportSummaryPDF(
  options: ExportOptions,
): Promise<void | Blob> {
  return exportToPDF({
    ...options,
    format: "summary",
  });
}

/**
 * Generates a detailed PDF with grouping options
 */
export async function exportDetailedPDF(
  options: ExportOptions & { groupBy: "coa" | "division" },
): Promise<void | Blob> {
  return exportToPDF({
    ...options,
    format: "detailed",
  });
}

/**
 * Generates PDF for live preview (returns Blob)
 */
export async function generatePdfPreview(
  options: ExportOptions,
): Promise<Blob | null> {
  try {
    const result = await exportToPDF({
      ...options,
      preview: true,
    });
    return (result as Blob) || null;
  } catch (error) {
    console.error("Error generating preview:", error);
    return null;
  }
}
