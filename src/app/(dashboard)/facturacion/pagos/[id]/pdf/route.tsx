import { NextResponse } from "next/server";
import { requirePermission } from "@/features/auth";
import { armarPdfPago } from "@/features/facturacion/pdf/armar-pdf-pago";
import { getPagoById } from "@/features/facturacion/queries";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePermission("facturas.consulta");

  const pago = await getPagoById(Number(id), session.cliente.id);
  if (!pago || pago.estado === "borrador") {
    return NextResponse.json({ error: "Complemento de pago no encontrado o sin timbrar." }, { status: 404 });
  }

  const buffer = await armarPdfPago(pago, session.cliente.id);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="pago-${pago.folioFiscal ?? pago.id}.pdf"`,
    },
  });
}
