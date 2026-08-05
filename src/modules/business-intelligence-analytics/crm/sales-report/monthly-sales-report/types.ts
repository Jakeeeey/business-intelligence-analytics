import { z } from "zod";

export const SalesOrderSchema = z.object({
  order_id: z.number(),
  order_no: z.string(),
  po_no: z.string().optional().nullable(),
  customer_code: z.string(),
  salesman_id: z.number().optional().nullable(),
  supplier_id: z.number().optional().nullable(),
  branch_id: z.number().optional().nullable(),
  order_date: z.string(),
  delivery_date: z.string().optional().nullable(),
  order_status: z.enum([
    "Draft",
    "Pending",
    "For Approval",
    "For Consolidation",
    "For Picking",
    "For Invoicing",
    "For Loading",
    "For Shipping",
    "En Route",
    "Delivered",
    "On Hold",
    "For Cancellation",
    "Cancelled",
    "Not Fulfilled",
  ]),
  total_amount: z.number().optional().nullable(),
  allocated_amount: z.number().optional().nullable(),
  net_amount: z.number().optional().nullable(),
});

export type SalesOrder = z.infer<typeof SalesOrderSchema>;

export const CustomerSchema = z.object({
  id: z.number(),
  customer_code: z.string(),
  customer_name: z.string(),
  store_name: z.string().optional().nullable(),
});

export type Customer = z.infer<typeof CustomerSchema>;

export const SalesmanSchema = z.object({
  id: z.number(),
  salesman_name: z.string(),
  salesman_code: z.string().optional().nullable(),
});

export type Salesman = z.infer<typeof SalesmanSchema>;

export const SupplierSchema = z.object({
  id: z.number(),
  supplier_name: z.string(),
  supplier_shortcut: z.string().optional().nullable(),
});

export type Supplier = z.infer<typeof SupplierSchema>;

export interface MonthlySalesReportPayload {
  salesOrders: SalesOrder[];
  customers: Customer[];
  salesmen: Salesman[];
  suppliers: Supplier[];
}
