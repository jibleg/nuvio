import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/** Mismo patrón visual del resumen de superadmin: icono con degradado + número grande + label. */
export function StatTile({
  icon: Icon,
  label,
  value,
  accent = "from-brand-400 to-aurora-500",
  hint,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  /** Clases de degradado Tailwind, ej. "from-emerald-400 to-brand-500". */
  accent?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-line bg-surface p-5 shadow-soft", className)}>
      <span
        className={cn("grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm", accent)}
      >
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink">{value}</p>
      <p className="text-sm text-muted">{label}</p>
      {hint && <p className="mt-1 text-xs text-muted/80">{hint}</p>}
    </div>
  );
}
