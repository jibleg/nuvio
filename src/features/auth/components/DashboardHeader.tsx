"use client";

import { LogOut } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ROUTES } from "@/config/routes";
import { useSession } from "./SessionProvider";
import { EmpresaSwitcher } from "./EmpresaSwitcher";
import { logoutAction } from "../actions";

/** Barra superior global del área autenticada. La navegación por módulo vive en su sidebar. */
export function DashboardHeader() {
  const { usuario } = useSession();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-line bg-surface/80 px-4 py-3 backdrop-blur-xl sm:px-6">
      <Logo href={ROUTES.dashboard} variant="icon" />

      <div className="flex items-center gap-2 sm:gap-3">
        <EmpresaSwitcher />
        <ThemeToggle />
        <span className="hidden text-sm font-medium text-ink-soft md:inline">
          {usuario.nombre}
        </span>
        <form action={logoutAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700 dark:hover:text-brand-300"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </form>
      </div>
    </header>
  );
}
