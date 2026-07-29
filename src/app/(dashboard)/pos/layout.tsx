import type { ReactNode } from "react";
import { requireModulo } from "@/features/auth";
import { ROUTES } from "@/config/routes";
import { ModuleShell } from "@/features/modulos/components/ModuleShell";

export default async function PosLayout({ children }: { children: ReactNode }) {
  await requireModulo("pos");
  return (
    <ModuleShell
      titulo="Punto de venta"
      items={[{ label: "Inicio", href: ROUTES.pos, icon: "home", exact: true }]}
    >
      {children}
    </ModuleShell>
  );
}
