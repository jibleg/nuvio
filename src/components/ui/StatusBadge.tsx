import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type StatusTone = "neutral" | "brand" | "success" | "warning" | "danger";

const TONES: Record<StatusTone, string> = {
  neutral: "bg-cloud text-muted",
  brand: "bg-brand-50 text-brand-700 dark:text-brand-200",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-sunrise-400/15 text-sunrise-600 dark:text-sunrise-300",
  danger: "bg-red-500/10 text-red-500",
};

/** Chip de estado con tono semántico. El texto/dominio (borrador, timbrada, vencida…) lo decide quien lo usa. */
export function StatusBadge({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: StatusTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
