import type { ReactNode } from "react";
import { RefreshOnFocus } from "@/components/providers/RefreshOnFocus";
import { requireSuperAdminSession, SuperAdminShell } from "@/features/superadmin";

/** Shell del panel interno. Valida la sesión de staff contra la BD antes de renderizar. */
export default async function SuperAdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireSuperAdminSession();

  return (
    <SuperAdminShell superAdmin={session.superAdmin}>
      <RefreshOnFocus />
      {children}
    </SuperAdminShell>
  );
}
