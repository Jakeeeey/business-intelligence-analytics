export interface UnfulfilledOrder {
    unfulfilledDetailId: number;
    productName: string;
    brandName: string;
    categoryName: string;
    productSupplier: string;
    unitOfMeasurement: string;
    receiptQty: number;
    missingQty: number;
    customerName: string;
    driverName: string;
    dispatchNo: string;
    salesOrderNo: string;
    purchaseOrderNo: string;
    poDate: string;        // Used as 'orderDate' for aging logic
    receiptDate: string;
    receivedDate: string;  // Used for 'Finalized Date'
    unfulfilledStatus: string;
    totalAmount?: number;  // Add this for Revenue at Risk metrics
}