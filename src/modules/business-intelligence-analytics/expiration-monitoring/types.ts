export interface ExpirationRecord {
  purchaseOrderProductId: number;
  receiptNo: string;
  receivedDate: string;
  expiryDate: string;
  batchNo: string;
  lotId: number;
  lotName: string;
  receivedQuantity: number;
  unitPrice: number;
  discountedAmount: number;
  vatAmount: number;
  itemTotalCost: number;
  supplierId: number;
  supplierName: string;
  productId: number;
  productCode: string | null;
  productName: string;
  branchId: number;
  branchName: string;
}

export interface ExpirationFilters {
  expiryDateFrom?: string;
  expiryDateTo?: string;
  supplierIds?: number[];
  productCode?: string;
  productName?: string;
  branchIds?: number[];
  lotIds?: number[];
  lotName?: string;
  batchNos?: string[];
  expirationStatuses?: string[];
}
