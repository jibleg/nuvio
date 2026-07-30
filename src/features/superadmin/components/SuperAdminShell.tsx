"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ShieldCheck, Users } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ROUTES } from "@/config/routes";
import { SuperAdminUserMenu } from "./SuperAdminUserMenu";
import type { SuperAdminUser } from "../types";

const NAV = [
  { href: ROUTES.superadmin, label: "Resumen", icon: LayoutGrid, exact: true },
  { href: ROUTES.superadminClientes, label: "Clientes", icon: Users, exact: false },
];

/** Shell del panel interno: cabecera con marca + navegación + sesión de staff. */
export function SuperAdminShell({
  superAdmin,
  children,
}: {
  superAdmin: SuperAdminUser;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/80 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo href={null} variant="icon" />
            <span className="hidden items-center gap-1.5 rounded-full border border-line bg-cloud/60 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-ink-soft sm:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-600 dark:text-brand-300" />
              Panel interno
            </span>
          </div>

          <nav className="flex items-center gap-1 rounded-full border border-line bg-cloud/40 p-1">
            {NAV.map((item) => {
              const activo = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                    activo
                      ? "bg-surface text-brand-700 shadow-soft dark:text-brand-200"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <SuperAdminUserMenu superAdmin={superAdmin} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">{children}</main>
    </div>
  );
}
