import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { getContactoById } from "@/features/contactos-facturacion";
import { listFormasPago, listMetodosPago, listMonedas, listRegimenesFiscales, listUsosCfdi, type CatalogoItem } from "@/lib/cfdi/catalogos";
import { datosTimbre, urlQrSat } from "@/lib/cfdi/tfd";
import { getLogoBytes } from "@/features/sucursales/repositories/sucursales-repository";
import { FacturaPdfDocument, type DatosFiscalesPdf } from "./FacturaPdf";
import { getEmisorDetalle } from "../repositories/emisor-repository";
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
  const logoDataUrl = await logoDataUrlDeEmpresa(factura.idEmpresaEmisora, idCliente);
  const datosFiscales = await resolverDatosFiscales({
    idRegimenEmisor: factura.idRegimenEmisor,
    idRegimenReceptor: factura.idRegimenReceptor,
    idUso: factura.idUso,
    idFormaPago: factura.idFormaPago,
    idMetodo: factura.idMetodo,
    idMoneda: factura.idMoneda,
    cpExpedicion: factura.cpExpedicion,
    codigoPostalReceptor: factura.codigoPostalReceptor,
  });

  return renderToBuffer(
    <FacturaPdfDocument
      factura={factura}
      timbre={timbre}
      qrDataUrl={qrDataUrl}
      logoDataUrl={logoDataUrl}
      datosFiscales={datosFiscales}
    />,
  );
}

/**
 * Arma la vista previa en PDF de una factura AÚN SIN TIMBRAR (borrador): sin
 * QR, sello ni folio fiscal — el documento lo marca con un aviso explícito
 * de que no tiene validez fiscal (ver `FacturaPdf.tsx`). A diferencia de una
 * factura timbrada, el emisor/receptor (nombre, régimen, CP) no están
 * grabados todavía en la propia fila de `factura` (esas columnas son una
 * FOTO que solo se llena al timbrar), así que se resuelven en vivo desde la
 * empresa y el contacto — el uso/forma/método/moneda sí son del borrador
 * mismo, esos ya los eligió el operador al capturarlo.
 */
export async function armarPdfFacturaBorrador(factura: FacturaDetalle, idCliente: number): Promise<Buffer> {
  const [emisor, receptor] = await Promise.all([
    getEmisorDetalle(factura.idEmpresaEmisora, idCliente),
    getContactoById(factura.idContactoFacturacion, idCliente),
  ]);
  const logoDataUrl = await logoDataUrlDeEmpresa(factura.idEmpresaEmisora, idCliente);
  const datosFiscales = await resolverDatosFiscales({
    idRegimenEmisor: emisor?.idRegimen ?? null,
    idRegimenReceptor: receptor?.idRegimen ?? null,
    idUso: factura.idUso,
    idFormaPago: factura.idFormaPago,
    idMetodo: factura.idMetodo,
    idMoneda: factura.idMoneda,
    cpExpedicion: emisor?.codigoPostal ?? null,
    codigoPostalReceptor: receptor?.codigoPostal ?? null,
  });

  const facturaConDatosVivos: FacturaDetalle = {
    ...factura,
    emisorNombre: emisor?.razonSocial ?? null,
    emisorRfc: emisor?.rfc ?? null,
    receptorNombre: receptor?.razonSocial ?? null,
    receptorRfc: receptor?.rfc ?? null,
  };

  return renderToBuffer(
    <FacturaPdfDocument
      factura={facturaConDatosVivos}
      timbre={null}
      qrDataUrl={null}
      logoDataUrl={logoDataUrl}
      datosFiscales={datosFiscales}
    />,
  );
}

async function logoDataUrlDeEmpresa(idEmpresa: number, idCliente: number): Promise<string | null> {
  const logo = await getLogoBytes(idEmpresa, idCliente);
  return logo ? `data:${logo.mimeType};base64,${logo.data.toString("base64")}` : null;
}

function etiquetaCatalogo(lista: CatalogoItem[], id: number | null): string {
  if (id === null) return "—";
  const item = lista.find((x) => x.id === id);
  if (!item) return "—";
  return item.descripcion ? `${item.clave} - ${item.descripcion}` : item.clave;
}

function formatearCp(cp: number | null): string | null {
  return cp !== null ? String(cp).padStart(5, "0") : null;
}

/** Traduce las claves SAT guardadas (o resueltas en vivo para un borrador) a las etiquetas legibles que exige la representación impresa. */
async function resolverDatosFiscales(datos: {
  idRegimenEmisor: number | null;
  idRegimenReceptor: number | null;
  idUso: number;
  idFormaPago: number;
  idMetodo: number;
  idMoneda: number;
  cpExpedicion: number | null;
  codigoPostalReceptor: number | null;
}): Promise<DatosFiscalesPdf> {
  const [regimenes, usos, formasPago, metodosPago, monedas] = await Promise.all([
    listRegimenesFiscales(),
    listUsosCfdi(),
    listFormasPago(),
    listMetodosPago(),
    listMonedas(),
  ]);

  return {
    regimenEmisor: etiquetaCatalogo(regimenes, datos.idRegimenEmisor),
    regimenReceptor: etiquetaCatalogo(regimenes, datos.idRegimenReceptor),
    uso: etiquetaCatalogo(usos, datos.idUso),
    formaPago: etiquetaCatalogo(formasPago, datos.idFormaPago),
    metodoPago: etiquetaCatalogo(metodosPago, datos.idMetodo),
    moneda: etiquetaCatalogo(monedas, datos.idMoneda),
    lugarExpedicion: formatearCp(datos.cpExpedicion),
    domicilioReceptor: formatearCp(datos.codigoPostalReceptor),
  };
}
