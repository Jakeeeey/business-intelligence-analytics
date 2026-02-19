import { z } from "zod";

export const FulfillmentRatePoSchema = z.object({
  purchaseOrderId: z.number(),
  purchaseOrderNo: z.string(),
  supplierId: z.number(),
  supplierName: z.string(),
  poDate: z.string(),
  poDateEncoded: z.string(),
  totalOrderedQty: z.number(),
  totalReceivedQty: z.number(),
  fulfillmentPct: z.number(),
  flagBelow95: z.number(),
});

export type FulfillmentRatePo = z.infer<typeof FulfillmentRatePoSchema>;

export interface ScmSummaryMetrics {
  avgFulfillmentRate: number;
  suppliersBelow95Count: number;
  totalSuppliersCount: number;
  totalPurchaseOrders: number;
  totalFulfillmentPct: number;
}
