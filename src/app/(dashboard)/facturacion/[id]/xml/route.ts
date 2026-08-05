import { NextResponse } from "next/server";
import { requirePermission } from "@/features/auth";
import { getFacturaById } from "@/features/facturacion";
import { getXmlTimbrado } from "@/features/facturacion/repositories/facturas-repository";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePermission("facturas.consulta");

  const factura = await getFacturaById(Number(id), session.cliente.id);
  if (!factura || factura.estado === "borrador") {
    return NextResponse.json({ error: "Factura no encontrada o sin timbrar." }, { status: 404 });
  }

  const xml = await getXmlTimbrado(Number(id), session.cliente.id);
  if (!xml) {
    return NextResponse.json({ error: "Esta factura no tiene XML timbrado." }, { status: 404 });
  }

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="factura-${factura.folioFiscal ?? factura.id}.xml"`,
    },
  });
}
