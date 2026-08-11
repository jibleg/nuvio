import { NextResponse } from "next/server";
import { requirePermission } from "@/features/auth";
import { getFacturaById } from "@/features/facturacion";
import { armarPdfFactura, armarPdfFacturaBorrador } from "@/features/facturacion/pdf/armar-pdf-factura";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePermission("facturas.consulta");

  const factura = await getFacturaById(Number(id), session.cliente.id);
  if (!factura) {
    return NextResponse.json({ error: "Factura no encontrada." }, { status: 404 });
  }

  const esBorrador = factura.estado === "borrador";
  const buffer = esBorrador
    ? await armarPdfFacturaBorrador(factura, session.cliente.id)
    : await armarPdfFactura(factura, session.cliente.id);
  const nombreArchivo = esBorrador ? `borrador-factura-${factura.id}` : `factura-${factura.folioFiscal ?? factura.id}`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nombreArchivo}.pdf"`,
    },
  });
}
