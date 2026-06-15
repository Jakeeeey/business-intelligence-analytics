import type { CustomerLeadTimeRecord, CustomerLeadTimeRow } from "../types";

/**
 * Parse a date string (YYYY-MM-DD HH:mm:ss or ISO) as a local Date timestamp.
 * Returns NaN if unparseable.
 */
function parseDateLocal(s: string | null | undefined): number {
  if (!s) return NaN;
  const str = String(s).trim();
  // Handle "YYYY-MM-DD HH:mm:ss" format
  const match = str.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/,
  );
  if (match) {
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4] ?? 0),
      Number(match[5] ?? 0),
      Number(match[6] ?? 0),
    ).getTime();
  }
  const t = Date.parse(str);
  return Number.isNaN(t) ? NaN : t;
}

/**
 * Format a local timestamp back to "YYYY-MM-DD HH:mm:ss" string format.
 */
function formatTimestampLocal(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}:${s}`;
}

/**
 * Compute the difference in days between two timestamps.
 * Returns null if either timestamp is NaN.
 */
function getDiffDays(fromMs: number, toMs: number): number | null {
  if (Number.isNaN(fromMs) || Number.isNaN(toMs)) return null;
  const diff = (toMs - fromMs) / (1000 * 60 * 60 * 24);
  return Math.round(diff * 100) / 100; // 2 decimal precision
}

/**
 * Normalize raw API records into CustomerLeadTimeRow[] with computed/estimated stage day diffs.
 */
export function normalizeRecords(
  records: CustomerLeadTimeRecord[],
): CustomerLeadTimeRow[] {
  return records.map((r) => {
    // 1. Get raw timestamps for the 5 lifecycle points
    const t0 = parseDateLocal(r.createdDate);
    const t1 = parseDateLocal(r.approvedDate);
    const t2 = parseDateLocal(r.pickedConsoDate);
    const t3 = parseDateLocal(r.dispatchedDate);
    const t4 = parseDateLocal(r.deliveredDate);

    const t = [t0, t1, t2, t3, t4];
    const estimated = [...t];

    // 2. Perform linear interpolation for intermediate null dates
    for (let i = 0; i < t.length; i++) {
      if (Number.isNaN(t[i])) {
        // Find nearest left non-NaN index
        let leftIdx = -1;
        for (let j = i - 1; j >= 0; j--) {
          if (!Number.isNaN(t[j])) {
            leftIdx = j;
            break;
          }
        }

        // Find nearest right non-NaN index
        let rightIdx = -1;
        for (let j = i + 1; j < t.length; j++) {
          if (!Number.isNaN(t[j])) {
            rightIdx = j;
            break;
          }
        }

        // If bounded on both sides, we can estimate/interpolate the date
        if (leftIdx !== -1 && rightIdx !== -1) {
          const leftVal = t[leftIdx];
          const rightVal = t[rightIdx];
          const steps = rightIdx - leftIdx;
          const stepSize = (rightVal - leftVal) / steps;
          estimated[i] = leftVal + stepSize * (i - leftIdx);
        }
      }
    }

    // 3. Re-serialize any estimated dates to string format for presentation
    const createdDate =
      Number.isNaN(t0) && !Number.isNaN(estimated[0])
        ? formatTimestampLocal(estimated[0])
        : r.createdDate;
    const approvedDate =
      Number.isNaN(t1) && !Number.isNaN(estimated[1])
        ? formatTimestampLocal(estimated[1])
        : r.approvedDate;
    const pickedConsoDate =
      Number.isNaN(t2) && !Number.isNaN(estimated[2])
        ? formatTimestampLocal(estimated[2])
        : r.pickedConsoDate;
    const dispatchedDate =
      Number.isNaN(t3) && !Number.isNaN(estimated[3])
        ? formatTimestampLocal(estimated[3])
        : r.dispatchedDate;
    const deliveredDate =
      Number.isNaN(t4) && !Number.isNaN(estimated[4])
        ? formatTimestampLocal(estimated[4])
        : r.deliveredDate;

    // 4. Calculate day diffs using the estimated timestamps
    const approvalDays = getDiffDays(estimated[0], estimated[1]);
    const pickingDays = getDiffDays(estimated[1], estimated[2]);
    const dispatchDays = getDiffDays(estimated[2], estimated[3]);
    const deliveryDays = getDiffDays(estimated[3], estimated[4]);

    return {
      ...r,
      createdDate,
      approvedDate,
      pickedConsoDate,
      dispatchedDate,
      deliveredDate,
      approvalDays,
      pickingDays,
      dispatchDays,
      deliveryDays,
    };
  });
}

export default normalizeRecords;
