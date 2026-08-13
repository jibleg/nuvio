"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, Menu, ShieldCheck } from "lucide-react";
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

/** Tiles translúcidas sobre el fondo oscuro del sidebar (el ítem inactivo). */
const ACCENTS: Record<SidebarAccent, { tile: string; grad: string }> = {
  brand: {
    tile: "bg-white/10 text-brand-200",
    grad: "from-brand-400 to-brand-600",
  },
  aurora: {
    tile: "bg-white/10 text-aurora-300",
    grad: "from-aurora-400 to-aurora-600",
  },
  sky: {
    tile: "bg-white/10 text-sky-soft",
    grad: "from-sky-soft to-brand-400",
  },
  sunrise: {
    tile: "bg-white/10 text-sunrise-300",
    grad: "from-sunrise-300 to-sunrise-500",
  },
};

/** Recordar si el sidebar de escritorio va minimizado, entre sesiones y entre módulos. */
const COLLAPSE_KEY = "nuvio-sidebar-collapsed";

/**
 * Marco de un módulo: sidebar premium fijo en escritorio (fondo oscuro con
 * degradado de marca, minimizable a un riel de iconos) y drawer con botón en
 * tablet/móvil. Iconos con acento de color; la ruta activa se resalta con un
 * acento aurora. El drawer móvil siempre va expandido — minimizar no tiene
 * sentido en un cajón que se cierra solo.
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
  const [collapsed, setCollapsed] = useState(false);

  // El valor persistido solo existe en el navegador: se lee después del
  // primer render para no desentonar con el HTML que mandó el servidor.
  useEffect(() => {
    if (window.localStorage.getItem(COLLAPSE_KEY) === "1") setCollapsed(true);
  }, []);
  useEffect(() => {
    window.localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  // Perfil dentro del módulo actual, para no sacar al operador de su contexto.
  const moduleBase = `/${pathname.split("/")[1] ?? ""}`;
  const perfilHref = `${moduleBase}/perfil`;

  const esActivo = (item: SidebarItem) =>
    pathname === item.href ||
    (!item.exact && pathname.startsWith(`${item.href}/`));

  /** `rail` fuerza el modo icono-solo (riel); por defecto sigue el estado persistido — el drawer móvil lo pasa siempre en `false`. */
  const nav = (onNavigate?: () => void, rail = collapsed) => (
    <nav className={`flex flex-col gap-1 ${rail ? "items-center" : ""}`}>
      {items.map((item) => {
        const activo = esActivo(item);
        const accent = ACCENTS[item.accent ?? "brand"];
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={activo ? "page" : undefined}
            title={rail ? item.label : undefined}
            className={`group relative flex items-center gap-3 rounded-xl text-sm font-semibold transition-all ${
              rail ? "h-11 w-11 justify-center px-0" : "px-2.5 py-2"
            } ${
              activo
                ? "bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                : "text-brand-100/75 hover:bg-white/8 hover:text-white"
            }`}
          >
            {activo && (
              <span
                className={`absolute rounded-full bg-aurora-300 ${
                  rail ? "left-0.5 top-1/2 h-5 w-1 -translate-y-1/2" : "left-0.5 top-1/2 h-6 w-1 -translate-y-1/2"
                }`}
              />
            )}
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-all ${
                activo
                  ? `bg-gradient-to-br ${accent.grad} text-white shadow-sm`
                  : `${accent.tile} group-hover:scale-105`
              }`}
            >
              <ModuleIcon name={item.icon} className="h-4 w-4" />
            </span>
            {!rail && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  const usuarioCard = (rail: boolean) => (
    <Link
      href={perfilHref}
      onClick={() => setNavOpen(false)}
      title={rail ? `${usuario.nombre} · ${usuario.perfil ?? "@" + usuario.login}` : undefined}
      className={`group mt-3 flex items-center rounded-xl bg-white/8 ring-1 ring-white/10 transition-all hover:bg-white/12 ${
        rail ? "justify-center p-2" : "gap-3 p-2.5"
      }`}
    >
      <Avatar nombre={usuario.nombre} src={usuario.avatar} size="md" />
      {!rail && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {usuario.nombre}
          </p>
          <p className="truncate text-xs text-brand-200">@{usuario.login}</p>
          {usuario.perfil && (
            <span className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-aurora-300">
              <ShieldCheck className="h-3 w-3 shrink-0" />
              <span className="truncate">{usuario.perfil}</span>
            </span>
          )}
        </div>
      )}
    </Link>
  );

  const cabecera = (rail: boolean) => (
    <div className={`mb-3 flex items-center gap-2.5 ${rail ? "justify-center px-0" : "px-1"}`}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-aurora-500 text-white shadow-glow">
        <ModuleIcon name={icon} className="h-5 w-5" />
      </span>
      {!rail && <p className="truncate font-display text-base font-bold text-white">{titulo}</p>}
    </div>
  );

  return (
    <div className="px-4 py-6 md:px-6 lg:flex lg:h-[calc(100dvh-4rem)] lg:gap-8 lg:overflow-hidden lg:px-6 lg:py-6">
      {/* Sidebar premium (escritorio): fijo, ocupa todo el alto de su contenedor */}
      <aside
        className={`relative hidden shrink-0 flex-col transition-[width] duration-200 ease-out lg:flex ${
          collapsed ? "lg:w-20" : "lg:w-60"
        }`}
      >
        <div
          className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-brand-600 to-aurora-600 shadow-glow ${
            collapsed ? "p-2" : "p-3"
          }`}
        >
          {cabecera(collapsed)}
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">{nav()}</div>
          {usuarioCard(collapsed)}
        </div>

        {/* Minimizar/expandir: a caballo entre el sidebar y el contenido. */}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expandir menú" : "Minimizar menú"}
          className="absolute -right-3.5 top-8 hidden h-8 w-8 place-items-center rounded-full border border-brand-600 bg-brand-600 text-white shadow-glow transition-colors hover:border-brand-700 hover:bg-brand-700 lg:grid"
        >
          <ChevronLeft className={`h-4 w-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
        </button>
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

      {/* Drawer de navegación (tablet/móvil) — siempre expandido */}
      <Drawer
        open={navOpen}
        onClose={() => setNavOpen(false)}
        title={titulo}
        side="left"
      >
        {nav(() => setNavOpen(false), false)}
        {usuarioCard(false)}
      </Drawer>
    </div>
  );
}
