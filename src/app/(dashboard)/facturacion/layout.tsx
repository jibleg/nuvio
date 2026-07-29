import type { ReactNode } from "react";
import { requireModulo } from "@/features/auth";
import { ROUTES } from "@/config/routes";
import { ModuleShell } from "@/features/modulos/components/ModuleShell";

export default async function FacturacionLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireModulo("facturacion");
  return (
    <ModuleShell
      titulo="Facturación"
      icon="file-text"
      items={[
        { label: "Inicio", href: ROUTES.facturacion, icon: "home", accent: "brand", exact: true },
      ]}
    >
      {children}
    </ModuleShell>
  );
}
