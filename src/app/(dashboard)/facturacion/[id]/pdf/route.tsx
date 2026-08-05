import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { renderToBuffer } from "@react-pdf/renderer";
import { requirePermission } from "@/features/auth";
import { getFacturaById } from "@/features/facturacion";
import { getXmlTimbrado } from "@/features/facturacion/repositories/facturas-repository";
import { datosTimbre, urlQrSat } from "@/lib/cfdi/tfd";
import { FacturaPdfDocument } from "@/features/facturacion/pdf/FacturaPdf";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePermission("facturas.consulta");

  const factura = await getFacturaById(Number(id), session.cliente.id);
  if (!factura || factura.estado === "borrador") {
    return NextResponse.json({ error: "Factura no encontrada o sin timbrar." }, { status: 404 });
  }

  const xml = await getXmlTimbrado(Number(id), session.cliente.id);
  const timbre = datosTimbre(xml);
  const qrUrl = urlQrSat({
    uuid: factura.folioFiscal,
    rfcEmisor: factura.emisorRfc ?? "",
    rfcReceptor: factura.receptorRfc ?? "",
    total: timbre.total ?? (factura.total ? Number(factura.total) : null),
    selloCfdi: timbre.selloCfdi,
  });
  const qrDataUrl = qrUrl ? await QRCode.toDataURL(qrUrl, { margin: 0 }) : null;

  const buffer = await renderToBuffer(
    <FacturaPdfDocument factura={factura} timbre={timbre} qrDataUrl={qrDataUrl} />,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="factura-${factura.folioFiscal ?? factura.id}.pdf"`,
    },
  });
}
