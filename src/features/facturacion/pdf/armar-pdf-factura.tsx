import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { datosTimbre, urlQrSat } from "@/lib/cfdi/tfd";
import { getLogoBytes } from "@/features/sucursales/repositories/sucursales-repository";
import { FacturaPdfDocument } from "./FacturaPdf";
import { getXmlTimbrado } from "../repositories/facturas-repository";
import type { FacturaDetalle } from "../types";

/**
 * Arma el PDF de una factura ya timbrada (QR SAT + logo del emisor +
 * representación impresa). Compartido entre la descarga individual
 * (`[id]/pdf/route.tsx`) y el envío por correo, para no duplicar la lógica
 * de timbre/QR/logo en cada punto de entrada.
 */
export async function armarPdfFactura(factura: FacturaDetalle, idCliente: number): Promise<Buffer> {
  const xml = await getXmlTimbrado(factura.id, idCliente);
  const timbre = datosTimbre(xml);
  const qrUrl = urlQrSat({
    uuid: factura.folioFiscal,
    rfcEmisor: factura.emisorRfc ?? "",
    rfcReceptor: factura.receptorRfc ?? "",
    total: timbre.total ?? (factura.total ? Number(factura.total) : null),
    selloCfdi: timbre.selloCfdi,
  });
  const qrDataUrl = qrUrl ? await QRCode.toDataURL(qrUrl, { margin: 0 }) : null;

  const logo = await getLogoBytes(factura.idEmpresaEmisora, idCliente);
  const logoDataUrl = logo ? `data:${logo.mimeType};base64,${logo.data.toString("base64")}` : null;

  return renderToBuffer(
    <FacturaPdfDocument factura={factura} timbre={timbre} qrDataUrl={qrDataUrl} logoDataUrl={logoDataUrl} />,
  );
}
