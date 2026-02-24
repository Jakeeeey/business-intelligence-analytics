// src/modules/business-intelligence-analytics/arf/inventory-variances/types.ts

export interface ChartDataDto {
    label: string;
    value: number;
}

export interface VArfInventoryVarianceDto {
    detailId: number;
    phId: number;
    branchId: number;
    supplierId: number;
    familyId: number;
    phNo: string;
    auditDate: string;
    branchName: string;
    categoryName: string;
    supplierName: string;
    familyName: string;
    unitPrice: number;
    systemCount: number;
    physicalCount: number;
    variance: number;
    differenceCost: number;
}

export interface InventoryVarianceResponseDto {
    totalVarianceCost: number;
    totalBasePiecesMissing: number;
    recordCount: number;
    branchRiskProfile: ChartDataDto[];
    ledger: VArfInventoryVarianceDto[];
}