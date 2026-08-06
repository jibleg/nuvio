import { NextResponse } from "next/server";
import { requirePermission } from "@/features/auth";
import { getFacturaById } from "@/features/facturacion";
import { armarPdfFactura } from "@/features/facturacion/pdf/armar-pdf-factura";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePermission("facturas.consulta");

  const factura = await getFacturaById(Number(id), session.cliente.id);
  if (!factura || factura.estado === "borrador") {
    return NextResponse.json({ error: "Factura no encontrada o sin timbrar." }, { status: 404 });
  }

  const buffer = await armarPdfFactura(factura, session.cliente.id);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="factura-${factura.folioFiscal ?? factura.id}.pdf"`,
    },
  });
}
