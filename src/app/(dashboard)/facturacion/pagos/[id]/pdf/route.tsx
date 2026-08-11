import { NextResponse } from "next/server";
import { requirePermission } from "@/features/auth";
import { armarPdfPago, armarPdfPagoBorrador } from "@/features/facturacion/pdf/armar-pdf-pago";
import { getPagoById } from "@/features/facturacion/queries";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePermission("facturas.consulta");

  const pago = await getPagoById(Number(id), session.cliente.id);
  if (!pago) {
    return NextResponse.json({ error: "Complemento de pago no encontrado." }, { status: 404 });
  }

  const esBorrador = pago.estado === "borrador";
  const buffer = esBorrador
    ? await armarPdfPagoBorrador(pago, session.cliente.id)
    : await armarPdfPago(pago, session.cliente.id);
  const nombreArchivo = esBorrador ? `borrador-pago-${pago.id}` : `pago-${pago.folioFiscal ?? pago.id}`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nombreArchivo}.pdf"`,
    },
  });
}
