export type SalesmanAccount = {
  id: number;
  salesman_code: string;
  salesman_name: string;
};

export type EmployeeGroup = {
  employee: string;
  accounts: SalesmanAccount[];
};

export type SalesReportLookups = {
  employees: EmployeeGroup[];
};

export type SalesReportKpis = {
  total_allocated: number;
  total_invoiced: number;
  unserved_balance: number;
};

export type SalesReportRow = {
  classification: string;
  customer_name: string;

  // Freq 1 (1-15)
  so_1_15: number;
  so_1_15_date: string;
  si_1_15: number;
  si_1_15_date: string;

  // Freq 2 (16-end)
  so_16_eom: number;
  so_16_eom_date: string;
  si_16_eom: number;
  si_16_eom_date: string;

  // Total SI (Freq1 + Freq2)
  total_si: number;
};

export type SalesInvoiceRow = {
  customer: string;
  po_date: string; // sales_order.order_date (date only / label)
  si_date: string; // sales_invoice.invoice_date (date only / label)
  net_amount: number; // si.net_amount - total returns linked
};

export type SalesReportFilters = {
  employee: string | null;
  accountIds: number[];
  months: number[];
  year: number;
};

export type SalesReportResponse = {
  kpis: SalesReportKpis;
  rows: SalesReportRow[];
  invoices: SalesInvoiceRow[]; // ✅ new
};
