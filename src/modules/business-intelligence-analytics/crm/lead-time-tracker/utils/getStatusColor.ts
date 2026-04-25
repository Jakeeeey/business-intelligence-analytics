// import type { LeadTimeStatus } from "../types";

export const getStatusColor = (status?: string | null): string => {
  // Return a combined set of classes (bg + text) with dark: variants
  if (!status) return "bg-slate-100/80 text-slate-600 border border-dashed border-slate-300 dark:bg-slate-700/30 dark:text-slate-300 dark:border-slate-500";
  const s = String(status).toLowerCase();
  if (s === "done")
    return "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100 border dark:border-emerald-700/60 border-emerald-200";
  if (s === "invalid")
    return "bg-slate-200/90 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600";
  if (s === "on-time" || s === "on time" || s === "ontime")
    return "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100 border dark:border-emerald-700/60 border-emerald-200";
  if (s === "warning" || s === "warn")
    return "bg-orange-300/70 text-orange-900 dark:bg-orange-900/30 dark:text-orange-100 border dark:border-orange-300/50 border-orange-300";
  if (s === "delayed" || s === "delay" || s === "late")
    return "bg-red-400/80 text-red-900 dark:bg-red-900/30 dark:text-red-100 border dark:border-red-400/60 border-red-400";
  return "bg-slate-100/80 text-slate-600 border border-dashed border-slate-300 dark:bg-slate-700/30 dark:text-slate-300 dark:border-slate-500";
};

export const getStatusHex = (status?: string | null): string => {
  if (!status) return "#9ca3af"; // neutral / pending
  const s = String(status).toLowerCase();
  if (s === "done") return "#10b981";
  if (s === "invalid") return "#94a3b8";
  if (s === "on-time" || s === "on time" || s === "ontime") return "#10b981"; // green
  if (s === "warning" || s === "warn") return "#f59e0b"; // orange
  if (s === "delayed" || s === "delay" || s === "late") return "#ef4444"; // red
  return "#9ca3af";
};

export default getStatusColor;
