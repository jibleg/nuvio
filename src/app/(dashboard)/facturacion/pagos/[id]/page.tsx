import { notFound } from "next/navigation";
import { requirePermission } from "@/features/auth";
import { PagoDetalleView } from "@/features/facturacion/components/PagoDetalleView";
import { getPagoById } from "@/features/facturacion/queries";

export const metadata = { title: "Complemento de pago" };

export default async function PagoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePermission("facturas.consulta");
  const puedeGestionar = session.permisos.includes("facturas.write");

  const pago = await getPagoById(Number(id), session.cliente.id);
  if (!pago) notFound();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
          {pago.folioFiscal ? "Complemento de pago" : `Borrador #${pago.id}`}
        </h1>
        <p className="mt-1 text-sm text-muted">{pago.receptorNombre ?? "Sin cliente"}</p>
      </div>

      <PagoDetalleView pago={pago} puedeGestionar={puedeGestionar} />
    </div>
  );
}
