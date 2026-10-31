import { z } from "zod";

export const CustomerAnnualSaleItemSchema = z.object({
  year: z.number().nullable().optional(),
  month: z.number().nullable().optional(),
  supplierId: z.number().nullable().optional(),
  supplierName: z.string().nullable().optional(),
  salesmanId: z.number().nullable().optional(),
  salesmanCode: z.string().nullable().optional(),
  salesmanName: z.string().nullable().optional(),
  customerId: z.number().nullable().optional(),
  customerCode: z.string().nullable().optional(),
  customerName: z.string().nullable().optional(),
  productId: z.number().nullable().optional(),
  productName: z.string().nullable().optional(),
  productCategory: z.string().nullable().optional(),
  unitsId: z.number().nullable().optional(),
  unitName: z.string().nullable().optional(),
  priceTypeName: z.string().nullable().optional(),
  soldQuantity: z.number().nullable().optional(),
  soldAmount: z.number().nullable().optional(),
  returnedQuantity: z.number().nullable().optional(),
  returnedAmount: z.number().nullable().optional(),
  conversionToPieces: z.number().nullable().optional(),
  conversionToCases: z.number().nullable().optional(),
  unfulfilledAmount: z.number().nullable().optional(),
  netAmount: z.number().nullable().optional(),
  poNo: z.string().nullable().optional(),
  soNo: z.string().nullable().optional(),
  pdpNos: z.string().nullable().optional(),
  cldtoNos: z.string().nullable().optional(),
  siNo: z.string().nullable().optional(),
  dpNos: z.string().nullable().optional(),
  deliveredDate: z.string().nullable().optional(),
  rowType: z.string().nullable().optional(),
  returnNo: z.string().nullable().optional(),
  returnDate: z.string().nullable().optional(),
});

export type CustomerAnnualSaleItem = z.infer<typeof CustomerAnnualSaleItemSchema>;

export const SalesmanOptionSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export type SalesmanOption = z.infer<typeof SalesmanOptionSchema>;

export const CustomerOptionSchema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string(),
  code: z.string().optional(),
});

export type CustomerOption = z.infer<typeof CustomerOptionSchema>;

export const CustomerAnnualSalesApiResponseSchema = z.object({
  ok: z.boolean().nullable().optional(),
  data: z.array(CustomerAnnualSaleItemSchema),
  suppliers: z.array(z.string()).nullable().optional(),
  salesmen: z.array(SalesmanOptionSchema).nullable().optional(),
  customers: z.array(CustomerOptionSchema).nullable().optional(),
  categories: z.array(z.string()).nullable().optional(),
  uoms: z.array(z.string()).nullable().optional(),
  priceTypes: z.array(z.string()).nullable().optional(),
  message: z.string().nullable().optional(),
});

export type CustomerAnnualSalesApiResponse = z.infer<typeof CustomerAnnualSalesApiResponseSchema>;

export const MonthlyCustomerAggregateSchema = z.object({
  month: z.number(),
  year: z.number(),
  monthLabel: z.string(),
  soldAmount: z.number(),
  returnedAmount: z.number(),
  netAmount: z.number(),
  soldQuantity: z.number(),
  returnedQuantity: z.number(),
});

export type MonthlyCustomerAggregate = z.infer<typeof MonthlyCustomerAggregateSchema>;

export const CustomerSalesSummarySchema = z.object({
  totalSoldAmount: z.number(),
  totalReturnedAmount: z.number(),
  totalNetAmount: z.number(),
  totalSoldQuantity: z.number(),
  totalReturnedQuantity: z.number(),
});

export type CustomerSalesSummary = z.infer<typeof CustomerSalesSummarySchema>;

export interface CustomerAnnualSalesFilters {
  year: string;
  month: string;
  salesmanId: string;
  customerName: string;
  supplierName: string;
  categoryName: string;
  unitName: string;
  priceType: string;
  amountType: "netAmount" | "soldAmount" | "returnedAmount";
}
