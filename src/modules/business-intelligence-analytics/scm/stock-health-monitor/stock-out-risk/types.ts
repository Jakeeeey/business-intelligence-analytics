import { z } from "zod";

export const StockOutRiskSchema = z.object({
  id: z.string(),
  branchId: z.number(),
  branchName: z.string(),
  productId: z.number(),
  productName: z.string(),
  supplierId: z.number(),
  supplierShortcut: z.string().nullable(),
  currentStock: z.number(),
  ads30d: z.number(),
  daysOfStockRemaining: z.number().nullable(),
  estimatedDepletionDate: z.string().nullable(),
  isActionRequired: z.number(),
  windowDays: z.number(),
  riskDaysThreshold: z.number(),
});

export type StockOutRisk = z.infer<typeof StockOutRiskSchema>;
