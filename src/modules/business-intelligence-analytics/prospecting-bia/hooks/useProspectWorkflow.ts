"use client";

import * as React from "react";
import { toast } from "sonner";
import type { ApiResult, ProspectStatus } from "../types";

/** Optional marketing input captured alongside a status change. */
export interface ProspectUpdateOptions {
  percentage?: number | null;
  remarks?: string | null;
  /** Philippine wall-clock "YYYY-MM-DDTHH:mm"; the route converts it to UTC. */
  schedule?: string | null;
}

/**
 * Mutation helpers for the prospecting workflow. All writes go through the
 * module's own API routes (which hold the Directus token server-side); the
 * client never talks to Directus directly.
 */
export function useProspectWorkflow() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  /**
   * Moves a prospect to a new status, optionally capturing marketing input.
   * Only the keys actually provided are sent, so unrelated columns are left untouched.
   * @param {number} id - The prospect id.
   * @param {ProspectStatus} status - The target status.
   * @param {ProspectUpdateOptions} [options] - Optional probability / remarks / schedule.
   * @returns {Promise<boolean>} True on success.
   */
  const updateStatus = React.useCallback(
    async (id: number, status: ProspectStatus, options?: ProspectUpdateOptions): Promise<boolean> => {
      setIsSubmitting(true);
      try {
        const payload: Record<string, unknown> = { prospect_status: status };
        if (options && "percentage" in options) payload.percentage = options.percentage ?? null;
        if (options?.remarks !== undefined) payload.remarks = options.remarks;
        if (options?.schedule !== undefined) payload.schedule = options.schedule;

        const res = await fetch(`/api/bia/prospecting-bia/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body: ApiResult = await res.json();
        if (!res.ok || !body.success) {
          throw new Error(body.message || "Failed to update prospect");
        }
        toast.success("Prospect updated", { description: body.message });
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred";
        toast.error("Error", { description: message });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  /**
   * Converts a won prospect into a customer record.
   * @param {number} id - The prospect id.
   * @returns {Promise<boolean>} True on success.
   */
  const convertToCustomer = React.useCallback(async (id: number): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/bia/prospecting-bia/${id}/convert`, { method: "POST" });
      const body: ApiResult = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.message || "Failed to convert prospect");
      }
      toast.success("Converted", { description: body.message });
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      toast.error("Error", { description: message });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { isSubmitting, updateStatus, convertToCustomer };
}
