import { z } from "zod";

export const AbcProductSchema = z.object({
    id: z.string(),
    branchId: z.number(),
    branchName: z.string(),
    productId: z.number(),
    productName: z.string(),
    productDescription: z.string(),
    supplierId: z.number(),
    supplierName: z.string(),
    outQtyBase: z.number(),
    costPerUnit: z.number(),
    outValue: z.number(),
    rankByValue: z.number(),
    rankByVolume: z.number(),
    date: z.string(),
    abcClass: z.enum(["A", "B", "C"]).optional(),
    classRank: z.number().optional(),
    cumulativePct: z.number().optional(),
});

export type AbcProduct = z.infer<typeof AbcProductSchema>;

export const AbcAnalysisResponseSchema = z.array(AbcProductSchema);
export type AbcAnalysisResponse = z.infer<typeof AbcAnalysisResponseSchema>;
