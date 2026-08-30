import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { BiomarkerStatus, OverallStatus, TrendDirection } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Status helpers ─────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<
  BiomarkerStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  CRITICAL_LOW: {
    label: "Critical ↓",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    dot: "bg-rose-600",
  },
  LOW: {
    label: "Low ↓",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  BORDERLINE_LOW: {
    label: "Borderline ↓",
    color: "text-amber-600",
    bg: "bg-amber-50/80",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  NORMAL: {
    label: "Normal ✓",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  BORDERLINE_HIGH: {
    label: "Borderline ↑",
    color: "text-amber-600",
    bg: "bg-amber-50/80",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  HIGH: {
    label: "High ↑",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    dot: "bg-orange-500",
  },
  CRITICAL_HIGH: {
    label: "Critical ↑",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    dot: "bg-rose-600",
  },
  UNKNOWN: {
    label: "Unclassified",
    color: "text-slate-600",
    bg: "bg-slate-100",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  INFORMATIONAL: {
    label: "Info ℹ",
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
    dot: "bg-sky-500",
  },
};

export const OVERALL_STATUS_CONFIG: Record<
  OverallStatus,
  { label: string; color: string; bg: string; description: string }
> = {
  normal: {
    label: "All Normal",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    description: "All your biomarkers are within normal range.",
  },
  attention: {
    label: "Needs Attention",
    color: "text-amber-700",
    bg: "bg-amber-50",
    description: "Some values are outside the normal range. Discuss with your doctor.",
  },
  urgent: {
    label: "Follow Up Soon",
    color: "text-rose-700",
    bg: "bg-rose-50",
    description: "Critical values detected. Please consult your doctor promptly.",
  },
};

export const TREND_CONFIG: Record<
  TrendDirection,
  { label: string; icon: string; color: string }
> = {
  improving: { label: "Improving", icon: "↗", color: "text-emerald-600" },
  stable: { label: "Stable", icon: "→", color: "text-sky-600" },
  worsening: { label: "Worsening", icon: "↘", color: "text-rose-600" },
  insufficient_data: { label: "Not enough data", icon: "–", color: "text-slate-400" },
};

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function formatValue(value: number | null | undefined, unit: string): string {
  if (value == null) return "—";
  const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(2);
  return `${formatted} ${unit}`;
}
