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

type LogoSize = "md" | "lg";

const SIZES: Record<LogoSize, { mark: string; text: string }> = {
  md: { mark: "h-9 w-9", text: "text-2xl" },
  /** 20% más grande que "md" (mark: 2.25rem → 2.7rem, texto: 1.5rem → 1.8rem). */
  lg: { mark: "h-[2.7rem] w-[2.7rem]", text: "text-[1.8rem]" },
};

type LogoProps = {
  className?: string;
  /** "full" shows the wordmark next to the mark; "icon" shows only the mark. */
  variant?: "full" | "icon";
  href?: string | null;
  size?: LogoSize;
};

export function Logo({ className, variant = "full", href = "#top", size = "md" }: LogoProps) {
  const s = SIZES[size];
  const content = (
    <>
      <span className={cn("relative grid shrink-0 place-items-center", s.mark)}>
        <LogoMark className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
      </span>
      {variant === "full" && (
        <span className={cn("font-display font-extrabold lowercase tracking-tight text-ink", s.text)}>
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
