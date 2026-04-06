// import type { LeadTimeStatus } from "../types";

export const getStatusColor = (status?: string | null): string => {
  // Return a combined set of classes (bg + text) with dark: variants
  if (!status) return "bg-white dark:bg-transparent";
  const s = String(status).toLowerCase();
  if (s === "on-time" || s === "on time" || s === "ontime")
    return "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100 border dark:border-emerald-700/60 border-emerald-200";
  if (s === "warning" || s === "warn")
    return "bg-orange-300/70 text-orange-900 dark:bg-orange-900/30 dark:text-orange-100 border dark:border-orange-300/50 border-orange-300";
  if (s === "delayed" || s === "delay" || s === "late")
    return "bg-red-400/80 text-red-900 dark:bg-red-900/30 dark:text-red-100 border dark:border-red-400/60 border-red-400";
  return "bg-white dark:bg-transparent";
};

export default getStatusColor;
