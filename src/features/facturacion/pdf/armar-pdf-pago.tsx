import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { datosTimbre, urlQrSat } from "@/lib/cfdi/tfd";
import { getLogoBytes } from "@/features/sucursales/repositories/sucursales-repository";
import { PagoPdfDocument } from "./PagoPdf";
import { getXmlTimbrado } from "../repositories/facturas-repository";
import type { PagoDetalle } from "../types";

/** Arma el PDF de un complemento de pago ya timbrado — mismo patrón que `armarPdfFactura`. */
export async function armarPdfPago(pago: PagoDetalle, idCliente: number): Promise<Buffer> {
  const xml = await getXmlTimbrado(pago.id, idCliente);
  const timbre = datosTimbre(xml);
  // El comprobante de pago declara Total="0" (no factura importes); el QR del
  // SAT usa ese mismo total del comprobante, no el monto pagado.
  const qrUrl = urlQrSat({
    uuid: pago.folioFiscal,
    rfcEmisor: pago.emisorRfc ?? "",
    rfcReceptor: pago.receptorRfc ?? "",
    total: timbre.total,
    selloCfdi: timbre.selloCfdi,
  });
  const qrDataUrl = qrUrl ? await QRCode.toDataURL(qrUrl, { margin: 0 }) : null;
  const logoDataUrl = await logoDataUrlDeEmpresa(pago.idEmpresaEmisora, idCliente);

  return renderToBuffer(<PagoPdfDocument pago={pago} timbre={timbre} qrDataUrl={qrDataUrl} logoDataUrl={logoDataUrl} />);
}

/**
 * Vista previa en PDF de un complemento de pago AÚN SIN TIMBRAR (borrador).
 * A diferencia de una factura de ingreso, el emisor/receptor de un pago SÍ
 * quedan grabados desde que se crea el borrador (`crearBorradorPago` los
 * copia del ingreso ya timbrado que se está pagando) — no hace falta
 * resolverlos en vivo, `pago` ya trae los datos correctos.
 */
export async function armarPdfPagoBorrador(pago: PagoDetalle, idCliente: number): Promise<Buffer> {
  const logoDataUrl = await logoDataUrlDeEmpresa(pago.idEmpresaEmisora, idCliente);
  return renderToBuffer(<PagoPdfDocument pago={pago} timbre={null} qrDataUrl={null} logoDataUrl={logoDataUrl} />);
}

async function logoDataUrlDeEmpresa(idEmpresa: number, idCliente: number): Promise<string | null> {
  const logo = await getLogoBytes(idEmpresa, idCliente);
  return logo ? `data:${logo.mimeType};base64,${logo.data.toString("base64")}` : null;
}
