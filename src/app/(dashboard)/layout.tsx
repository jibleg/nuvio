import type { ReactNode } from "react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { RefreshOnFocus } from "@/components/providers/RefreshOnFocus";
import {
  DashboardHeader,
  SessionProvider,
  requireSession,
} from "@/features/auth";

/**
 * Shell del área autenticada. Valida la sesión contra la BD, expone su contexto
 * a la UI cliente (permisos + empresa activa) y monta el estado de servidor.
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireSession();

  return (
    <QueryProvider>
      <SessionProvider value={session}>
        <RefreshOnFocus />
        <div className="min-h-dvh bg-paper text-ink">
          <DashboardHeader />
          <main>{children}</main>
        </div>
      </SessionProvider>
    </QueryProvider>
  );
}
