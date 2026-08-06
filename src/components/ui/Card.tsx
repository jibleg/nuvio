import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Contenedor base del design system: borde + superficie + sombra suave, con slots opcionales de header/footer. */
export function Card({
  title,
  description,
  action,
  footer,
  className,
  bodyClassName,
  children,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children?: ReactNode;
}) {
  const hasHeader = title || description || action;
  return (
    <div className={cn("rounded-2xl border border-line bg-surface shadow-soft", className)}>
      {hasHeader && (
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="font-display text-base font-bold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children && <div className={bodyClassName ?? "p-5"}>{children}</div>}
      {footer && <div className="border-t border-line px-5 py-4">{footer}</div>}
    </div>
  );
}
