import { useState, useMemo } from "react";
import { VProductMovementDto, PivotReport, SummaryReport, PivotFamily } from "../types";
import { fetchMovementReport } from "../providers/fetchProvider";

export const useMovementReviewer = () => {
    const [loading, setLoading] = useState(false);
    const [rawData, setRawData] = useState<VProductMovementDto[]>([]);
    const [error, setError] = useState<string | null>(null);

    const generateReport = async (supplierId: string, from: string, to: string) => {
        if (!supplierId || !from || !to) return;

        setLoading(true);
        setError(null);
        try {
            const data = await fetchMovementReport(supplierId, from, to);
            setRawData(data);
            // FIX: Replaced 'any' with 'unknown' and checked instance
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occurred");
            }
        } finally {
            setLoading(false);
        }
    };

    const parsedReports = useMemo<{ pivotReport: PivotReport | null, summaryReport: SummaryReport | null }>(() => {
        if (!rawData.length) return { pivotReport: null, summaryReport: null };

        const branches = new Set<string>();
        const familyMeta: Record<number, { name: string, maxUnit: string, maxCount: number }> = {};
        const pivot: Record<number, PivotFamily> = {};

        // PASS 1: Metadata
        rawData.forEach((item) => {
            const familyId = (item.parentId && item.parentId !== 0) ? item.parentId : item.productId;
            if (!familyMeta[familyId]) {
                familyMeta[familyId] = {
                    name: item.productName || `Product ${familyId}`,
                    maxUnit: item.familyUnit || item.unit || 'PC',
                    maxCount: item.familyUnitCount || ((item.unitCount && item.unitCount > 0) ? item.unitCount : 1)
                };
            }
            if (item.unitCount && item.unitCount > familyMeta[familyId].maxCount) {
                familyMeta[familyId].maxCount = item.unitCount;
                // FIX: Fallback to 'PC' if item.unit is null to prevent TS2322
                familyMeta[familyId].maxUnit = item.unit || 'PC';
            }
            if (item.productId === familyId && item.productName) {
                familyMeta[familyId].name = item.productName;
            }
        });

        // PASS 2: Aggregate Base Pieces
        rawData.forEach((item) => {
            const familyId = (item.parentId && item.parentId !== 0) ? item.parentId : item.productId;
            const branchCol = item.branchName || (item.branchId ? `Branch ${item.branchId}` : 'Warehouse');
            branches.add(branchCol);

            if (!pivot[familyId]) {
                pivot[familyId] = { familyId, familyName: familyMeta[familyId].name, unit: familyMeta[familyId].maxUnit, movements: {} };
            }
            if (!pivot[familyId].movements[item.docType]) {
                pivot[familyId].movements[item.docType] = {};
            }
            if (!pivot[familyId].movements[item.docType][branchCol]) {
                pivot[familyId].movements[item.docType][branchCol] = 0;
            }

            const totalBasePieces = (item.inBase || 0) + (item.outBase || 0);
            pivot[familyId].movements[item.docType][branchCol] += totalBasePieces;
        });

        // PASS 3: Convert to highest unit AND build Summary Report
        const summaryMovements: Record<string, Record<string, number>> = {};

        Object.values(pivot).forEach(family => {
            const highestDivisor = familyMeta[family.familyId].maxCount;

            Object.keys(family.movements).forEach(docType => {
                if (!summaryMovements[docType]) summaryMovements[docType] = {};

                Object.keys(family.movements[docType]).forEach(branch => {
                    const boxQty = family.movements[docType][branch] / highestDivisor;
                    family.movements[docType][branch] = boxQty;

                    if (!summaryMovements[docType][branch]) summaryMovements[docType][branch] = 0;
                    summaryMovements[docType][branch] += boxQty;
                });
            });
        });

        return {
            pivotReport: {
                columns: Array.from(branches).sort(),
                families: Object.values(pivot).sort((a, b) => a.familyName.localeCompare(b.familyName))
            },
            summaryReport: {
                columns: Array.from(branches).sort(),
                movements: summaryMovements
            }
        };
    }, [rawData]);

    return {
        loading,
        error,
        pivotReport: parsedReports.pivotReport,
        summaryReport: parsedReports.summaryReport,
        generateReport
    };
};