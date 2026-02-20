import { z } from "zod";

/**
 * Zod schema for the Lead Time Variance Purchase Order data from API.
 */
export const LeadTimeVariancePoSchema = z.object({
  purchaseOrderId: z.number(),
  purchaseOrderNo: z.string(),
  supplierId: z.number(),
  supplierName: z.string(),
  poDate: z.string().nullable(),
  receivingDate: z.string().nullable(),
  actualLeadTimeDays: z.number().nullable(),
});

/**
 * Inferred TypeScript type for Lead Time Variance PO.
 */
export type LeadTimeVariancePo = z.infer<typeof LeadTimeVariancePoSchema>;

/**
 * Zod schema for the API response.
 */
export const LeadTimeVarianceResponseSchema = z.array(LeadTimeVariancePoSchema);
