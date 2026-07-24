import { cn } from "@/lib/cn";

/** The Nuvio "N" mark, rebuilt as theme-aware SVG (adapts to light/dark). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden>
      {/* left vertical bar */}
      <rect className="logo-bar" x="20" y="22" width="15" height="56" rx="7.5" />
      {/* right vertical bar */}
      <rect className="logo-bar" x="65" y="22" width="15" height="56" rx="7.5" />
      {/* diagonal bar */}
      <rect
        className="logo-diag"
        x="42.5"
        y="18"
        width="15"
        height="64"
        rx="7.5"
        transform="rotate(18 50 50)"
      />
      {/* center dot */}
      <circle className="logo-dot" cx="50" cy="50" r="7.5" />
    </svg>
  );
}

type LogoProps = {
  className?: string;
  /** "full" shows the wordmark next to the mark; "icon" shows only the mark. */
  variant?: "full" | "icon";
  href?: string | null;
};

export function Logo({ className, variant = "full", href = "#top" }: LogoProps) {
  const content = (
    <>
      <span className="relative grid h-9 w-9 shrink-0 place-items-center">
        <LogoMark className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
      </span>
      {variant === "full" && (
        <span className="font-display text-2xl font-extrabold lowercase tracking-tight text-ink">
          nuvio
        </span>
      )}
    </>
  );

  if (href === null) {
    return <span className={cn("inline-flex items-center gap-2", className)}>{content}</span>;
  }

  return (
    <a
      href={href}
      className={cn("group inline-flex items-center gap-2", className)}
      aria-label="Nuvio — inicio"
    >
      {content}
    </a>
  );
}
