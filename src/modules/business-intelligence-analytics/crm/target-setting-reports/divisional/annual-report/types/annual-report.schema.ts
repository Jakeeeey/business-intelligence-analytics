import { z } from "zod";

export const SalesTransactionSchema = z.object({
  invoiceNo: z.string(),
  invoiceDate: z.string(),
  customerName: z.string(),
  totalInvoiceAmount: z.number(),
});

export type SalesTransaction = z.infer<typeof SalesTransactionSchema>;

export const PurchaseTransactionSchema = z.object({
  receiptNo: z.string(),
  receiptDate: z.string(),
  supplierName: z.string(),
  totalReceiptAmount: z.number(),
});

export type PurchaseTransaction = z.infer<typeof PurchaseTransactionSchema>;

export const SalesApiResponseSchema = z.object({
  data: z.array(SalesTransactionSchema).optional(),
  ok: z.boolean().optional(),
});

export const PurchaseApiResponseSchema = z.object({
  data: z.array(PurchaseTransactionSchema).optional(),
  ok: z.boolean().optional(),
});

export const MonthlyAggregateSchema = z.object({
  month: z.number(),
  year: z.number(),
  monthLabel: z.string(),
  totalSales: z.number(),
  totalPurchases: z.number(),
  variance: z.number(),
  biasPercentage: z.number(),
});

export type MonthlyAggregate = z.infer<typeof MonthlyAggregateSchema>;

export const DashboardSummarySchema = z.object({
  totalSales: z.number(),
  totalPurchases: z.number(),
  netVariance: z.number(),
  biasPercentage: z.number(),
});

export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;

export const DashboardResponseSchema = z.object({
  summary: DashboardSummarySchema,
  monthlyData: z.array(MonthlyAggregateSchema),
  salesTransactions: z.array(SalesTransactionSchema).optional(),
  purchaseTransactions: z.array(PurchaseTransactionSchema).optional(),
  customers: z.array(z.string()).optional(),
  suppliers: z.array(z.string()).optional(),
});

export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;

export const AnnualReportFiltersSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  customerName: z.string().optional(),
  supplierName: z.string().optional(),
  year: z.string().optional(),
});

export type AnnualReportFilters = z.infer<typeof AnnualReportFiltersSchema>;

export interface HalfYearDataPoint {
  label: string;
  year: number;
  half: 1 | 2;
  totalSales: number;
  totalPurchases: number;
  variance: number;
  biasPercentage: number;
}
