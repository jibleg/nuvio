import { getContactoById } from "@/features/contactos-facturacion";
import { cadenaOriginal } from "@/lib/cfdi/cadena";
import { listFormasPago, listMetodosPago, listMonedas, listRegimenesFiscales, listUsosCfdi } from "@/lib/cfdi/catalogos";
import { decryptSecret } from "@/lib/crypto/secrets";
import { ahoraCfdi, fechaCfdi } from "@/lib/cfdi/fecha";
import { leerLlavePrivada, sellar } from "@/lib/cfdi/sello";
import { datosTimbre } from "@/lib/cfdi/tfd";
import { OBJETO_IMP_NO, OBJETO_IMP_SI } from "@/lib/cfdi/types";
import type { ComprobanteCfdi, ConceptoCfdi } from "@/lib/cfdi/types";
import { conSello, construirXml, SELLO_VACIO } from "@/lib/cfdi/xml";
import { credencialesFinkok, type AmbienteTimbrado } from "@/lib/finkok/credenciales";
import { timbrarConFinkok } from "@/lib/finkok/stamp";
import { getEmisorDetalle } from "../repositories/emisor-repository";
import {
  getFacturaDetalle,
  getXmlPrevio,
  guardarXmlSellado,
  marcarTimbrada,
} from "../repositories/facturas-repository";
import { siguienteFolio } from "../repositories/folios-repository";
import type { TimbrarResult } from "../types";

/** Único impuesto soportado en el MVP: IVA trasladado a tasa 16%. */
const CLAVE_IMPUESTO_IVA = "002";
const CLAVE_FACTOR_TASA = "Tasa";
const TASA_IVA = 0.16;
const DECIMALES = 2;

/**
 * Timbra un borrador con Finkok, en 3 fases (idempotente ante timeouts):
 * (1) sella y guarda el XML ANTES de llamar al PAC; (2) llama a Finkok fuera
 * de cualquier transacción; (3) si responde, guarda UUID/TFD y marca la
 * factura como timbrada. Si el paso 1 ya se hizo en un intento previo (el
 * XML sellado sigue en `xml_response` porque el paso 2 falló de forma
 * ambigua), se reutiliza tal cual — nunca se reconstruye con un folio nuevo,
 * para no arriesgar un doble timbrado.
 */
