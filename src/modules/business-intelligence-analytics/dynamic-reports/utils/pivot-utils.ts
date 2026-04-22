/**
 * Aggregation types for the pivot engine
 */
export type AggregationType = "sum" | "count" | "presence" | "average";

export interface PivotResult {
  rows: string[];
  columns: string[];
  matrix: Record<string, Record<string, any>>;
  rowTotals: Record<string, number>;
  colTotals: Record<string, number>;
  grandTotal: number;
}

/**
 * Transforms a flat JSON array into a pivot matrix.
 */
export function pivotData(
  data: any[],
  rowKey: string,
  colKey: string,
  valueKey: string,
  aggType: AggregationType
): PivotResult {
  const matrix: Record<string, Record<string, any>> = {};
  const rowSet = new Set<string>();
  const colSet = new Set<string>();
  
  const rowTotals: Record<string, number> = {};
  const colTotals: Record<string, number> = {};
  let grandTotal = 0;

  // Initialize numeric tracker for average
  const countTracker: Record<string, Record<string, number>> = {};

  data.forEach((item) => {
    const rVal = String(item[rowKey] ?? "N/A");
    const cVal = String(item[colKey] ?? "N/A");
    const vVal = item[valueKey];

    rowSet.add(rVal);
    colSet.add(cVal);

    if (!matrix[rVal]) matrix[rVal] = {};
    if (!countTracker[rVal]) countTracker[rVal] = {};

    // 1. Core Logic
    if (aggType === "presence") {
      matrix[rVal][cVal] = true;
    } else {
      const num = Number(vVal) || 0;
      
      if (aggType === "sum") {
        matrix[rVal][cVal] = (matrix[rVal][cVal] || 0) + num;
        rowTotals[rVal] = (rowTotals[rVal] || 0) + num;
        colTotals[cVal] = (colTotals[cVal] || 0) + num;
        grandTotal += num;
      } else if (aggType === "count") {
        matrix[rVal][cVal] = (matrix[rVal][cVal] || 0) + 1;
        rowTotals[rVal] = (rowTotals[rVal] || 0) + 1;
        colTotals[cVal] = (colTotals[cVal] || 0) + 1;
        grandTotal += 1;
      } else if (aggType === "average") {
        countTracker[rVal][cVal] = (countTracker[rVal][cVal] || 0) + 1;
        const currentSum = (matrix[rVal][cVal] || 0) * (countTracker[rVal][cVal] - 1);
        matrix[rVal][cVal] = (currentSum + num) / countTracker[rVal][cVal];
        
        // Totals for average are tricky, we'll keep them as sums for the Grand Totals
        rowTotals[rVal] = (rowTotals[rVal] || 0) + num;
        colTotals[cVal] = (colTotals[cVal] || 0) + num;
        grandTotal += num;
      }
    }
  });

  return {
    rows: Array.from(rowSet).sort(),
    columns: Array.from(colSet).sort(),
    matrix,
    rowTotals,
    colTotals,
    grandTotal,
  };
}
