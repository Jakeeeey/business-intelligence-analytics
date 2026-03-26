import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDateLong } from "@/lib/utils";
import type { DisbursementRecord, ExpenseFilters, ExportFormat } from "../type";

declare module "jspdf" {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
    };
  }
}

type DetailedGroupBy = "coa" | "division";

export type ExportOptions = {
  records: DisbursementRecord[];
  filters: ExpenseFilters;
  format: ExportFormat;
  groupBy?: DetailedGroupBy;
  userName?: string;
  companyName?: string;
  // when preview is true, callers expect the PDF to be returned as a Blob
  preview?: boolean;
};

type SummaryRow = {
  label: string;
  transactions: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
};

type ChartRow = {
  label: string;
  value: number;
  color: string;
};

type GroupedSection = {
  title: string;
  records: DisbursementRecord[];
  subtotal: number;
};

type CoverMetric = {
  label: string;
  value: string;
  detail: string;
};

const DEFAULT_COMPANY_NAME = "VERTEX";
const REPORT_TITLE = "Monthly Disbursement / Expense Report";

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#ef4444",
  "#7c3aed",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

const PAGE_BG: [number, number, number] = [248, 250, 252];
const PANEL_BG: [number, number, number] = [255, 255, 255];
const PANEL_BORDER: [number, number, number] = [226, 232, 240];
const ACCENT: [number, number, number] = [37, 99, 235];
const TEXT_DARK = 20;
const TEXT_MUTED = 90;
const PAGE_MARGIN = 14;
const HEADER_Y = 10;
const LABEL_LEFT_PADDING = 6;

const money = (value: number) =>
  `PHP ${new Intl.NumberFormat("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)}`;

const safeText = (value: string | null | undefined) =>
  value && value.trim() ? value : "—";

const monthYearLabel = (dateValue: string) =>
  new Intl.DateTimeFormat("en-PH", {
    month: "long",
    year: "numeric",
  }).format(new Date(dateValue));

