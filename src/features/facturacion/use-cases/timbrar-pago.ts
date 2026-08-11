import { getContactoById } from "@/features/contactos-facturacion";
import { cadenaOriginal } from "@/lib/cfdi/cadena";
import { listRegimenesFiscales } from "@/lib/cfdi/catalogos";
import { decryptSecret } from "@/lib/crypto/secrets";
import { ahoraCfdi, fechaCfdi } from "@/lib/cfdi/fecha";
import { leerLlavePrivada, sellar } from "@/lib/cfdi/sello";
import { datosTimbre } from "@/lib/cfdi/tfd";
import { conSello, SELLO_VACIO } from "@/lib/cfdi/xml";
import { construirXmlPago, type PagoXml } from "@/lib/cfdi/xml-pago";
import { credencialesFinkok, type AmbienteTimbrado } from "@/lib/finkok/credenciales";
import { timbrarConFinkok } from "@/lib/finkok/stamp";
import { getEmisorDetalle } from "../repositories/emisor-repository";
import { getXmlPrevio, guardarXmlSellado, marcarTimbrada } from "../repositories/facturas-repository";
import { getDatosParaTimbrarPago } from "../repositories/pagos-repository";
import { siguienteFolio } from "../repositories/folios-repository";
import type { TimbrarResult } from "../types";

/**
 * Timbra el borrador de un complemento de pago con Finkok. Mismo patrón de 3
 * fases idempotente que `timbrar-factura.ts` (sella y guarda ANTES de llamar
 * al PAC, reutiliza el XML sellado si un intento previo falló de forma
 * ambigua); solo cambia cómo se arma el comprobante — sin conceptos reales,
 * con el nodo `pago20:Pagos` en vez de `Conceptos` con precio.
 *
 * El ambiente lo decide la empresa emisora, degradado a 'sandbox' si la
 * cuenta no está aprobada por Nuvio para producción (ver `timbrar-factura.ts`).
 */