export async function timbrarFacturaUseCase(
  idFactura: number,
  idCliente: number,
  ambiente: AmbienteTimbrado,
): Promise<TimbrarResult> {
  const facturaDetalle = await getFacturaDetalle(idFactura, idCliente);
  if (!facturaDetalle) return { ok: false, error: "Factura no encontrada.", puedeReintentar: false };
  if (facturaDetalle.estado !== "borrador") {
    return { ok: false, error: "Esta factura ya fue timbrada o cancelada.", puedeReintentar: false };
  }
  if (facturaDetalle.conceptos.length === 0) {
    return { ok: false, error: "La factura no tiene conceptos.", puedeReintentar: false };
  }

  const emisor = await getEmisorDetalle(facturaDetalle.idEmpresaEmisora, idCliente);
  if (!emisor) return { ok: false, error: "No se pudo resolver la empresa emisora.", puedeReintentar: false };
  if (!emisor.csd) {
    return {
      ok: false,
      error: "Esta empresa no tiene un CSD cargado. Sube el certificado antes de timbrar.",
      puedeReintentar: false,
    };
  }
  const csd = emisor.csd;
  if (!emisor.codigoPostal) {
    return { ok: false, error: "Falta el código postal de la empresa emisora.", puedeReintentar: false };
  }
  const cpEmisor = emisor.codigoPostal;

  const receptor = await getContactoById(facturaDetalle.idContactoFacturacion, idCliente);
  if (!receptor) return { ok: false, error: "No se pudo resolver el cliente receptor.", puedeReintentar: false };
  if (!receptor.idRegimen) {
    return { ok: false, error: "El cliente receptor no tiene régimen fiscal capturado.", puedeReintentar: false };
  }
  if (!receptor.codigoPostal) {
    return { ok: false, error: "El cliente receptor no tiene código postal capturado.", puedeReintentar: false };
  }
  const cpReceptor = receptor.codigoPostal;
  const idRegimenReceptor = receptor.idRegimen;

  const [regimenes, usos, formasPago, metodosPago, monedas] = await Promise.all([
    listRegimenesFiscales(),
    listUsosCfdi(),
    listFormasPago(),
    listMetodosPago(),
    listMonedas(),
  ]);
  const clave = (lista: { id: number; clave: string }[], id: number) => lista.find((x) => x.id === id)?.clave;
  const claveRegimenEmisor = clave(regimenes, emisor.idRegimen);
  const claveRegimenReceptor = clave(regimenes, idRegimenReceptor);
  const claveUso = clave(usos, facturaDetalle.idUso);
  const claveFormaPago = clave(formasPago, facturaDetalle.idFormaPago);
  const claveMetodoPago = clave(metodosPago, facturaDetalle.idMetodo);
  const claveMoneda = clave(monedas, facturaDetalle.idMoneda);
  if (!claveRegimenEmisor || !claveRegimenReceptor || !claveUso || !claveFormaPago || !claveMetodoPago || !claveMoneda) {
    return {
      ok: false,
      error: "Faltan catálogos por resolver (régimen, uso, forma o método de pago, moneda).",
      puedeReintentar: false,
    };
  }

  const conceptosCfdi: ConceptoCfdi[] = facturaDetalle.conceptos.map((c) => ({
    claveProdServ: c.claveProdServ,
    noIdentificacion: "",
    cantidad: c.cantidad,
    claveUnidad: c.claveUnidad,
    unidad: c.claveUnidad,
    descripcion: c.descripcion,
    valorUnitario: c.valorUnitario,
    importe: c.importe,
    objetoImp: c.gravado ? OBJETO_IMP_SI : OBJETO_IMP_NO,
    traslado: c.gravado
      ? {
          base: c.importe,
          impuesto: CLAVE_IMPUESTO_IVA,
          tipoFactor: CLAVE_FACTOR_TASA,
          tasaOCuota: TASA_IVA,
          importe: Math.round(c.importe * TASA_IVA * 100) / 100,
        }
      : null,
  }));

  let xmlSellado = await getXmlPrevio(idFactura);
  let folioUsado: number;

  if (xmlSellado && !xmlSellado.includes(SELLO_VACIO)) {
    const folioTexto = /\sFolio="(\d+)"/.exec(xmlSellado)?.[1];
    folioUsado = folioTexto ? Number(folioTexto) : await siguienteFolio(emisor.id);
  } else {
    folioUsado = await siguienteFolio(emisor.id);
    const { fecha, hora } = ahoraCfdi();

    const comprobante: ComprobanteCfdi = {
      serie: emisor.serie ?? "",
      folio: String(folioUsado),
      fecha: fechaCfdi({ fecha, hora }),
      formaPago: claveFormaPago,
      condicionesDePago: "",
      metodoPago: claveMetodoPago,
      moneda: claveMoneda,
      tipoDeComprobante: "I",
      lugarExpedicion: String(cpEmisor),
      cfdiRelacionados:
        facturaDetalle.cfdiRelacionado && facturaDetalle.tipoRelacion
          ? { tipoRelacion: facturaDetalle.tipoRelacion, uuids: [facturaDetalle.cfdiRelacionado] }
          : null,
      emisor: { rfc: emisor.rfc, nombre: emisor.razonSocial, regimenFiscal: claveRegimenEmisor },
      receptor: {
        rfc: receptor.rfc,
        nombre: receptor.razonSocial,
        domicilioFiscalReceptor: String(cpReceptor),
        regimenFiscalReceptor: claveRegimenReceptor,
        usoCfdi: claveUso,
      },
      conceptos: conceptosCfdi,
      decimales: DECIMALES,
    };

    const xmlSinSello = construirXml(comprobante, csd.numeroCertificado, csd.cer.toString("base64"));
    const cadena = await cadenaOriginal(xmlSinSello);

    const password = decryptSecret(csd.passwordEnc);
    if (!password) {
      return {
        ok: false,
        error: "No se pudo descifrar la contraseña del CSD. Vuelve a subir el certificado.",
        puedeReintentar: false,
      };
    }

    let llave;
    try {
      llave = leerLlavePrivada(csd.key, password);
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "No se pudo leer la llave privada del CSD.",
        puedeReintentar: false,
      };
    }

    const sello = sellar(cadena, llave);
    xmlSellado = conSello(xmlSinSello, sello);
    await guardarXmlSellado(idFactura, xmlSellado);
  }

  const resultado = await timbrarConFinkok(xmlSellado, credencialesFinkok(ambiente));
  if (!resultado.ok) {
    return { ok: false, error: resultado.mensaje, puedeReintentar: !resultado.rechazoCierto };
  }

  const datos = datosTimbre(resultado.xml);
  const importeConceptos = facturaDetalle.conceptos.reduce((acc, c) => acc + c.importe, 0);
  const importeIva = facturaDetalle.conceptos
    .filter((c) => c.gravado)
    .reduce((acc, c) => acc + Math.round(c.importe * TASA_IVA * 100) / 100, 0);

  await marcarTimbrada(idFactura, {
    xmlFinal: resultado.xml,
    uuid: resultado.uuid,
    fechaTimbrado: resultado.fecha,
    cadenaOriginal: resultado.cadenaOriginalTimbre ?? datos.cadenaOriginal,
    ambiente,
    serie: emisor.serie,
    folio: folioUsado,
    emisorNombre: emisor.razonSocial,
    emisorRfc: emisor.rfc,
    idRegimenEmisor: emisor.idRegimen,
    receptorNombre: receptor.razonSocial,
    receptorRfc: receptor.rfc,
    idRegimen: idRegimenReceptor,
    codigoPostalReceptor: cpReceptor,
    cpExpedicion: cpEmisor,
    importe: datos.total ?? Math.round((importeConceptos + importeIva) * 100) / 100,
  });

  return { ok: true };
}
