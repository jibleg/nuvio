/**
 * Armado del XML de un CFDI 4.0 tipo "P" (Pago) con el complemento Pagos 2.0.
 *
 * Función pura, como `xml.ts`: recibe el pago ya traducido y devuelve texto. Un
 * comprobante de pago NO factura nada —SubTotal y Total van en 0 y la Moneda es
 * "XXX"—: su información viva está en el nodo `pago20:Pagos`, que relaciona los
 * CFDI de ingreso pagados (`DoctoRelacionado`) y registra el pago recibido.
 *
 * Portado de `facturacion-facil` (motor CFDI ya probado contra el SAT vía
 * Finkok), ver [[nuvio-facturacion-modulo]].
 */

import { attrs, esc, numero, SELLO_VACIO } from "./xml";
import { IMPUESTO_IVA, FACTOR_TASA, type EmisorCfdi, type ReceptorCfdi } from "./types";

/** Los importes en MXN llevan 2 decimales; la tasa, 6. */
const DEC_MXN = 2;
const DEC_TASA = 6;
/** IVA al 16% como factor. */
const TASA_IVA = 0.16;

/** Valores fijos del comprobante de pago (Anexo 20). */
const VERSION_CFDI_XML = "4.0";
const VERSION_PAGOS = "2.0";
const MONEDA_COMPROBANTE = "XXX";
const TIPO_COMPROBANTE_P = "P";
const EXPORTACION_NO_APLICA = "01";
/** Concepto único obligatorio de un CFDI de pago. */
const CLAVE_PROD_SERV_PAGO = "84111506";
const CLAVE_UNIDAD_PAGO = "ACT";
const DESCRIPCION_PAGO = "Pago";
/** ObjetoImp del concepto de pago: 01 = no objeto de impuesto. */
const OBJETO_IMP_CONCEPTO = "01";
/** ObjetoImpDR: 02 = sí objeto de impuesto (el documento pagado sí causa IVA). */
const OBJETO_IMP_DR = "02";
/** Cuando la moneda del documento coincide con la del pago, la equivalencia es 1. */
const EQUIVALENCIA_DR = "1";

const XMLNS_CFDI = "http://www.sat.gob.mx/cfd/4";
const XMLNS_PAGO20 = "http://www.sat.gob.mx/Pagos20";
const XMLNS_XSI = "http://www.w3.org/2001/XMLSchema-instance";
const SCHEMA_LOCATION =
  "http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd " +
  "http://www.sat.gob.mx/Pagos20 http://www.sat.gob.mx/sitio_internet/cfd/Pagos/Pagos20.xsd";

/** Un CFDI de ingreso que este pago liquida, ya traducido a lo que el XML pide. */
export interface DoctoRelacionadoXml {
  /** UUID del CFDI de ingreso relacionado. */
  idDocumento: string;
  serie: string | null;
  folio: string | null;
  numParcialidad: number;
  impSaldoAnt: number;
  impPagado: number;
  impSaldoInsoluto: number;
  /** Base gravada del abono (parte sin IVA) e importe de IVA trasladado. */
  base: number;
  importe: number;
}

/** Un pago recibido con los documentos que liquida. */
export interface PagoXml {
  serie: string;
  folio: string;
  /** `AAAA-MM-DDTHH:MM:SS` del comprobante (momento del sellado). */
  fecha: string;
  lugarExpedicion: string;
  emisor: EmisorCfdi;
  receptor: ReceptorCfdi;
  /** `AAAA-MM-DDTHH:MM:SS` del pago (lo capturó el operador). */
  fechaPago: string;
  /** Forma de pago del SAT (01, 03…). */
  formaDePagoP: string;
  monedaP: string;
  monto: number;
  numOperacion: string | null;
  documentos: DoctoRelacionadoXml[];
}

/** Suma redondeada al centavo de una lista de importes. */
function suma(valores: number[]): number {
  return Number(valores.reduce((a, b) => a + b, 0).toFixed(DEC_MXN));
}

/** Un traslado de IVA 16% (usado tanto en el DR como en el resumen del pago). */
function trasladoIva(prefijo: "DR" | "P", base: number, importe: number): string {
  return `<pago20:Traslado${prefijo} ${attrs([
    [`Base${prefijo}`, numero(base, DEC_MXN)],
    [`Impuesto${prefijo}`, IMPUESTO_IVA],
    [`TipoFactor${prefijo}`, FACTOR_TASA],
    [`TasaOCuota${prefijo}`, numero(TASA_IVA, DEC_TASA)],
    [`Importe${prefijo}`, numero(importe, DEC_MXN)],
  ])}/>`;
}

function xmlDoctoRelacionado(d: DoctoRelacionadoXml): string {
  const cabecera = attrs([
    ["IdDocumento", d.idDocumento],
    ["Serie", d.serie],
    ["Folio", d.folio],
    ["MonedaDR", "MXN"],
    ["EquivalenciaDR", EQUIVALENCIA_DR],
    ["NumParcialidad", String(d.numParcialidad)],
    ["ImpSaldoAnt", numero(d.impSaldoAnt, DEC_MXN)],
    ["ImpPagado", numero(d.impPagado, DEC_MXN)],
    ["ImpSaldoInsoluto", numero(d.impSaldoInsoluto, DEC_MXN)],
    ["ObjetoImpDR", OBJETO_IMP_DR],
  ]);
  return (
    `<pago20:DoctoRelacionado ${cabecera}>` +
    `<pago20:ImpuestosDR><pago20:TrasladosDR>${trasladoIva("DR", d.base, d.importe)}</pago20:TrasladosDR></pago20:ImpuestosDR>` +
    `</pago20:DoctoRelacionado>`
  );
}

