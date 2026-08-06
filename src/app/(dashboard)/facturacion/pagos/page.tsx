import { requirePermission } from "@/features/auth";
import { PagosListado } from "@/features/facturacion/components/PagosListado";
import { getPagosList } from "@/features/facturacion/queries";

export const metadata = { title: "Complementos de pago" };

export default async function PagosPage() {
  const session = await requirePermission("facturas.consulta");
  const puedeGestionar = session.permisos.includes("facturas.write");
  const pagos = await getPagosList(session.cliente.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">Complementos de pago</h1>
        <p className="mt-1 text-sm text-muted">Registra y consulta el cobro de tus facturas a crédito (PPD).</p>
      </div>

      <PagosListado pagos={pagos} puedeGestionar={puedeGestionar} />
    </div>
  );
}
