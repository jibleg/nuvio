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
        { label: "Resumen", href: ROUTES.facturacion, icon: "home", accent: "brand", exact: true },
        { label: "Consultar facturas", href: `${ROUTES.facturacion}/consultar`, icon: "search", accent: "brand" },
        { label: "Nueva factura", href: `${ROUTES.facturacion}/nueva`, icon: "plus-circle", accent: "aurora" },
        { label: "Complementos de pago", href: `${ROUTES.facturacion}/pagos`, icon: "credit-card", accent: "brand" },
      ]}
    >
      {children}
    </ModuleShell>
  );
}
