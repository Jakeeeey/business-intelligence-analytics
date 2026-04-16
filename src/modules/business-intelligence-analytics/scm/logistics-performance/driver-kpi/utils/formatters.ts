import { format } from "date-fns";

export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  try {
    return format(d, "yyyy-MM-dd HH:mm");
  } catch {
    return d.toISOString();
  }
}

export function formatCurrency(value?: number | null) {
  const amount = Number(value || 0);
  try {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  } catch {
    return `PHP ${amount.toFixed(2)}`;
  }
}

export function formatDurationFromMinutes(minutes: number | null | undefined) {
  if (minutes === null || minutes === undefined) return "-";
  const m = Math.round(minutes);
  const sign = m < 0 ? "-" : "";
  const abs = Math.abs(m);
  if (abs >= 1440) {
    const days = Math.floor(abs / 1440);
    const rem = abs % 1440;
    const h = Math.floor(rem / 60);
    const mm = rem % 60;
    return `${sign}${days}d ${h}h ${mm}m`;
  }
  if (abs >= 60) {
    const h = Math.floor(abs / 60);
    const mm = abs % 60;
    return `${sign}${h}h ${mm}m`;
  }
  return `${sign}${abs} min`;
}