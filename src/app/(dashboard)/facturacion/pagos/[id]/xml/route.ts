import { NextResponse } from "next/server";
import { requirePermission } from "@/features/auth";
import { getXmlTimbrado } from "@/features/facturacion/repositories/facturas-repository";
import { getPagoById } from "@/features/facturacion/queries";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePermission("facturas.consulta");

  const pago = await getPagoById(Number(id), session.cliente.id);
  if (!pago || pago.estado === "borrador") {
    return NextResponse.json({ error: "Complemento de pago no encontrado o sin timbrar." }, { status: 404 });
  }

  const xml = await getXmlTimbrado(Number(id), session.cliente.id);
  if (!xml) {
    return NextResponse.json({ error: "Este complemento no tiene XML timbrado." }, { status: 404 });
  }

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="pago-${pago.folioFiscal ?? pago.id}.xml"`,
    },
  });
}
