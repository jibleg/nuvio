"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShieldCheck } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Avatar } from "@/components/ui/Avatar";
import { useSession } from "@/features/auth/components/SessionProvider";
import { ModuleIcon } from "./module-icons";

export type SidebarAccent = "brand" | "aurora" | "sky" | "sunrise";

export type SidebarItem = {
  label: string;
  href: string;
  icon: string;
  /** Color de acento del icono. */
  accent?: SidebarAccent;
  /** Coincidencia exacta (para el "Inicio" del módulo). */
  exact?: boolean;
};

const ACCENTS: Record<SidebarAccent, { tile: string; grad: string }> = {
  brand: {
    tile: "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
    grad: "from-brand-400 to-brand-600",
  },
  aurora: {
    tile: "bg-aurora-300/30 text-aurora-600 dark:bg-aurora-500/15 dark:text-aurora-300",
    grad: "from-aurora-400 to-aurora-600",
  },
  sky: {
    tile: "bg-sky-soft/40 text-brand-600 dark:bg-brand-400/15 dark:text-brand-300",
    grad: "from-sky-soft to-brand-400",
  },
  sunrise: {
    tile: "bg-sunrise-300/40 text-sunrise-500 dark:bg-sunrise-400/15",
    grad: "from-sunrise-300 to-sunrise-500",
  },
};

/**
 * Marco de un módulo: sidebar premium fijo en escritorio y drawer con botón en
 * tablet/móvil. Iconos con acento de color; la ruta activa se resalta.
 */
export function ModuleShell({
  titulo,
  icon = "grid",
  items,
  children,
}: {
  titulo: string;
  icon?: string;
  items: SidebarItem[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { usuario } = useSession();
  const [navOpen, setNavOpen] = useState(false);

  // Perfil dentro del módulo actual, para no sacar al operador de su contexto.
  const moduleBase = `/${pathname.split("/")[1] ?? ""}`;
  const perfilHref = `${moduleBase}/perfil`;

  const esActivo = (item: SidebarItem) =>
    pathname === item.href ||
    (!item.exact && pathname.startsWith(`${item.href}/`));

  const nav = (onNavigate?: () => void) => (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const activo = esActivo(item);
        const accent = ACCENTS[item.accent ?? "brand"];
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={activo ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-semibold transition-all ${
              activo
                ? "bg-brand-50 text-brand-800 shadow-soft dark:bg-brand-500/10 dark:text-brand-100"
                : "text-ink-soft hover:bg-cloud hover:text-ink"
            }`}
          >
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-all ${
                activo
                  ? `bg-gradient-to-br ${accent.grad} text-white shadow-sm`
                  : `${accent.tile} group-hover:scale-105`
              }`}
            >
              <ModuleIcon name={item.icon} className="h-4 w-4" />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const usuarioCard = (
    <Link
      href={perfilHref}
      onClick={() => setNavOpen(false)}
      className="group mt-3 flex items-center gap-3 rounded-xl border border-line bg-cloud/50 p-2.5 transition-all hover:border-brand-300 hover:bg-cloud"
    >
      <Avatar nombre={usuario.nombre} src={usuario.avatar} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">
          {usuario.nombre}
        </p>
        <p className="truncate text-xs text-muted">@{usuario.login}</p>
        {usuario.perfil && (
          <span className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700 dark:border-brand-500/25 dark:bg-brand-500/10 dark:text-brand-300">
            <ShieldCheck className="h-3 w-3 shrink-0" />
            <span className="truncate">{usuario.perfil}</span>
          </span>
        )}
      </div>
    </Link>
  );

  const cabecera = (
    <div className="mb-3 flex items-center gap-2.5 px-1">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-aurora-500 text-white shadow-glow">
        <ModuleIcon name={icon} className="h-5 w-5" />
      </span>
      <p className="font-display text-base font-bold text-ink">{titulo}</p>
    </div>
  );

  return (
    <div className="px-4 py-6 md:px-6 lg:flex lg:h-[calc(100dvh-4rem)] lg:gap-8 lg:overflow-hidden lg:px-6 lg:py-6">
      {/* Sidebar premium (escritorio): fijo, ocupa todo el alto de su contenedor */}
      <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-line bg-surface/70 p-3 shadow-soft backdrop-blur-sm">
          {cabecera}
          <div className="min-h-0 flex-1 overflow-y-auto">{nav()}</div>
          {usuarioCard}
        </div>
      </aside>

      {/* Barra del módulo (tablet/móvil) */}
      <div className="mb-5 flex items-center gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          aria-label="Abrir menú del módulo"
          className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-surface text-ink-soft transition-colors hover:border-brand-300"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-aurora-500 text-white">
          <ModuleIcon name={icon} className="h-4 w-4" />
        </span>
        <p className="font-display text-lg font-bold text-ink">{titulo}</p>
      </div>

      <div className="min-w-0 flex-1 lg:overflow-y-auto lg:pr-1">
        <div className="max-w-5xl">{children}</div>
      </div>

      {/* Drawer de navegación (tablet/móvil) */}
      <Drawer
        open={navOpen}
        onClose={() => setNavOpen(false)}
        title={titulo}
        side="left"
      >
        {nav(() => setNavOpen(false))}
        {usuarioCard}
      </Drawer>
    </div>
  );
}
