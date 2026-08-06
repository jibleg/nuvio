import { notFound } from "next/navigation";
import { requirePermission } from "@/features/auth";
import { FacturaDetalleView, getFacturaById } from "@/features/facturacion";
import { getFacturaOriginal, getPagosDeFactura, getSaldoPendienteFactura, getSustitutoTimbrado } from "@/features/facturacion/queries";
import { CVE_METODO_PPD } from "@/features/facturacion/types";

export const metadata = { title: "Factura" };

export default async function FacturaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePermission("facturas.consulta");
  const puedeGestionar = session.permisos.includes("facturas.write");

  const factura = await getFacturaById(Number(id), session.cliente.id);
  if (!factura) notFound();

  const esPpdTimbrada = factura.estado === "timbrada" && factura.idMetodo === CVE_METODO_PPD;
  const [saldoPendiente, pagosAplicados] = esPpdTimbrada
    ? await Promise.all([
        getSaldoPendienteFactura(factura.id, session.cliente.id),
        getPagosDeFactura(factura.id, session.cliente.id),
      ])
    : [null, []];

  // Refacturación: si esta factura sustituye a otra, o si ya tiene un
  // sustituto timbrado, se muestra el enlace correspondiente en el detalle.
  const facturaOriginal =
    factura.cfdiRelacionado && factura.tipoRelacion === "04"
      ? await getFacturaOriginal(factura.cfdiRelacionado, session.cliente.id)
      : null;
  const sustitutoTimbrado =
    factura.estado === "timbrada" && factura.folioFiscal
      ? await getSustitutoTimbrado(factura.folioFiscal, session.cliente.id)
      : null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
          {factura.folioFiscal ? "Factura" : `Borrador #${factura.id}`}
        </h1>
        <p className="mt-1 text-sm text-muted">{factura.receptorNombre ?? "Sin receptor"}</p>
      </div>

      <FacturaDetalleView
        factura={factura}
        puedeGestionar={puedeGestionar}
        saldoPendiente={saldoPendiente}
        pagosAplicados={pagosAplicados}
        facturaOriginal={facturaOriginal}
        sustitutoTimbrado={sustitutoTimbrado}
      />
    </div>
  );
}
