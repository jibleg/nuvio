import { enviarCorreo, remitenteTenant, type EnviarCorreoResult } from "@/lib/email/sparkpost";
import { datosTimbre, urlQrSat } from "@/lib/cfdi/tfd";
import { armarPdfFactura } from "../pdf/armar-pdf-factura";
import { getFacturaDetalle, getXmlTimbrado } from "../repositories/facturas-repository";
import { plantillaCorreoFactura } from "./plantilla-correo-factura";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Arma el mismo PDF de la descarga y lo manda por correo — nunca automático,
 * siempre a petición del operador. El remitente es el propio del tenant
 * (`{slug}.nuvio@...`, ver `remitenteTenant`), con "{emisor} · Envío de
 * factura" como nombre visible y el mismo texto en el asunto — el receptor
 * ve que le llega de su proveedor y de qué se trata, sin que el folio fiscal
 * (un UUID largo, poco legible) sea lo primero que muestra el cliente de correo.
 */
export async function enviarFacturaCorreoUseCase(
  idFactura: number,
  idCliente: number,
  slugCliente: string,
  correosDestino: string[],
): Promise<EnviarCorreoResult> {
  if (correosDestino.length === 0) return { ok: false, error: "Captura al menos un correo." };
  if (!correosDestino.every((c) => EMAIL_REGEX.test(c))) return { ok: false, error: "Hay un correo inválido." };

  const factura = await getFacturaDetalle(idFactura, idCliente);
  if (!factura) return { ok: false, error: "Factura no encontrada." };
  if (factura.estado === "borrador") {
    return { ok: false, error: "Solo se puede enviar una factura ya timbrada." };
  }

  const xml = await getXmlTimbrado(idFactura, idCliente);
  const pdfBuffer = await armarPdfFactura(factura, idCliente);
  const nombreArchivo = `factura-${factura.folioFiscal ?? factura.id}`;

  // Mismo link que codifica el QR del PDF (`armar-pdf-factura.tsx`) — se
  // arma aquí también en vez de devolverlo desde `armarPdfFactura` para no
  // acoplar la generación del PDF al contenido del correo.
  const timbre = datosTimbre(xml);
  const urlValidacion = urlQrSat({
    uuid: factura.folioFiscal,
    rfcEmisor: factura.emisorRfc ?? "",
    rfcReceptor: factura.receptorRfc ?? "",
    total: timbre.total ?? (factura.total ? Number(factura.total) : null),
    selloCfdi: timbre.selloCfdi,
  });

  const html = plantillaCorreoFactura({
    receptorNombre: factura.receptorNombre,
    emisorNombre: factura.emisorNombre,
    folioFiscal: factura.folioFiscal,
    urlValidacion,
  });

  const nombreEmisor = factura.emisorNombre ?? "Tu proveedor";

  return enviarCorreo({
    remitente: remitenteTenant(slugCliente, `${nombreEmisor} · Envío de factura`) ?? undefined,
    para: correosDestino.map((email) => ({ email, nombre: factura.receptorNombre ?? undefined })),
    asunto: `${nombreEmisor} te envía una factura`,
    html,
    adjuntos: [
      { nombre: `${nombreArchivo}.pdf`, tipoMime: "application/pdf", contenidoBase64: pdfBuffer.toString("base64") },
      ...(xml
        ? [{ nombre: `${nombreArchivo}.xml`, tipoMime: "application/xml", contenidoBase64: Buffer.from(xml).toString("base64") }]
        : []),
    ],
  });
}
