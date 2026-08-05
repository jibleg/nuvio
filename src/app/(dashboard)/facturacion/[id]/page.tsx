import { notFound } from "next/navigation";
import { requirePermission } from "@/features/auth";
import { FacturaDetalleView, getFacturaById } from "@/features/facturacion";

export const metadata = { title: "Factura" };

export default async function FacturaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePermission("facturas.consulta");
  const puedeGestionar = session.permisos.includes("facturas.write");

  const factura = await getFacturaById(Number(id), session.cliente.id);
  if (!factura) notFound();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
          {factura.folioFiscal ? "Factura" : `Borrador #${factura.id}`}
        </h1>
        <p className="mt-1 text-sm text-muted">{factura.receptorNombre ?? "Sin receptor"}</p>
      </div>

      <FacturaDetalleView factura={factura} puedeGestionar={puedeGestionar} />
    </div>
  );
}
