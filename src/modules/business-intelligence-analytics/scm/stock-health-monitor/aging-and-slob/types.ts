import { z } from "zod";

export const SlobAgingSchema = z.object({
  id: z.string(),
  branchId: z.number(),
  branchName: z.string(),
  productId: z.number(),
  productName: z.string(),
  supplierId: z.number(),
  supplierShortcut: z.string().nullable(),
  currentStock: z.number(),
  costPerUnit: z.number(),
  stockValue: z.number(),
  lastOutboundDate: z.string().nullable(),
  isSlob: z.number(),
  slobDaysThreshold: z.number(),
});

export type SlobAging = z.infer<typeof SlobAgingSchema>;
