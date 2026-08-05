import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { datosTimbre, urlQrSat } from "@/lib/cfdi/tfd";
import { enviarCorreo, type EnviarCorreoResult } from "@/lib/email/sparkpost";
import { FacturaPdfDocument } from "../pdf/FacturaPdf";
import { getFacturaDetalle, getXmlTimbrado } from "../repositories/facturas-repository";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Arma el mismo PDF de la descarga y lo manda por correo — nunca automático, siempre a petición del operador. */
export async function enviarFacturaCorreoUseCase(
  idFactura: number,
  idCliente: number,
  correoDestino: string,
): Promise<EnviarCorreoResult> {
  if (!EMAIL_REGEX.test(correoDestino)) return { ok: false, error: "Correo inválido." };

  const factura = await getFacturaDetalle(idFactura, idCliente);
  if (!factura) return { ok: false, error: "Factura no encontrada." };
  if (factura.estado === "borrador") {
    return { ok: false, error: "Solo se puede enviar una factura ya timbrada." };
  }

  const xml = await getXmlTimbrado(idFactura, idCliente);
  const timbre = datosTimbre(xml);
  const qrUrl = urlQrSat({
    uuid: factura.folioFiscal,
    rfcEmisor: factura.emisorRfc ?? "",
    rfcReceptor: factura.receptorRfc ?? "",
    total: timbre.total ?? (factura.total ? Number(factura.total) : null),
    selloCfdi: timbre.selloCfdi,
  });
  const qrDataUrl = qrUrl ? await QRCode.toDataURL(qrUrl, { margin: 0 }) : null;

  const pdfBuffer = await renderToBuffer(
    <FacturaPdfDocument factura={factura} timbre={timbre} qrDataUrl={qrDataUrl} />,
  );
  const nombreArchivo = `factura-${factura.folioFiscal ?? factura.id}`;

  const html = `
    <p>Hola${factura.receptorNombre ? ` ${factura.receptorNombre}` : ""},</p>
    <p>Adjuntamos tu factura${factura.folioFiscal ? ` con folio fiscal <strong>${factura.folioFiscal}</strong>` : ""}.</p>
    <p>Este es un correo automático, por favor no respondas a esta dirección.</p>
  `.trim();

  return enviarCorreo({
    para: { email: correoDestino, nombre: factura.receptorNombre ?? undefined },
    asunto: `Factura ${factura.folioFiscal ?? `#${factura.id}`}`,
    html,
    adjuntos: [
      { nombre: `${nombreArchivo}.pdf`, tipoMime: "application/pdf", contenidoBase64: pdfBuffer.toString("base64") },
      ...(xml
        ? [{ nombre: `${nombreArchivo}.xml`, tipoMime: "application/xml", contenidoBase64: Buffer.from(xml).toString("base64") }]
        : []),
    ],
  });
}