/** Resumen de impuestos del pago: la suma de los traslados de sus documentos. */
function xmlImpuestosP(docs: DoctoRelacionadoXml[]): string {
  const base = suma(docs.map((d) => d.base));
  const importe = suma(docs.map((d) => d.importe));
  return `<pago20:ImpuestosP><pago20:TrasladosP>${trasladoIva("P", base, importe)}</pago20:TrasladosP></pago20:ImpuestosP>`;
}

/** El complemento `pago20:Pagos` completo: Totales + un Pago con sus documentos. */
function xmlPagos(c: PagoXml): string {
  const totalBase = suma(c.documentos.map((d) => d.base));
  const totalImpuesto = suma(c.documentos.map((d) => d.importe));

  const totales = attrs([
    ["TotalTrasladosBaseIVA16", numero(totalBase, DEC_MXN)],
    ["TotalTrasladosImpuestoIVA16", numero(totalImpuesto, DEC_MXN)],
    ["MontoTotalPagos", numero(c.monto, DEC_MXN)],
  ]);

  const pago = attrs([
    ["FechaPago", c.fechaPago],
    ["FormaDePagoP", c.formaDePagoP],
    ["MonedaP", c.monedaP],
    // El SAT exige TipoCambioP="1" cuando MonedaP es MXN (y el tipo de cambio real
    // si fuera otra moneda; aquí solo operamos en MXN). Sin esto el PAC rechaza:
    // "El campo TipoCambioP debe contener el valor '1'".
    ["TipoCambioP", c.monedaP === "MXN" ? "1" : null],
    ["Monto", numero(c.monto, DEC_MXN)],
    ["NumOperacion", c.numOperacion],
  ]);

  return (
    `<pago20:Pagos Version="${VERSION_PAGOS}">` +
    `<pago20:Totales ${totales}/>` +
    `<pago20:Pago ${pago}>` +
    c.documentos.map(xmlDoctoRelacionado).join("") +
    xmlImpuestosP(c.documentos) +
    `</pago20:Pago>` +
    `</pago20:Pagos>`
  );
}

/**
 * Arma el XML del comprobante de pago con el atributo `Sello` vacío. La cadena
 * original se calcula sobre este XML (incluyendo `pago20:Pagos`, que SÍ se firma)
 * y el sello se inserta después con `conSello` de `xml.ts`.
 */
export function construirXmlPago(c: PagoXml, noCertificado: string, certificadoBase64: string): string {
  const comprobante = attrs([
    ["Version", VERSION_CFDI_XML],
    ["Serie", c.serie],
    ["Folio", c.folio],
    ["Fecha", c.fecha],
    ["NoCertificado", noCertificado],
    ["Certificado", certificadoBase64],
    ["SubTotal", "0"],
    ["Moneda", MONEDA_COMPROBANTE],
    ["Total", "0"],
    ["TipoDeComprobante", TIPO_COMPROBANTE_P],
    ["Exportacion", EXPORTACION_NO_APLICA],
    ["LugarExpedicion", c.lugarExpedicion],
  ]);

  const emisor = `<cfdi:Emisor ${attrs([
    ["Rfc", c.emisor.rfc],
    ["Nombre", c.emisor.nombre],
    ["RegimenFiscal", c.emisor.regimenFiscal],
  ])}/>`;

  const receptor = `<cfdi:Receptor ${attrs([
    ["Rfc", c.receptor.rfc],
    ["Nombre", c.receptor.nombre],
    ["DomicilioFiscalReceptor", c.receptor.domicilioFiscalReceptor],
    ["RegimenFiscalReceptor", c.receptor.regimenFiscalReceptor],
    ["UsoCFDI", c.receptor.usoCfdi],
  ])}/>`;

  // El concepto único de un pago: clave 84111506, cantidad 1, importe 0.
  const conceptos =
    `<cfdi:Conceptos><cfdi:Concepto ${attrs([
      ["ClaveProdServ", CLAVE_PROD_SERV_PAGO],
      ["Cantidad", "1"],
      ["ClaveUnidad", CLAVE_UNIDAD_PAGO],
      ["Descripcion", DESCRIPCION_PAGO],
      ["ValorUnitario", "0"],
      ["Importe", "0"],
      ["ObjetoImp", OBJETO_IMP_CONCEPTO],
    ])}/></cfdi:Conceptos>`;

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<cfdi:Comprobante xmlns:cfdi="${XMLNS_CFDI}" xmlns:pago20="${XMLNS_PAGO20}" ` +
    `xmlns:xsi="${XMLNS_XSI}" xsi:schemaLocation="${esc(SCHEMA_LOCATION)}" ${comprobante}${SELLO_VACIO}>` +
    emisor +
    receptor +
    conceptos +
    `<cfdi:Complemento>${xmlPagos(c)}</cfdi:Complemento>` +
    `</cfdi:Comprobante>`
  );
}