export async function timbrarPagoUseCase(
  idPago: number,
  idCliente: number,
  ambienteCuenta: AmbienteTimbrado,
): Promise<TimbrarResult> {
  const datos = await getDatosParaTimbrarPago(idPago, idCliente);
  if (!datos) return { ok: false, error: "Complemento de pago no encontrado.", puedeReintentar: false };
  if (!datos.esBorrador) {
    return { ok: false, error: "Este complemento ya fue timbrado o cancelado.", puedeReintentar: false };
  }
  if (datos.documentos.length === 0) {
    return { ok: false, error: "El pago no relaciona ninguna factura.", puedeReintentar: false };
  }
  if (datos.documentos.some((d) => !d.idDocumento)) {
    return { ok: false, error: "Alguna factura pagada no tiene folio fiscal (no estaba timbrada).", puedeReintentar: false };
  }

  const emisor = await getEmisorDetalle(datos.idEmpresaEmisora, idCliente);
  if (!emisor) return { ok: false, error: "No se pudo resolver la empresa emisora.", puedeReintentar: false };
  if (!emisor.csd) {
    return { ok: false, error: "Esta empresa no tiene un CSD cargado. Sube el certificado antes de timbrar.", puedeReintentar: false };
  }
  const csd = emisor.csd;
  if (!emisor.codigoPostal) {
    return { ok: false, error: "Falta el código postal de la empresa emisora.", puedeReintentar: false };
  }
  const ambiente: AmbienteTimbrado =
    emisor.ambienteTimbrado === "produccion" && ambienteCuenta === "produccion" ? "produccion" : "sandbox";

  const receptor = await getContactoById(datos.idContactoFacturacion, idCliente);
  if (!receptor) return { ok: false, error: "No se pudo resolver el cliente receptor.", puedeReintentar: false };
  if (!receptor.idRegimen || !receptor.codigoPostal) {
    return { ok: false, error: "El cliente receptor no tiene régimen fiscal o código postal capturado.", puedeReintentar: false };
  }

  const regimenes = await listRegimenesFiscales();
  const claveFormaPago = datos.formaPagoClave;
  if (!claveFormaPago) {
    return { ok: false, error: "El pago no tiene forma de pago capturada.", puedeReintentar: false };
  }
  const claveRegimenEmisor = regimenes.find((r) => r.id === emisor.idRegimen)?.clave;
  const claveRegimenReceptor = regimenes.find((r) => r.id === receptor.idRegimen)?.clave;
  if (!claveRegimenEmisor || !claveRegimenReceptor) {
    return { ok: false, error: "No se pudo resolver el régimen fiscal del emisor o del receptor.", puedeReintentar: false };
  }

  let xmlSellado = await getXmlPrevio(idPago);
  let folioUsado: number;

  if (xmlSellado && !xmlSellado.includes(SELLO_VACIO)) {
    const folioTexto = /\sFolio="(\d+)"/.exec(xmlSellado)?.[1];
    folioUsado = folioTexto ? Number(folioTexto) : await siguienteFolio(emisor.id);
  } else {
    folioUsado = await siguienteFolio(emisor.id);
    const { fecha, hora } = ahoraCfdi();

    const fechaPagoStr = fechaCfdi({ fecha: datos.fechaPago, hora: datos.horaPago });

    const comprobante: PagoXml = {
      serie: emisor.serie ?? "",
      folio: String(folioUsado),
      fecha: fechaCfdi({ fecha, hora }),
      lugarExpedicion: String(emisor.codigoPostal),
      emisor: { rfc: emisor.rfc, nombre: emisor.razonSocial, regimenFiscal: claveRegimenEmisor },
      receptor: {
        rfc: receptor.rfc,
        nombre: receptor.razonSocial,
        domicilioFiscalReceptor: String(receptor.codigoPostal),
        regimenFiscalReceptor: claveRegimenReceptor,
        usoCfdi: "CP01",
      },
      fechaPago: fechaPagoStr,
      formaDePagoP: claveFormaPago,
      monedaP: "MXN",
      monto: datos.monto,
      numOperacion: datos.numeroOperacion || null,
      documentos: datos.documentos,
    };

    const xmlSinSello = construirXmlPago(comprobante, csd.numeroCertificado, csd.cer.toString("base64"));
    const cadena = await cadenaOriginal(xmlSinSello);

    const password = decryptSecret(csd.passwordEnc);
    if (!password) {
      return { ok: false, error: "No se pudo descifrar la contraseña del CSD. Vuelve a subir el certificado.", puedeReintentar: false };
    }

    let llave;
    try {
      llave = leerLlavePrivada(csd.key, password);
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "No se pudo leer la llave privada del CSD.", puedeReintentar: false };
    }

    const sello = sellar(cadena, llave);
    xmlSellado = conSello(xmlSinSello, sello);
    await guardarXmlSellado(idPago, xmlSellado);
  }

  const resultado = await timbrarConFinkok(xmlSellado, credencialesFinkok(ambiente));
  if (!resultado.ok) {
    return { ok: false, error: resultado.mensaje, puedeReintentar: !resultado.rechazoCierto };
  }

  const datosTfd = datosTimbre(resultado.xml);

  await marcarTimbrada(idPago, {
    xmlFinal: resultado.xml,
    uuid: resultado.uuid,
    fechaTimbrado: resultado.fecha,
    cadenaOriginal: resultado.cadenaOriginalTimbre ?? datosTfd.cadenaOriginal,
    ambiente,
    serie: emisor.serie,
    folio: folioUsado,
    emisorNombre: emisor.razonSocial,
    emisorRfc: emisor.rfc,
    idRegimenEmisor: emisor.idRegimen,
    receptorNombre: receptor.razonSocial,
    receptorRfc: receptor.rfc,
    idRegimen: receptor.idRegimen,
    codigoPostalReceptor: receptor.codigoPostal,
    cpExpedicion: emisor.codigoPostal,
    importe: datos.monto,
  });

  return { ok: true };
}
