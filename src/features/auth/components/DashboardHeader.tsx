"use client";

import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ROUTES } from "@/config/routes";
import { UserMenu } from "./UserMenu";

/** Barra superior global del área autenticada. La navegación por módulo vive en su sidebar. */
export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-line bg-surface/80 px-4 backdrop-blur-xl sm:px-6">
      <Logo href={ROUTES.dashboard} variant="icon" />

      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