const groupRecords = (
  records: DisbursementRecord[],
  groupBy: DetailedGroupBy,
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

const summarizeBy = (
  records: DisbursementRecord[],
  keySelector: (record: DisbursementRecord) => string,
): SummaryRow[] => {
  const map = new Map<
    string,
    { transactions: number; totalAmount: number; paidAmount: number }
  >();

  records.forEach((record) => {
    const key = keySelector(record) || "Unspecified";
    const current = map.get(key) ?? {
      transactions: 0,
      totalAmount: 0,
      paidAmount: 0,
    };

    map.set(key, {
      transactions: current.transactions + 1,
      totalAmount: current.totalAmount + (record.totalAmount || 0),
      paidAmount: current.paidAmount + (record.paidAmount || 0),
    });
  });

  return Array.from(map.entries())
    .map(([label, value]) => ({
      label,
      transactions: value.transactions,
      totalAmount: value.totalAmount,
      paidAmount: value.paidAmount,
      balance: value.totalAmount - value.paidAmount,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
};

const buildOverallSummary = (records: DisbursementRecord[]) => {
  const totalTransactions = records.length;
  const totalAmount = records.reduce(
    (sum, record) => sum + (record.totalAmount || 0),
    0,
  );
  const totalPaid = records.reduce(
    (sum, record) => sum + (record.paidAmount || 0),
    0,
  );

  return [
    { label: "Total Transactions", value: String(totalTransactions) },
    { label: "Total Amount", value: money(totalAmount) },
    { label: "Total Paid", value: money(totalPaid) },
    { label: "Total Outstanding", value: money(totalAmount - totalPaid) },
  ];
};

const buildCoverMetrics = (records: DisbursementRecord[]): CoverMetric[] => {
  const totalTransactions = records.length;
  const totalAmount = records.reduce(
    (sum, record) => sum + (record.totalAmount || 0),
    0,
  );
  const totalPaid = records.reduce(
    (sum, record) => sum + (record.paidAmount || 0),
    0,
  );
  const outstanding = totalAmount - totalPaid;

  return [
    {
      label: "Transactions",
      value: String(totalTransactions),
      detail: "filtered records",
    },
    {
      label: "Total Amount",
      value: money(totalAmount),
      detail: "gross value",
    },
    {
      label: "Total Paid",
      value: money(totalPaid),
      detail: "actual disbursement",
    },
    {
      label: "Outstanding",
      value: money(outstanding),
      detail: "remaining balance",
    },
  ];
};

const buildChartRows = (
  records: DisbursementRecord[],
  keySelector: (record: DisbursementRecord) => string,
): ChartRow[] => {
  const map = new Map<string, number>();

  records.forEach((record) => {
    const key = keySelector(record) || "Unspecified";
    map.set(key, (map.get(key) || 0) + (record.totalAmount || 0));
  });

  return Array.from(map.entries())
    .map(([label, value], index) => ({
      label,
      value,
      color: COLORS[index % COLORS.length],
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
};

const buildStatusRows = (records: DisbursementRecord[]) => {
  const map = new Map<string, number>();

  records.forEach((record) => {
    const status =
      record.isPosted === 1
        ? "Posted"
        : record.approverId != null
          ? "Pending Approval"
          : "Draft";
    map.set(status, (map.get(status) || 0) + 1);
  });

  return Array.from(map.entries())
    .map(([label, value], index) => ({
      label,
      value,
      color: COLORS[index % COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);
};

const drawPrintableBarChart = (
  doc: jsPDF,
  title: string,
  rows: ChartRow[],
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  drawPanel(doc, x, y - 2, width, height, title, "Top filtered values");

  if (!rows.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("No data available", x, y + 10);
    return;
  }

  // leave more room for the panel header/subtitle so content doesn't overlap
  const chartTopOffset = 10;
  const chartTop = y + chartTopOffset;
  // bar heights
  const chartHeight = height - (chartTopOffset + 8);
  const barGap = 4;
  const rowHeight = Math.max(12, Math.floor(chartHeight / rows.length));
  const maxValue = Math.max(...rows.map((r) => r.value), 1);
  // allow slightly wider labels for longer division/transaction names
  const labelWidth = Math.min(100, Math.floor(width * 0.35));
  const valueWidth = 22;

  const barWidth = width - labelWidth - valueWidth - 10;

  rows.forEach((row, index) => {
    const rowY = chartTop + index * rowHeight;
    const barY = rowY + 2;
    const barH = Math.max(5, rowHeight - barGap - 2);
    const safeLabel =
      row.label.length > 30 ? `${row.label.slice(0, 30)}…` : row.label;
    const filledWidth = (row.value / maxValue) * barWidth;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(TEXT_DARK);
    // offset label a bit from the left edge of the panel
    doc.text(safeLabel, x + LABEL_LEFT_PADDING, rowY + 6, {
      maxWidth: labelWidth - 2 - LABEL_LEFT_PADDING,
    });

    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(x + labelWidth, barY, barWidth, barH, 1, 1, "FD");

    const [r, g, b] = hexToRgb(row.color);
    doc.setFillColor(r, g, b);
    doc.roundedRect(
      x + labelWidth,
      barY,
      Math.max(2, filledWidth),
      barH,
      1,
      1,
      "F",
    );

    // ensure value text is right-aligned within the panel and doesn't overflow
    doc.setFontSize(8);
    doc.setTextColor(TEXT_MUTED);
    // place the value at the right edge of the panel
    const valueX = x + width - 4;
    doc.text(money(row.value), valueX, rowY + 6, { align: "right" });
  });
};

const drawPrintableStatusChart = (
  doc: jsPDF,
  title: string,
  rows: ChartRow[],
  x: number,
  y: number,
  size: number,
) => {
  drawPanel(doc, x, y - 2, size, size, title, "Status distribution");

  if (!rows.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("No status data available", x, y + 10);
    return;
  }

  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1;
  // place the status bar a little lower to avoid colliding with the panel header
  const barY = y + 20;
  const barHeight = 12;
  const barWidth = size;

  let cursorX = x;
  rows.forEach((row, index) => {
    const segmentWidth = (row.value / total) * barWidth;
    const [r, g, b] = hexToRgb(row.color);
    doc.setFillColor(r, g, b);
    doc.rect(cursorX, barY, Math.max(2, segmentWidth), barHeight, "F");
    cursorX += segmentWidth;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(TEXT_DARK);
    // place the status legend below the bar, indented by LABEL_LEFT_PADDING
    doc.text(
      `${row.label}: ${Math.round((row.value / total) * 100)}%`,
      x + LABEL_LEFT_PADDING,
      barY + 24 + index * 7,
    );
  });

  doc.setDrawColor(220);
  doc.rect(x, barY, barWidth, barHeight, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(TEXT_DARK);
  doc.text(String(total), x + barWidth / 2, barY + 8.5, { align: "center" });
};

const hexToRgb = (hex: string) => {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((v) => v + v)
          .join("")
      : value;
  const int = parseInt(full, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255] as const;
};

const drawPageBackground = (doc: jsPDF) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(...PAGE_BG);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
};

const drawWatermark = (doc: jsPDF, text: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(64);
  doc.setTextColor(240);
  // center and rotate slightly for a watermark effect using rotate/restore
  try {
    // rotate around center, draw, then rotate back
    // some jspdf builds provide rotate(origin) - guard with try/catch
    // @ts-expect-error rotate may not exist on all jspdf builds
    doc.rotate(45, { origin: [pageWidth / 2, pageHeight / 2] });
    doc.text(text, pageWidth / 2, pageHeight / 2, { align: "center" });
    // @ts-expect-error rotate may not exist on all jspdf builds
    doc.rotate(-45, { origin: [pageWidth / 2, pageHeight / 2] });
  } catch {
    // fallback: draw without rotation
    doc.text(text, pageWidth / 2, pageHeight / 2, { align: "center" });
  }
  doc.setTextColor(TEXT_DARK);
};

const drawPageHeader = (doc: jsPDF, companyName?: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const left = PAGE_MARGIN;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(TEXT_MUTED);
  doc.text(companyName || DEFAULT_COMPANY_NAME, left, HEADER_Y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(TEXT_DARK);
  doc.text(REPORT_TITLE, left + 48, HEADER_Y);
  // small divider
  doc.setDrawColor(...PANEL_BORDER);
  doc.setLineWidth(0.3);
  doc.line(left, HEADER_Y + 2.5, pageWidth - PAGE_MARGIN, HEADER_Y + 2.5);
};

const renderSignatures = (doc: jsPDF, yStart: number, preparedBy: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const colWidth = Math.floor((pageWidth - PAGE_MARGIN * 2) / 4);
  const left = PAGE_MARGIN;
  const lineY = yStart + 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(TEXT_MUTED);
  const roles = [
    "Prepared By",
    "Approved By",
    "Reviewed By / Finance Head",
    "Payee / Received By",
  ];

  roles.forEach((role, i) => {
    const x = left + i * colWidth;
    doc.setDrawColor(...PANEL_BORDER);
    doc.setLineWidth(0.6);
    doc.line(x + 6, lineY, x + colWidth - 10, lineY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(TEXT_DARK);
    const name = role === "Prepared By" ? preparedBy || "—" : "—";
    doc.text(name, x + 6, lineY + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(TEXT_MUTED);
    doc.text(role, x + 6, lineY + 12);
  });
};

const drawSectionHeading = (
  doc: jsPDF,
  title: string,
  subtitle: string,
  x: number,
  y: number,
  width: number,
) => {
  // small accent pill left of the heading
  doc.setFillColor(...ACCENT);
  doc.roundedRect(x - 6, y - 6, 10, 10, 2, 2, "F");

  doc.setTextColor(TEXT_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, x, y + 4);

  doc.setTextColor(TEXT_MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(subtitle, x + 0.2, y + 9.5, { maxWidth: width - 8 });
};

const drawMetricCard = (
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  metric: CoverMetric,
) => {
  doc.setFillColor(...PANEL_BG);
  doc.setDrawColor(...PANEL_BORDER);
  doc.roundedRect(x, y, w, h, 3, 3, "FD");
  doc.setFillColor(...ACCENT);
  doc.roundedRect(x, y, w, 5, 3, 3, "F");
  // icon circle on left
  const circleX = x + 8;
  const circleY = y + 12;
  const circleR = 8;
  doc.setFillColor(...ACCENT);
  doc.circle(circleX, circleY, circleR, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255);
  const initial = metric.label ? metric.label[0].toUpperCase() : "#";
  // center initial vertically by measuring text width
  const tw = doc.getTextWidth(initial);
  doc.text(initial, circleX - tw / 2, circleY + 3);

  // text area
  const textX = x + 8 + circleR * 2 + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(TEXT_MUTED);
  doc.text(metric.label.toUpperCase(), textX, y + 11);

  doc.setTextColor(TEXT_DARK);
  doc.setFontSize(metric.value.length > 14 ? 11 : 14);
  doc.text(metric.value, textX, y + 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100);
  doc.text(metric.detail, textX, y + h - 6);
};

const drawPanel = (
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  subtitle?: string,
) => {
  doc.setFillColor(...PANEL_BG);
  doc.setDrawColor(...PANEL_BORDER);
  doc.roundedRect(x, y, w, h, 2, 2, "FD");
  doc.setFillColor(...ACCENT);
  doc.roundedRect(x, y, w, 8, 2, 2, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text(title, x + 4, y + 5.5);

  if (subtitle) {
    doc.setTextColor(TEXT_MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(subtitle, x + 4, y + 12);
  }
};

const renderPrintableChartsPage = (
  doc: jsPDF,
  records: DisbursementRecord[],
) => {
  doc.addPage();
  drawPageBackground(doc);
  drawPageHeader(doc);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setTextColor(TEXT_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Printable Charts", pageWidth / 2, 18, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(TEXT_MUTED);
  doc.text("Division, Transaction Type, and Status", pageWidth / 2, 24, {
    align: "center",
  });

  const divisionRows = buildChartRows(records, (r) => r.divisionName);
  const transactionTypeRows = buildChartRows(
    records,
    (r) => r.transactionTypeName,
  );
  const statusRows = buildStatusRows(records);

  drawPrintableBarChart(
    doc,
    "Division Spending",
    divisionRows,
    14,
    34,
    pageWidth - 28,
    56,
  );

  drawPrintableBarChart(
    doc,
    "Transaction Type Spending",
    transactionTypeRows,
    14,
    96,
    pageWidth - 28,
    56,
  );

  // make status panel take about half the available width so legend/text have room
  const statusWidth = Math.floor((pageWidth - 28) * 0.5);
  drawPrintableStatusChart(
    doc,
    "Transaction Status",
    statusRows,
    14,
    158,
    statusWidth,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(TEXT_MUTED);
  doc.text(
    "Charts use the filtered dataset currently selected in the report.",
    pageWidth - 14,
    pageHeight - 18,
    {
      align: "right",
    },
  );
};

const fetchLogoAsDataUrl = async () => {
  try {
    const response = await fetch("/vertex_logo_black.png");
    if (!response.ok) return null;

    const blob = await response.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(typeof reader.result === "string" ? reader.result : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const addCoverPage = async (doc: jsPDF, options: ExportOptions) => {
  drawPageBackground(doc);
  drawWatermark(
    doc,
    (options.companyName || DEFAULT_COMPANY_NAME).toUpperCase(),
  );
  drawPageHeader(doc, options.companyName);


  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const logoDataUrl = await fetchLogoAsDataUrl();
  const companyName = options.companyName?.trim() || DEFAULT_COMPANY_NAME;
  const exportType =
    options.format === "summary" ? "Summary Only" : "Detailed Only";
  const groupedBy =
    options.format === "detailed"
      ? options.groupBy === "division"
        ? "Division"
        : "COA"
      : null;
  const generatedOn = new Date().toISOString().split("T")[0];
  const preparedBy = options.userName?.trim() || "—";
  const monthYear =
    options.records.length > 0
      ? monthYearLabel(options.records[0].transactionDate)
      : monthYearLabel(options.filters.dateFrom);

  doc.setDrawColor(210);
  doc.setLineWidth(0.5);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  doc.setFillColor(...ACCENT);
  doc.rect(12, 12, pageWidth - 24, 6, "F");

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", pageWidth / 2 - 15, 24, 30, 30);
  }

  doc.setTextColor(TEXT_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(companyName, pageWidth / 2, logoDataUrl ? 62 : 46, {
    align: "center",
  });

  doc.setFontSize(16);
  doc.text(REPORT_TITLE, pageWidth / 2, logoDataUrl ? 72 : 56, {
    align: "center",
  });

  const topY = logoDataUrl ? 92 : 78;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`EXPORT TYPE: ${exportType}`, pageWidth / 2, topY, {
    align: "center",
  });
  if (groupedBy) {
    doc.text(`GROUPED BY: ${groupedBy}`, pageWidth / 2, topY + 8, {
      align: "center",
    });
  }
  doc.text(
    `MONTH / YEAR: ${monthYear}`,
    pageWidth / 2,
    topY + (groupedBy ? 16 : 8),
    { align: "center" },
  );
  doc.text(
    `PREPARED BY: ${preparedBy}`,
    pageWidth / 2,
    topY + (groupedBy ? 24 : 16),
    { align: "center" },
  );
  doc.text(
    `DATE GENERATED: ${generatedOn}`,
    pageWidth / 2,
    topY + (groupedBy ? 32 : 24),
    { align: "center" },
  );

  const metrics = buildCoverMetrics(options.records);
  // const cardWidth = 56;
  const cardWidth = 72;
  const cardHeight = 36;
  const gap = 6;
  const startX = (pageWidth - (cardWidth * 2 + gap)) / 2;
  const startY = 128;

  drawMetricCard(doc, startX, startY, cardWidth, cardHeight, metrics[0]);
  drawMetricCard(
    doc,
    startX + cardWidth + gap,
    startY,
    cardWidth,
    cardHeight,
    metrics[1],
  );
  drawMetricCard(
    doc,
    startX,
    startY + cardHeight + gap,
    cardWidth,
    cardHeight,
    metrics[2],
  );
  drawMetricCard(
    doc,
    startX + cardWidth + gap,
    startY + cardHeight + gap,
    cardWidth,
    cardHeight,
    metrics[3],
  );
};

const addPageNumbers = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Page ${page} of ${pageCount}`, pageWidth / 2, pageHeight - 8, {
      align: "center",
    });
  }
};

const renderSummary = (doc: jsPDF, records: DisbursementRecord[]) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  drawPageBackground(doc);
  drawPageHeader(doc);

  let currentY = 142;

  drawSectionHeading(
    doc,
    "Executive Summary",
    "High-level rollup of the filtered dataset",
    14,
    currentY,
    pageWidth - 28,
  );
  currentY += 14;

  autoTable(doc, {
    startY: currentY,
    head: [["Metric", "Amount"]],
    body: buildOverallSummary(records).map((row) => [row.label, row.value]),
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3, lineColor: PANEL_BORDER },
    headStyles: {
      fillColor: ACCENT,
      textColor: 255,
      fontStyle: "bold",
      fontSize: 10,
    },
    alternateRowStyles: { fillColor: [250, 251, 252] },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: "bold" },
      1: { halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc.lastAutoTable?.finalY ?? currentY) + 12;
  if (currentY > doc.internal.pageSize.getHeight() - 48) {
    doc.addPage();
    currentY = 18;
  }

  drawSectionHeading(
    doc,
    "Summary by Division",
    "Grouped spend and balance by division",
    14,
    currentY,
    pageWidth - 28,
  );
  currentY += 10;

  autoTable(doc, {
    startY: currentY,
    head: [
      ["Division", "Transactions", "Total Amount", "Paid Amount", "Balance"],
    ],
    body: summarizeBy(records, (record) => record.divisionName).map((row) => [
      row.label,
      String(row.transactions),
      money(row.totalAmount),
      money(row.paidAmount),
      money(row.balance),
    ]),
    theme: "striped",
    styles: { fontSize: 8.5, cellPadding: 2.2, lineColor: PANEL_BORDER },
    headStyles: {
      fillColor: ACCENT,
      textColor: 255,
      fontStyle: "bold",
      fontSize: 10,
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      1: { halign: "center" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc.lastAutoTable?.finalY ?? currentY) + 12;
  if (currentY > doc.internal.pageSize.getHeight() - 48) {
    doc.addPage();
    currentY = 18;
  }

  drawSectionHeading(
    doc,
    "Summary by Transaction Type",
    "Grouped spend and balance by transaction type",
    14,
    currentY,
    pageWidth - 28,
  );
  currentY += 10;

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        "Transaction Type",
        "Transactions",
        "Total Amount",
        "Paid Amount",
        "Balance",
      ],
    ],
    body: summarizeBy(records, (record) => record.transactionTypeName).map(
      (row) => [
        row.label,
        String(row.transactions),
        money(row.totalAmount),
        money(row.paidAmount),
        money(row.balance),
      ],
    ),
    theme: "striped",
    styles: { fontSize: 8.5, cellPadding: 2.2, lineColor: PANEL_BORDER },
    headStyles: {
      fillColor: ACCENT,
      textColor: 255,
      fontStyle: "bold",
      fontSize: 10,
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      1: { halign: "center" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(TEXT_MUTED);
  doc.text(
    `Report filtered data reflects the active UI filters.`,
    pageWidth - 14,
    doc.internal.pageSize.getHeight() - 18,
    { align: "right" },
  );
};

const renderDetailed = (
  doc: jsPDF,
  records: DisbursementRecord[],
  groupBy: DetailedGroupBy,
  preparedBy: string,
) => {
  const sections = groupRecords(records, groupBy);
  let currentY = 18;

  drawPageBackground(doc);

  drawSectionHeading(
    doc,
    `Detailed Transactions Grouped by ${groupBy === "coa" ? "COA" : "Division"}`,
    "Row-level detail with subtotals for the selected filters",
    14,
    currentY,
    doc.internal.pageSize.getWidth() - 28,
  );
  currentY += 10;

  if (sections.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("No records match the selected filters.", 14, currentY + 6);
    return;
  }

  sections.forEach((section) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = 18;
    }

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(
      14,
      currentY - 4,
      doc.internal.pageSize.getWidth() - 28,
      10,
      2,
      2,
      "F",
    );
    doc.setDrawColor(...PANEL_BORDER);
    doc.roundedRect(
      14,
      currentY - 4,
      doc.internal.pageSize.getWidth() - 28,
      10,
      2,
      2,
      "S",
    );
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(TEXT_DARK);
    doc.text(
      `${groupBy === "coa" ? "COA Title" : "Division"}: ${section.title}`,
      16,
      currentY + 2,
    );
    doc.setTextColor(...ACCENT);
    doc.text(
      `Subtotal: ${money(section.subtotal)}`,
      doc.internal.pageSize.getWidth() - 16,
      currentY + 2,
      { align: "right" },
    );
    doc.setTextColor(TEXT_DARK);
    currentY += 10;

    const head =
      groupBy === "coa"
        ? [
            "Doc No",
            "Transaction Type",
            "Payee Name",
            "Transaction Date",
            "Reference No ( lineId )",
            "Line Type",
            "Line Amount",
            "Paid Amount",
            "Balance",
            "Remarks",
          ]
        : [
            "Doc No",
            "Transaction Type",
            "Payee Name",
            "Transaction Date",
            "Reference No ( lineId )",
            "COA Title",
            "Line Type",
            "Line Amount",
            "Paid Amount",
            "Balance",
            "Remarks",
          ];

    autoTable(doc, {
      startY: currentY,
      head: [head],
      body: section.records.map((record) => {
        const balance = (record.lineAmount || 0) - (record.paidAmount || 0);
        const base = [
          record.docNo,
          record.transactionTypeName,
          record.payeeName,
          formatDateLong(new Date(record.transactionDate)),
          textOrReference(record.referenceNo, record.lineId),
        ];

        return groupBy === "coa"
          ? [
              ...base,
              record.lineType,
              money(record.lineAmount || 0),
              money(record.paidAmount || 0),
              money(balance),
              safeText(record.lineRemarks),
            ]
          : [
              ...base,
              record.coaTitle,
              record.lineType,
              money(record.lineAmount || 0),
              money(record.paidAmount || 0),
              money(balance),
              safeText(record.lineRemarks),
            ];
      }),
      theme: "striped",
      styles: {
        fontSize: 7.3,
        cellPadding: 1.2,
        overflow: "linebreak",
        lineColor: [229, 231, 235],
      },
      headStyles: { fillColor: ACCENT, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles:
        groupBy === "coa"
          ? {
              6: { halign: "right" },
              7: { halign: "right" },
              8: { halign: "right" },
            }
          : {
              7: { halign: "right" },
              8: { halign: "right" },
              9: { halign: "right" },
            },
      margin: { left: 14, right: 14 },
      rowPageBreak: "avoid",
      pageBreak: "auto",
    });

    currentY = (doc.lastAutoTable?.finalY ?? currentY) + 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(
      `Subtotal for ${section.title}: ${money(section.subtotal)}`,
      doc.internal.pageSize.getWidth() - 16,
      currentY,
      { align: "right" },
    );
    currentY += 10;
  });

  if (currentY > doc.internal.pageSize.getHeight() - 46) {
    doc.addPage();
    currentY = 18;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  // render signature lines
  renderSignatures(doc, currentY + 6, preparedBy);
};

const textOrReference = (
  referenceNo: string | null | undefined,
  lineId?: number,
) => {
  const ref = (referenceNo || "").trim();
  if (!lineId) return ref || "—";
  const idStr = `(${lineId})`;
  // If the reference already contains the same id, don't duplicate it
  if (ref.includes(idStr)) return ref || idStr;
  // If the reference already ends with a parenthesized number, assume it's an id and avoid adding another
  if (/\(\s*\d+\s*\)$/.test(ref)) return ref;
  return ref ? `${ref} ${idStr}` : idStr;
};

export async function exportToPDF(options: ExportOptions) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const companyName = options.companyName?.trim() || DEFAULT_COMPANY_NAME;
  const groupBy = options.groupBy ?? "coa";
  const preparedBy = options.userName?.trim() || "—";

  await addCoverPage(doc, options);
  if (options.format === "summary") {
    renderSummary(doc, options.records);
    renderPrintableChartsPage(doc, options.records);
  } else {
    doc.addPage();
    drawPageBackground(doc);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(companyName, 14, 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(REPORT_TITLE, 14, 18);
    doc.text(`Export Type: Detailed Only`, 14, 23);
    doc.text(
      `Date Range: ${formatDateLong(new Date(options.filters.dateFrom))} - ${formatDateLong(new Date(options.filters.dateTo))}`,
      14,
      28,
    );
    doc.text(`Filtered Records: ${options.records.length}`, 14, 33);
    renderDetailed(doc, options.records, groupBy, preparedBy);
  }

  addPageNumbers(doc);

  if (options.preview) {
    // return a Blob for previewing (caller will createObjectURL)
    // jsPDF supports output('blob') in modern builds
    const blob =
      doc.output && typeof doc.output === "function"
        ? (doc as unknown as { output: (format: string) => Blob }).output(
            "blob",
          )
        : null;
    return blob as Blob | null;
  }

  const fileName = `${companyName.toLowerCase().replace(/\s+/g, "-")}_${options.format}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}

export default exportToPDF;
