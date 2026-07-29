import { cn } from "@/lib/cn";

type AvatarSize = "sm" | "md" | "lg";

const SIZES: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-9 w-9 text-sm",
  lg: "h-16 w-16 text-xl",
};

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase();
}

/** Avatar del usuario: usa su imagen si existe, o iniciales sobre degradado de marca. */
export function Avatar({
  nombre,
  src,
  size = "md",
  className,
}: {
  nombre: string;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={nombre}
        className={cn(
          "shrink-0 rounded-full object-cover ring-2 ring-surface",
          SIZES[size],
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-aurora-500 font-bold uppercase text-white",
        SIZES[size],
        className,
      )}
      aria-hidden
    >
      {iniciales(nombre)}
    </span>
  );
}
