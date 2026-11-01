import { formatDistanceStrict } from "date-fns";
import { toUtcDate } from "./datetime";
import type { ProspectStatus } from "../types";

/** A follow-up due within this many days is flagged as "due soon". */
export const DUE_SOON_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

export type ScheduleUrgency = "none" | "overdue" | "soon" | "later";

/**
 * Classifies a follow-up schedule into an urgency bucket using the project's
 * deadline tones: overdue → destructive, due soon → warning, otherwise neutral.
 * @param {string | null} value - The stored UTC schedule value.
 * @param {number | null} nowMs - "Now" captured from state (keeps render pure).
 * @returns {ScheduleUrgency} The urgency bucket.
 */
export function getScheduleUrgency(
  value: string | null | undefined,
  nowMs: number | null
): ScheduleUrgency {
  const date = toUtcDate(value);
  if (!date || nowMs === null) return "none";
  const diff = date.getTime() - nowMs;
  if (diff < 0) return "overdue";
  if (diff <= DUE_SOON_DAYS * DAY_MS) return "soon";
  return "later";
}

/**
 * Human relative label for a schedule (e.g. "in 4 days", "2 days ago"),
 * computed against a supplied "now" so render stays pure.
 */
export function formatScheduleRelative(
  value: string | null | undefined,
  nowMs: number | null
): string | null {
  const date = toUtcDate(value);
  if (!date || nowMs === null) return null;
  return formatDistanceStrict(date, new Date(nowMs), { addSuffix: true });
}

/**
 * Terminal wording for a finished follow-up. Once a prospect is converted or
 * dropped, the schedule is no longer pending — the cell states the outcome.
 */
export const FOLLOW_UP_TERMINAL_LABEL: Partial<Record<ProspectStatus, string>> = {
  converted: "Completed",
  dropped: "Cancelled",
};

/**
 * Tinted pill classes per urgency — the same token mechanism as the status
 * pill, but tinted rather than solid so the schedule stays secondary to status.
 */
export const SCHEDULE_URGENCY_PILL: Record<ScheduleUrgency, string> = {
  none: "border-border bg-muted text-muted-foreground",
  overdue: "border-destructive/30 bg-destructive/10 text-destructive",
  soon: "border-warning/30 bg-warning/10 text-warning",
  later: "border-border bg-muted/60 text-foreground/75",
};
