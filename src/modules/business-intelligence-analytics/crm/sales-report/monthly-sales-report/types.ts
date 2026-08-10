import { z } from "zod";

export const SalesPerformanceItemSchema = z.object({
  divisionId: z.number().optional().nullable(),
  salesmanId: z.number().optional().nullable(),
  salesmanCode: z.string().optional().nullable(),
  supplierId: z.number().optional().nullable(),
  divisionName: z.string().optional().nullable(),
  salesmanName: z.string().optional().nullable(),
  supplierName: z.string().optional().nullable(),
  transactionDate: z.string().optional().nullable(),
  fiscalPeriod: z.string().optional().nullable(),
  customerCode: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  storeTypeLabel: z.string().optional().nullable(),
  storeName: z.string().optional().nullable(),
  netAmount: z.number().optional().nullable(),
});

export type SalesPerformanceItem = z.infer<typeof SalesPerformanceItemSchema>;

export interface MonthlySalesReportPayload {
  salesPerformance: SalesPerformanceItem[];
}

