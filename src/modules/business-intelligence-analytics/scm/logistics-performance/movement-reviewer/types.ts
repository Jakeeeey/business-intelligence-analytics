export interface VProductMovementDto {
    ts: string;
    productId: number;
    parentId: number | null;
    productName: string | null;
    unit: string | null;
    unitCount: number | null;
    brand: string | null;
    category: string | null;
    branchId: number;
    branchName: string | null;
    docNo: string;
    docType: string;
    inBase: number;
    outBase: number;
    descr: string | null;
    supplierId: number | null;
    supplierName: string | null;
    familyUnit: string | null;
    familyUnitCount: number | null;
}

export interface PivotFamily {
    familyId: number;
    familyName: string;
    unit: string;
    movements: Record<string, Record<string, number>>;
}

export interface PivotReport {
    columns: string[];
    families: PivotFamily[];
}

// NEW: Interface for the high-level summary view
export interface SummaryReport {
    columns: string[];
    movements: Record<string, Record<string, number>>;
}