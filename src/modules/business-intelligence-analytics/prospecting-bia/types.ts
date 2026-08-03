import { z } from "zod";

export const SalesmanSchema = z.object({
  id: z.number(),
  employee_id: z.number().optional().nullable(),
  salesman_code: z.string().optional().nullable(),
  salesman_name: z.string(),
  truck_plate: z.string().optional().nullable(),
  division_id: z.number().optional().nullable(),
  branch_code: z.number().optional().nullable(),
  bad_branch_code: z.number().optional().nullable(),
  operation: z.number().optional().nullable(),
  company_code: z.number().optional().nullable(),
  supplier_code: z.number().optional().nullable(),
  price_type: z.string().optional().nullable(),
  price_type_id: z.number().optional().nullable(),
  isActive: z.union([z.number(), z.boolean()]).optional().nullable(),
  isInventory: z.union([z.number(), z.boolean()]).optional().nullable(),
  canCollect: z.union([z.number(), z.boolean()]).optional().nullable(),
  inventory_day: z.number().optional().nullable(),
  modified_date: z.string().optional().nullable(),
  encoder_id: z.number().optional().nullable(),
});

export type Salesman = z.infer<typeof SalesmanSchema>;

export const StoreTypeSchema = z.object({
  id: z.number(),
  store_type: z.string().optional().nullable(),
  created_by: z.number().optional().nullable(),
  created_at: z.string().optional().nullable(),
  updated_by: z.number().optional().nullable(),
  updated_at: z.string().optional().nullable(),
});

export type StoreType = z.infer<typeof StoreTypeSchema>;

export const CustomerProspectSchema = z.object({
  id: z.number(),
  salesman_id: z.number().optional().nullable(),
  prospect_date: z.string().optional().nullable(),
  customer_code: z.string().optional().nullable(),
  customer_name: z.string().optional().nullable(),
  type: z.enum(["Regular", "Employee"]).default("Regular"),
  user_id: z.number().optional().nullable(),
  customer_image: z.string().optional().nullable(),
  store_name: z.string().optional().nullable(),
  store_signage: z.string().optional().nullable(),
  brgy: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  contact_number: z.string().optional().nullable(),
  customer_email: z.string().optional().nullable(),
  tel_number: z.string().optional().nullable(),
  bank_details: z.string().optional().nullable(),
  customer_tin: z.string().optional().nullable(),
  payment_term: z.number().optional().nullable(),
  store_type: z.number().optional().nullable(),
  price_type: z.string().optional().nullable(),
  encoder_id: z.number().optional().nullable(),
  credit_type: z.number().optional().nullable(),
  company_code: z.number().optional().nullable(),
  date_entered: z.string().optional().nullable(),
  isActive: z.number().optional().nullable(),
  isVAT: z.number().optional().nullable(),
  isEWT: z.number().optional().nullable(),
  discount_type: z.number().optional().nullable(),
  otherDetails: z.string().optional().nullable(),
  classification: z.number().optional().nullable(),
  prospect_status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  latitude: z.union([z.number(), z.string()]).optional().nullable(),
  longitude: z.union([z.number(), z.string()]).optional().nullable(),
  percentage: z.union([z.number(), z.string()]).optional().nullable(),
});

export type CustomerProspect = z.infer<typeof CustomerProspectSchema>;

export interface ProspectingDataPayload {
  customerProspects: CustomerProspect[];
  salesmen: Salesman[];
  storeTypes: StoreType[];
}
