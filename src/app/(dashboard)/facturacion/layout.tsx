import type { ReactNode } from "react";
import { requireModulo } from "@/features/auth";
import { ROUTES } from "@/config/routes";
import { ModuleShell } from "@/features/modulos/components/ModuleShell";
import { ModoPruebaBanner } from "@/features/facturacion/components/ModoPruebaBanner";
import { getAmbienteTimbradoEmpresa } from "@/features/facturacion/repositories/emisor-repository";

export default async function FacturacionLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireModulo("facturacion");

  // Mismo criterio que `timbrar-factura.ts`: produce en 'producción' SOLO si
  // el gate de la cuenta (aprobado por Nuvio) Y el toggle de la sucursal
  // activa coinciden en 'producción'; cualquier otra combinación es sandbox.
  const ambienteEmpresa = session.empresaActiva
    ? await getAmbienteTimbradoEmpresa(session.empresaActiva.id, session.cliente.id)
    : null;
  const modoPrueba = session.cliente.ambienteTimbrado !== "produccion" || ambienteEmpresa !== "produccion";

  return (
    <>
      {modoPrueba && <ModoPruebaBanner />}
      <ModuleShell
        titulo="Facturación"
        icon="file-text"
        items={[
          { label: "Resumen", href: ROUTES.facturacion, icon: "home", accent: "brand", exact: true },
          { label: "Consultar facturas", href: `${ROUTES.facturacion}/consultar`, icon: "search", accent: "brand" },
          { label: "Complementos de pago", href: `${ROUTES.facturacion}/pagos`, icon: "credit-card", accent: "brand" },
        ]}
      >
        {children}
      </ModuleShell>
    </>
  );
}
