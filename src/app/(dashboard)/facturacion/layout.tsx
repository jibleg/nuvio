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
        { label: "Consultar facturas", href: ROUTES.facturacion, icon: "search", accent: "brand", exact: true },
        { label: "Nueva factura", href: `${ROUTES.facturacion}/nueva`, icon: "plus-circle", accent: "aurora" },
      ]}
    >
      {children}
    </ModuleShell>
  );
}
