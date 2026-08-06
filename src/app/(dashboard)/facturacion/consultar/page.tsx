import { requirePermission } from "@/features/auth";
import { FacturasListado, getFacturasList } from "@/features/facturacion";

export const metadata = { title: "Consultar facturas" };

export default async function ConsultarFacturasPage() {
  const session = await requirePermission("facturas.consulta");
  const puedeGestionar = session.permisos.includes("facturas.write");
  const facturas = await getFacturasList(session.cliente.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">Facturación</h1>
        <p className="mt-1 text-sm text-muted">Emite y consulta tus facturas CFDI 4.0.</p>
      </div>

      <FacturasListado facturas={facturas} puedeGestionar={puedeGestionar} />
    </div>
  );
}
