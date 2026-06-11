export interface PdarRecord {
  DP_Number: string;
  Driver_Name: string | null;
  DelDate: string | null;
  ETOD: string | null;
  ATOD: string | null;
  ETOA: string | null;
  ATOA: string | null;
  Category: string | null;
  Invoice_No: string | null;
  StoreName: string | null;
  CustomerName: string | null;
  Product: string | null;
  QTY: number | null;
  Unit: string | null;
  Amount: number | null;
  Status: string;
  isInvoiceReceived: string | null;
  ReceivedByWarehouse: string | null;
  Remarks: string | null;
}

export type PdarResponse = PdarRecord[];
