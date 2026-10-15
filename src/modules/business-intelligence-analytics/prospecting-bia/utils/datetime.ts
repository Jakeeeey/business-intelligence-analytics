/**
 * Timezone helpers for this module. The DB stores UTC; Philippine wall-clock
 * (Asia/Manila, UTC+8, no DST) is only used at the input/display boundary.
 */

const PH_OFFSET_MS = 8 * 60 * 60 * 1000;

/** Canonical UTC audit timestamp: ISO-8601 with milliseconds stripped. */
export function nowUTC(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * Converts a Philippine wall-clock date + time into a stored UTC ISO string.
 * @param {string} date - PH date as "YYYY-MM-DD".
 * @param {string} time - PH time as "HH:mm".
 * @returns {string | null} A UTC ISO string, or null when the input is invalid.
 */
export function phLocalToUtcIso(date: string, time: string): string | null {
  if (!date) return null;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (time || "00:00").split(":").map(Number);
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) return null;
  const utcMs = Date.UTC(y, m - 1, d, hh, mm) - PH_OFFSET_MS;
  return new Date(utcMs).toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * Formats a stored UTC instant as Philippine local date + time for display.
 * Directus returns DATETIME values without a timezone suffix (even though they
 * are stored as UTC), so a bare ISO string is normalized to UTC before parsing.
 * @param {string | null} utcIso - A UTC ISO string.
 * @returns {string} The formatted PH local value, or the raw value when unparseable.
 */
export function formatPH(utcIso?: string | null): string {
  if (!utcIso) return "—";
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(utcIso);
  const d = new Date(hasZone ? utcIso : `${utcIso}Z`);
  if (Number.isNaN(d.getTime())) return utcIso;
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
