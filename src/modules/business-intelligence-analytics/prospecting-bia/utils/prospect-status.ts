import { PROSPECT_STATUSES, type ProspectStatus } from "../types";

/**
 * Legacy status values that predate the workflow.
 * "approved" was the old won state; it now reads as "converted".
 */
const LEGACY_STATUS_MAP: Record<string, ProspectStatus> = {
  approved: "converted",
};

/**
 * Normalizes a raw `prospect_status` value from Directus into a canonical status.
 * Handles the mixed casing present in the DB (e.g. "Pending", "Approved") and legacy values.
 * @param {unknown} raw - The raw status value returned by the API.
 * @returns {ProspectStatus} A canonical lowercase prospect status.
 */
export function normalizeProspectStatus(raw: unknown): ProspectStatus {
  const value = String(raw ?? "").trim().toLowerCase();
  if (value in LEGACY_STATUS_MAP) return LEGACY_STATUS_MAP[value];
  if ((PROSPECT_STATUSES as readonly string[]).includes(value)) {
    return value as ProspectStatus;
  }
  return "pending";
}

/** Human-readable labels per status. */
export const PROSPECT_STATUS_LABEL: Record<ProspectStatus, string> = {
  pending: "Pending",
  contacted: "Contacted",
  "follow-up": "Follow-up",
  converted: "Converted",
  dropped: "Dropped",
};

/**
 * Solid status fill per status. Uses the same semantic tokens as the status
 * tabs (info / primary / warning / success / destructive) so the hue matches,
 * but filled solid (with the token's foreground colour) for the table pills.
 */
export const PROSPECT_STATUS_PILL: Record<ProspectStatus, string> = {
  pending: "border-transparent bg-info text-info-foreground",
  contacted: "border-transparent bg-warning text-warning-foreground",
  "follow-up": "border-transparent bg-primary text-primary-foreground",
  converted: "border-transparent bg-success text-success-foreground",
  dropped: "border-transparent bg-destructive text-destructive-foreground",
};
