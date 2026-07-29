"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LayoutGrid, LogOut, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { ROUTES } from "@/config/routes";
import { APP_MODULOS } from "@/config/modules";
import { useSession } from "./SessionProvider";
import { logoutAction } from "../actions";

export function UserMenu() {
  const { usuario, empresaActiva } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Si el operador está dentro de un módulo, el perfil se abre en ese contexto.
  const pathname = usePathname();
  const seg = pathname.split("/")[1] ?? "";
  const perfilHref = APP_MODULOS.some((m) => m.key === seg)
    ? `/${seg}/perfil`
    : ROUTES.perfil;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-2 transition-colors hover:border-brand-300"
      >
        <Avatar nombre={usuario.nombre} src={usuario.avatar} size="sm" />
        <span className="hidden max-w-[9rem] truncate text-sm font-semibold text-ink sm:block">
          {usuario.nombre.split(" ")[0]}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-line bg-surface shadow-glow"
          >
            {/* Cabecera con datos del usuario */}
            <div className="flex items-center gap-3 bg-gradient-to-br from-brand-500/10 to-aurora-500/10 px-4 py-4">
              <Avatar nombre={usuario.nombre} src={usuario.avatar} size="lg" className="!h-12 !w-12 !text-base" />
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-ink">
                  {usuario.nombre}
                </p>
                <p className="truncate text-xs text-muted">
                  {usuario.email ?? `@${usuario.login}`}
                </p>
                {empresaActiva && (
                  <p className="mt-0.5 truncate text-xs font-medium text-brand-600 dark:text-brand-300">
                    {empresaActiva.nombreComercial}
                  </p>
                )}
              </div>
            </div>

            <div className="h-px bg-line" />

            <nav className="p-1.5">
              <MenuLink
                href={perfilHref}
                icon={<UserRound className="h-4 w-4" />}
                label="Perfil"
                onClick={() => setOpen(false)}
              />
              <MenuLink
                href={ROUTES.dashboard}
                icon={<LayoutGrid className="h-4 w-4" />}
                label="Cambiar de módulo"
                onClick={() => setOpen(false)}
              />
            </nav>

            <div className="h-px bg-line" />

            <div className="p-1.5">
              <form action={logoutAction}>
                <button
                  type="submit"
                  role="menuitem"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/10">
                    <LogOut className="h-4 w-4" />
                  </span>
                  Cerrar sesión
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-cloud"
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:text-brand-300">
        {icon}
      </span>
      {label}
    </Link>
  );
}
