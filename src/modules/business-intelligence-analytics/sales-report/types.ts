export type SalesmanAccount = {
  id: number; // salesman.id (account)
  salesman_code: string;
  salesman_name: string;
};

export type EmployeeGroup = {
  employee: string; // salesman_name grouped
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
  so_1_15_date: string; // single date or range label
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

export type SalesReportFilters = {
  employee: string | null; // employee group (salesman_name)
  accountIds: number[]; // salesman ids (multi)
  months: number[]; // 1..12 (multi)
  year: number;
};

export type SalesReportResponse = {
  kpis: SalesReportKpis;
  rows: SalesReportRow[];
};
