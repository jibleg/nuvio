"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { ModuleIcon } from "./module-icons";

export type SidebarItem = {
  label: string;
  href: string;
  icon: string;
  /** Coincidencia exacta (para el "Inicio" del módulo). */
  exact?: boolean;
};

/**
 * Marco de un módulo: sidebar fijo en escritorio y drawer con botón en
 * tablet/móvil. La navegación se resalta según la ruta activa.
 */
export function ModuleShell({
  titulo,
  items,
  children,
}: {
  titulo: string;
  items: SidebarItem[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  const esActivo = (item: SidebarItem) =>
    pathname === item.href ||
    (!item.exact && pathname.startsWith(`${item.href}/`));

  const nav = (onNavigate?: () => void) => (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const activo = esActivo(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={activo ? "page" : undefined}
            className={`inline-flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              activo
                ? "bg-brand-50 text-brand-700 dark:text-brand-200"
                : "text-ink-soft hover:bg-cloud hover:text-ink"
            }`}
          >
            <ModuleIcon name={item.icon} className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 lg:flex lg:gap-8 lg:py-8">
      {/* Sidebar fijo (escritorio) */}
      <aside className="hidden lg:block lg:w-56 lg:shrink-0">
        <div className="sticky top-20">
          <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wide text-muted">
            {titulo}
          </p>
          {nav()}
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
        <p className="font-display text-lg font-bold text-ink">{titulo}</p>
      </div>

      <div className="min-w-0 flex-1">{children}</div>

      {/* Drawer de navegación (tablet/móvil) */}
      <Drawer
        open={navOpen}
        onClose={() => setNavOpen(false)}
        title={titulo}
        side="left"
      >
        {nav(() => setNavOpen(false))}
      </Drawer>
    </div>
  );
}
