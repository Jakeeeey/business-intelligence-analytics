import type {
  DisbursementRecord,
  ExpenseFilters,
  ExpenseKpis,
  ExpenseByCategory,
  ExpenseByEmployee,
  ExpenseByDivision,
  DisbursementSummary,
  ExpenseByPeriod,
} from "../type";

export async function fetchDisbursements(
  startDate: string,
  endDate: string,
): Promise<DisbursementRecord[]> {
  const response = await fetch(
    `/api/bia/expense-report?startDate=${startDate}&endDate=${endDate}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch disbursements: ${response.statusText}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Calculate KPIs from filtered disbursement records
 */
export function calculateKpis(records: DisbursementRecord[]): ExpenseKpis {
  // Deduplicate records by disbursementId to avoid counting header-level totals multiple times
  // (multiple line items with the same disbursementId share the same totalAmount/paidAmount)
  const uniqueDocuments = new Map<number, DisbursementRecord>();
  records.forEach((r) => {
    if (!uniqueDocuments.has(r.disbursementId)) {
      uniqueDocuments.set(r.disbursementId, r);
    }
  });

  const uniqueRecords = Array.from(uniqueDocuments.values());

  const totalDisbursementAmount = uniqueRecords.reduce(
    (sum, r) => sum + (r.totalAmount || 0),
    0,
  );
  const totalPaidAmount = uniqueRecords.reduce(
    (sum, r) => sum + (r.paidAmount || 0),
    0,
  );
  const outstandingBalance = totalDisbursementAmount - totalPaidAmount;
  const totalTransactions = uniqueRecords.length;
  const totalLineTransaction = new Set(records.map((r) => r.lineId)).size;
  const postedTransactions = uniqueRecords.filter(
    (r) => r.isPosted === 1,
  ).length;
  const pendingApprovalsCount = uniqueRecords.filter(
    (r) => r.isPosted === 0,
  ).length;

  // Calculate tax withholding impact:
  // Identify records whose COA title indicates withholding (case-insensitive)
  // and sum their lineAmount absolute values to represent the total withholding impact.
  const withholdingKeywords = ["withhold", "withholding", "ewt"];
  const taxWithholdingImpact = records.reduce((sum, r) => {
    const title = (r.coaTitle || "").toLowerCase();
    const isWithholding = withholdingKeywords.some((kw) => title.includes(kw));
    if (!isWithholding) return sum;
    const amt = r.lineAmount || 0;
    // Use absolute value so the KPI represents the magnitude of withholding (positive number)
    return sum + Math.abs(amt);
  }, 0);

  return {
    totalDisbursementAmount,
    totalPaidAmount,
    outstandingBalance,
    totalTransactions,
    totalLineTransaction,
    postedTransactions,
    pendingApprovalsCount,
    taxWithholdingImpact,
  };
}

/**
 * Get unique values for filters from records
 */
export function getFilterOptions(records: DisbursementRecord[]) {
  const employees = Array.from(
    new Set(records.map((r) => r.payeeName).filter(Boolean)),
  ).sort();
  const divisions = Array.from(
    new Set(records.map((r) => r.divisionName).filter(Boolean)),
  ).sort();
  const encoders = Array.from(
    new Set(records.map((r) => r.encoderName).filter(Boolean)),
  ).sort();
  const coaAccounts = Array.from(
    new Set(records.map((r) => r.coaTitle).filter(Boolean)),
  ).sort();
  const transactionTypes = Array.from(
    new Set(records.map((r) => r.transactionTypeName).filter(Boolean)),
  ).sort();
  const statuses = Array.from(
    new Set(
      records
        .map((r) => (r.isPosted === 1 ? "Posted" : "Pending"))
        .filter(Boolean),
    ),
  ).sort();

  return {
    employees,
    divisions,
    encoders,
    coaAccounts,
    transactionTypes,
    statuses,
  };
}

/**
 * Filter records based on applied filters
 */
export function filterRecords(
  records: DisbursementRecord[],
  filters: ExpenseFilters,
): DisbursementRecord[] {
  return records.filter((record) => {
    // Employee filter
    if (
      filters.employees.length > 0 &&
      !filters.employees.includes(record.payeeName)
    ) {
      return false;
    }

    // Division filter
    if (
      filters.divisions.length > 0 &&
      !filters.divisions.includes(record.divisionName)
    ) {
      return false;
    }

    // Encoder filter
    if (
      filters.encoders.length > 0 &&
      !filters.encoders.includes(record.encoderName)
    ) {
      return false;
    }

    // COA filter
    if (
      filters.coaAccounts.length > 0 &&
      !filters.coaAccounts.includes(record.coaTitle)
    ) {
      return false;
    }

    // Transaction type filter
    if (
      filters.transactionTypes.length > 0 &&
      !filters.transactionTypes.includes(record.transactionTypeName)
    ) {
      return false;
    }

    // Status filter
    const recordStatus = record.isPosted === 1 ? "Posted" : "Pending";
    if (
      filters.statuses.length > 0 &&
      !filters.statuses.includes(recordStatus)
    ) {
      return false;
    }

    // Date range filter
    const recordDate = new Date(record.transactionDate);
    const fromDate = new Date(filters.dateFrom);
    const toDate = new Date(filters.dateTo);
    if (recordDate < fromDate || recordDate > toDate) {
      return false;
    }

    return true;
  });
}

/**
 * Calculate expenses grouped by COA (Chart of Account)
 */
export function calculateExpensesByCategory(
  records: DisbursementRecord[],
): ExpenseByCategory[] {
  const grouped = new Map<string, number>();
  let total = 0;

  records.forEach((record) => {
    const amount = record.lineAmount || 0;
    grouped.set(record.coaTitle, (grouped.get(record.coaTitle) || 0) + amount);
    total += amount;
  });

  return Array.from(grouped.entries())
    .map(([coaTitle, amount]) => ({
      coaTitle,
      totalAmount: amount,
      percentShare: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Calculate expenses grouped by employee/payee
 */
export function calculateExpensesByEmployee(
  records: DisbursementRecord[],
): ExpenseByEmployee[] {
  // Deduplicate by document number first
  const uniqueByDoc = new Map<string, DisbursementRecord>();
  for (const r of records) {
    const key = r.docNo || String(r.disbursementId);
    if (!uniqueByDoc.has(key)) uniqueByDoc.set(key, r);
  }
  const deduped = Array.from(uniqueByDoc.values());

  // Aggregate by payee
  const grouped = new Map<string, { totalAmount: number; count: number }>();
  let total = 0;

  deduped.forEach((record) => {
    const amount = record.totalAmount || 0;
    const current = grouped.get(record.payeeName) || {
      totalAmount: 0,
      count: 0,
    };
    grouped.set(record.payeeName, {
      totalAmount: current.totalAmount + amount,
      count: current.count + 1,
    });
    total += amount;
  });

  // Return sorted array
  return Array.from(grouped.entries())
    .map(([payeeName, data]) => ({
      payeeName,
      totalAmount: data.totalAmount,
      percentShare: total > 0 ? (data.totalAmount / total) * 100 : 0,
      transactionCount: data.count,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Calculate expenses grouped by division
 */
export function calculateExpensesByDivision(
  records: DisbursementRecord[],
): ExpenseByDivision[] {
  // Deduplicate by document number first
  const uniqueByDoc = new Map<string, DisbursementRecord>();
  for (const r of records) {
    const key = r.docNo || String(r.disbursementId);
    if (!uniqueByDoc.has(key)) uniqueByDoc.set(key, r);
  }
  const deduped = Array.from(uniqueByDoc.values());

  // Aggregate totals by division
  const grouped = new Map<string, { totalAmount: number; count: number }>();
  let total = 0;

  deduped.forEach((record) => {
    const amount = record.totalAmount || 0;
    const current = grouped.get(record.divisionName) || {
      totalAmount: 0,
      count: 0,
    };
    grouped.set(record.divisionName, {
      totalAmount: current.totalAmount + amount,
      count: current.count + 1,
    });
    total += amount;
  });

  // Return sorted array
  return Array.from(grouped.entries())
    .map(([divisionName, data]) => ({
      divisionName,
      totalAmount: data.totalAmount,
      percentShare: total > 0 ? (data.totalAmount / total) * 100 : 0,
      transactionCount: data.count,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}
/**
 * Calculate expenses grouped by time period
 */
export function calculateExpensesByPeriod(
  records: DisbursementRecord[],
  granularity: "daily" | "weekly" | "monthly",
): ExpenseByPeriod[] {
  const grouped = new Map<string, { totalAmount: number; count: number }>();

  records.forEach((record) => {
    const date = new Date(record.transactionDate);
    let period = "";

    if (granularity === "daily") {
      period = record.transactionDate;
    } else if (granularity === "weekly") {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      period = weekStart.toISOString().split("T")[0];
    } else if (granularity === "monthly") {
      period = record.transactionDate.substring(0, 7); // YYYY-MM
    }

    const amount = record.lineAmount || 0;
    const current = grouped.get(period) || { totalAmount: 0, count: 0 };
    grouped.set(period, {
      totalAmount: current.totalAmount + amount,
      count: current.count + 1,
    });
  });

  return Array.from(grouped.entries())
    .map(([period, data]) => ({
      period,
      totalAmount: data.totalAmount,
      transactionCount: data.count,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Convert filtered records to disbursement summaries grouped by COA
 */
export function getDisbursementSummariesGroupedByCoA(
  records: DisbursementRecord[],
): { coaTitle: string; total: number; records: DisbursementSummary[] }[] {
  const grouped = new Map<string, DisbursementRecord[]>();

  // Group records by COA
  records.forEach((record) => {
    if (!grouped.has(record.coaTitle)) grouped.set(record.coaTitle, []);
    grouped.get(record.coaTitle)!.push(record);
  });

  return Array.from(grouped.entries())
    .map(([coaTitle, coaRecords]) => {
      // Get unique documents by disbursementId for COA total
      const uniqueDocs = new Map<number, DisbursementRecord>();
      coaRecords.forEach((r) => {
        if (!uniqueDocs.has(r.disbursementId)) {
          uniqueDocs.set(r.disbursementId, r);
        }
      });
      // Sum header-level totalAmount for each unique document
      const total = Array.from(uniqueDocs.values()).reduce(
        (sum, r) => sum + (r.totalAmount || 0),
        0,
      );

      // Group by document number within this COA to produce document-level summaries
      const docsMap = new Map<string, DisbursementRecord[]>();
      coaRecords.forEach((r) => {
        const key = r.docNo || String(r.disbursementId);
        if (!docsMap.has(key)) docsMap.set(key, []);
        docsMap.get(key)!.push(r);
      });

      const recordsSummaries: DisbursementSummary[] = Array.from(
        docsMap.entries(),
      ).map(([docNo, docLines]) => {
        const first = docLines[0];
        // Use header-level totalAmount and paidAmount from first record
        // (same for all records with same disbursementId)
        const totalAmount = first.totalAmount || 0;
        const paidAmount = first.paidAmount || 0;

        const balance = totalAmount - paidAmount;

        return {
          disbursementId: first.disbursementId,
          docNo: docNo,
          payeeName: first.payeeName,
          divisionName: first.divisionName,
          coaTitle: first.coaTitle,
          totalAmount: totalAmount,
          paidAmount: paidAmount,
          balance,
          transactionDate: first.transactionDate,
          status: first.isPosted === 1 ? "Posted" : "Pending",
          encoderName: first.encoderName,
          lineRemarks: first.lineRemarks,
          lines: docLines,
        };
      });

      // Sort documents by transactionDate desc
      recordsSummaries.sort((a, b) =>
        a.transactionDate < b.transactionDate ? 1 : -1,
      );

      return {
        coaTitle,
        total,
        records: recordsSummaries,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export async function getCurrentUserName(): Promise<string | null> {
  try {
    const res = await fetch("/src/app/api/bia/expense-report/route.ts/me", {
      cache: "no-store",
      credentials: "include",
    });
    if (!res.ok) return null;
    const j = await res.json();
    if (j?.ok && j?.name) return j.name;
    return null;
  } catch (e) {
    console.warn("Failed to fetch current user", e);
    return null;
  }
}
