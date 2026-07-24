import type { ReactNode } from "react";

export function Badge({
  children,
  onDark = false,
}: {
  children: ReactNode;
  onDark?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${
        onDark
          ? "glass-dark text-white/80"
          : "border border-brand-100 bg-brand-50/70 text-brand-700"
      }`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aurora-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-aurora-500" />
      </span>
      {children}
    </span>
  );
}
