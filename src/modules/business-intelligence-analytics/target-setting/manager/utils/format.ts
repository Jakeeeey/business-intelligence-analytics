import type { DirectusBool } from "../types";

export function isTrue(v: DirectusBool | undefined): boolean {
  if (v == null) return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "object" && Array.isArray((v as any).data)) return Number((v as any).data?.[0] ?? 0) === 1;
  return false;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function formatPeso(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(v);
}

export function formatMonthLabel(periodFrom: string, periodTo: string) {
  // Minimal label (e.g. "January 2026") based on period_from
  const d = new Date(periodFrom);
  if (Number.isNaN(d.getTime())) return `${periodFrom} → ${periodTo}`;
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}
