import type { ReactNode } from "react";
import { requireModulo } from "@/features/auth";
import { ROUTES } from "@/config/routes";
import { ModuleShell } from "@/features/modulos/components/ModuleShell";

export default async function InventarioLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireModulo("inventario");
  return (
    <ModuleShell
      titulo="Inventario"
      items={[
        { label: "Inicio", href: ROUTES.inventario, icon: "home", exact: true },
      ]}
    >
      {children}
    </ModuleShell>
  );
}
