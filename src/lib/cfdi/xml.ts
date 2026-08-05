/**
 * Armado del XML del CFDI 4.0.
 *
 * Función pura: recibe el comprobante ya traducido y devuelve texto. No consulta
 * la base ni firma nada, para poder compararlo contra los XML reales sin montar
 * nada alrededor.
 *
 * El formato calca el de las 30 facturas timbradas reales (`factura-demo`), que
 * el SAT ya aceptó. Eso incluye rarezas como los decimales despareados: no son
 * un descuido, son lo que está probado que pasa.
 */

import {
  EXPORTACION_NO_APLICA,
  FACTOR_EXENTO,
  TIPO_CAMBIO_MXN,
  VERSION_CFDI_XML,
  type ComprobanteCfdi,
  type ConceptoCfdi,
  type TrasladoCfdi,
} from "./types";

/**
 * Decimales de cada campo, tomados de las 30 reales (verificado: el patrón se
 * repite en 30/30 comprobantes y 139/139 conceptos).
 *
 * A nivel comprobante todo lleva 2, pero el importe del concepto y el de su
 * traslado llevan 4, y la tasa 6. Emitir otra cosa no está probado: el SAT
 * valida `Traslado@Importe = Base × TasaOCuota` con una tolerancia de apenas
 * ±0.0001 (confirmado con GBS155, ver `facturacion-reglas`), y a menos de 4
 * decimales el redondeo de Base ya la revienta. Por eso NO son elegibles.
 */
const DEC_COMPROBANTE = 2;
const DEC_IMPORTE_CONCEPTO = 4;
const DEC_TASA = 6;

/** Espacios de nombres y ubicación del esquema, idénticos a los reales. */
const XMLNS_CFDI = "http://www.sat.gob.mx/cfd/4";
const XMLNS_XSI = "http://www.w3.org/2001/XMLSchema-instance";
const SCHEMA_LOCATION = "http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd";

/**
 * El atributo `Sello` va presente y vacío hasta que se calcula.
 *
 * No pasa por `attrs` (que descarta los vacíos) sino que se escribe literal: el
 * esquema lo exige aunque esté vacío, el XSLT de la cadena no lo lee, y
 * `conSello` necesita encontrarlo tal cual para reemplazarlo.
 */
export const SELLO_VACIO = ' Sello=""';

/** Redondeo a media arriba, evitando el sesgo binario de `toFixed` en casos como 1.005. */
function num(valor: number, decimales: number): string {
  const f = 10 ** decimales;
  return (Math.round((valor + Number.EPSILON) * f) / f).toFixed(decimales);
}

/**
 * Cantidad: sin ceros de relleno. Las 139 reales son enteras ("14") y así se
 * emiten; una fraccionaria saldría con sus decimales y sin arrastrar ceros.
 */
function cantidad(valor: number): string {
  return String(valor);
}

export function esc(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Redondeo a `decimales` posiciones (media arriba). Compartido con el builder de pago. */
export function numero(valor: number, decimales: number): string {
  return num(valor, decimales);
}

/** Atributos en el orden dado, omitiendo los vacíos. Compartido con el builder de pago. */
export function attrs(pares: [string, string | null][]): string {
  return pares
    .filter(([, v]) => v !== null && v !== "")
    .map(([k, v]) => `${k}="${esc(v as string)}"`)
    .join(" ");
}

/**
 * El valor TAL COMO QUEDARÁ ESCRITO en el XML.
 *
 * Toda suma del comprobante se hace sobre estos y no sobre los internos: el SAT
 * compara cada agregado contra la suma de lo que ve declarado en sus partes, y
 * los conceptos se escriben con más decimales que el comprobante.
 */
function declarado(valor: number, decimales: number): number {
  return Number(num(valor, decimales));
}

/**
 * Suma sin arrastre de coma flotante: acumula en unidades enteras.
 *
 * Sumar 0.1 + 0.2 en binario no da 0.3, y con decenas de conceptos el error
 * puede empujar un redondeo al centavo de al lado. Trabajar en enteros lo evita.
 */
function sumaDeclarada(valores: number[], decimales: number): number {
  const f = 10 ** decimales;
  return valores.reduce((a, v) => a + Math.round(v * f), 0) / f;
}

/**
 * Traslados del comprobante: el resumen agrupado por impuesto, factor y tasa.
 *
 * Los conceptos exentos quedan fuera a propósito: el SAT no los suma en los
 * traslados, solo los declara en el concepto.
 *
 * Base e importe se agregan desde los valores DECLARADOS en cada concepto —la
 * base a 2 decimales, el importe a 4, que es como se escriben— porque el SAT
 * valida el traslado del comprobante contra "el redondeo de la suma de los
 * importes registrados en los conceptos" con esa misma tasa. Agregar los
 * internos de mayor precisión desviaba el resultado un centavo.
 */
function trasladosResumen(conceptos: ConceptoCfdi[]): { clave: string; t: TrasladoCfdi; base: number; importe: number }[] {
  const grupos = new Map<string, { clave: string; t: TrasladoCfdi; bases: number[]; importes: number[] }>();
  for (const c of conceptos) {
    const t = c.traslado;
    if (!t || t.tipoFactor === FACTOR_EXENTO) continue;
    const clave = `${t.impuesto}|${t.tipoFactor}|${t.tasaOCuota}`;
    const g = grupos.get(clave) ?? { clave, t, bases: [], importes: [] };
    g.bases.push(declarado(t.base, DEC_IMPORTE_CONCEPTO));
    g.importes.push(declarado(t.importe ?? 0, DEC_IMPORTE_CONCEPTO));
    grupos.set(clave, g);
  }
  return [...grupos.values()].map((g) => ({
    clave: g.clave,
    t: g.t,
    base: alCentavo(sumaDeclarada(g.bases, DEC_IMPORTE_CONCEPTO)),
    importe: alCentavo(sumaDeclarada(g.importes, DEC_IMPORTE_CONCEPTO)),
  }));
}

/**
 * `decimales` aplica a Base y a Importe por igual.
 *
 * En el concepto van con la precisión del importe (4) y en el comprobante al
 * centavo. Escribir la base con menos decimales que el importe descuadraba la
 * suma: la base gravable de un concepto ES su importe, y al redondear decenas
 * de bases por separado se perdían centavos que el importe sí conservaba. El
 * SAT compara el traslado del comprobante contra la suma de los de sus
 * conceptos, y ahí saltaba.
 */
function xmlTraslado(t: TrasladoCfdi, decimales: number): string {
  return `<cfdi:Traslado ${attrs([
    ["Base", num(t.base, decimales)],
    ["Impuesto", t.impuesto],
    ["TipoFactor", t.tipoFactor],
    ["TasaOCuota", t.tasaOCuota === null ? null : num(t.tasaOCuota, DEC_TASA)],
    ["Importe", t.importe === null ? null : num(t.importe, decimales)],
  ])}/>`;
}

/**
 * `decimalesValorUnitario` es lo único elegible por factura (ver
 * `facturacion/types.ts`, 2 a 6, default 2): es el precio tal como se
 * capturó/calculó, y no participa en la tolerancia `Base × Tasa = Importe`
 * que exige los 4 decimales fijos de arriba.
 */
function xmlConcepto(c: ConceptoCfdi, decimalesValorUnitario: number): string {
  const cabecera = attrs([
    ["ClaveProdServ", c.claveProdServ],
    ["NoIdentificacion", c.noIdentificacion],
    ["Cantidad", cantidad(c.cantidad)],
    ["ClaveUnidad", c.claveUnidad],
    ["Unidad", c.unidad],
    ["Descripcion", c.descripcion],
    ["ValorUnitario", num(c.valorUnitario, decimalesValorUnitario)],
    ["Importe", num(c.importe, DEC_IMPORTE_CONCEPTO)],
    ["Descuento", num(0, DEC_COMPROBANTE)],
    ["ObjetoImp", c.objetoImp],
  ]);
  if (!c.traslado) return `<cfdi:Concepto ${cabecera}/>`;
  return (
    `<cfdi:Concepto ${cabecera}>` +
    `<cfdi:Impuestos><cfdi:Traslados>${xmlTraslado(c.traslado, DEC_IMPORTE_CONCEPTO)}</cfdi:Traslados></cfdi:Impuestos>` +
    `</cfdi:Concepto>`
  );
}

/** Redondeo al centavo: es como se declara todo importe del comprobante. */
function alCentavo(valor: number): number {
  return Number(num(valor, DEC_COMPROBANTE));
}

/**
 * Traslados del comprobante (ya al centavo) y su total.
 *
 * El total agrega los importes de los grupos tal como se escriben, para que
 * `TotalImpuestosTrasladados` sea exactamente la suma de los `Traslado` que
 * lleva debajo.
 */
function impuestosComprobante(conceptos: ConceptoCfdi[]) {
  const grupos = trasladosResumen(conceptos);
  return { grupos, total: alCentavo(sumaDeclarada(grupos.map((g) => g.importe), DEC_COMPROBANTE)) };
}

/** Bloque de impuestos del comprobante. Se omite si no hay ningún traslado. */
function xmlImpuestos(conceptos: ConceptoCfdi[]): string {
  const { grupos, total } = impuestosComprobante(conceptos);
  if (grupos.length === 0) return "";
  const traslados = grupos
    .map((g) => xmlTraslado({ ...g.t, base: g.base, importe: g.importe }, DEC_COMPROBANTE))
    .join("");
  return (
    `<cfdi:Impuestos TotalImpuestosTrasladados="${num(total, DEC_COMPROBANTE)}">` +
    `<cfdi:Traslados>${traslados}</cfdi:Traslados>` +
    `</cfdi:Impuestos>`
  );
}

/**
 * Subtotal (suma de conceptos) y total (subtotal + traslados).
 *
 * Los tres se redondean al centavo ANTES de combinarse, para que se cumpla al
 * pie de la letra lo que el SAT comprueba: `Total = SubTotal − Descuento +
 * Traslados − Retenciones` usando los valores declarados. Redondear solo al
 * final desviaba el total un centavo cuando los importes traían fracciones de
 * centavo —precios con más de dos decimales— y el PAC lo rechazaba con "El
 * campo Total no corresponde con la suma del subtotal…".
 */
export function totalesCfdi(conceptos: ConceptoCfdi[]): { subTotal: number; total: number } {
  const importes = conceptos.map((c) => declarado(c.importe, DEC_IMPORTE_CONCEPTO));
  const subTotal = alCentavo(sumaDeclarada(importes, DEC_IMPORTE_CONCEPTO));
  const { total: impuestos } = impuestosComprobante(conceptos);
  return { subTotal, total: alCentavo(sumaDeclarada([subTotal, impuestos], DEC_COMPROBANTE)) };
}

/**
 * Arma el XML del comprobante con el atributo `Sello` vacío.
 *
 * Así debe ser: la cadena original se calcula sobre este XML y el sello se
 * inserta después con `conSello`. El atributo va presente y vacío porque el
 * esquema lo exige y el XSLT no lo lee.
 */
export function construirXml(c: ComprobanteCfdi, noCertificado: string, certificadoBase64: string): string {
  const { subTotal, total } = totalesCfdi(c.conceptos);
  const comprobante = attrs([
    ["Version", VERSION_CFDI_XML],
    ["Serie", c.serie],
    ["Folio", c.folio],
    ["Fecha", c.fecha],
    ["FormaPago", c.formaPago],
    ["NoCertificado", noCertificado],
    ["Certificado", certificadoBase64],
    ["CondicionesDePago", c.condicionesDePago],
    ["SubTotal", num(subTotal, DEC_COMPROBANTE)],
    ["Descuento", num(0, DEC_COMPROBANTE)],
    ["Moneda", c.moneda],
    ["TipoCambio", TIPO_CAMBIO_MXN],
    ["Total", num(total, DEC_COMPROBANTE)],
    ["TipoDeComprobante", c.tipoDeComprobante],
    ["Exportacion", EXPORTACION_NO_APLICA],
    ["MetodoPago", c.metodoPago],
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

  const conceptos = `<cfdi:Conceptos>${c.conceptos.map((concepto) => xmlConcepto(concepto, c.decimales)).join("")}</cfdi:Conceptos>`;

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<cfdi:Comprobante xmlns:cfdi="${XMLNS_CFDI}" xmlns:xsi="${XMLNS_XSI}" xsi:schemaLocation="${SCHEMA_LOCATION}" ${comprobante}${SELLO_VACIO}>` +
    emisor +
    receptor +
    conceptos +
    xmlImpuestos(c.conceptos) +
    `</cfdi:Comprobante>`
  );
}

/**
 * Inserta el sello en el XML.
 *
 * Reemplaza únicamente el `Sello=""` vacío del comprobante; se ancla al atributo
 * exacto para no tocar por accidente ningún otro texto del documento.
 */
export function conSello(xml: string, sello: string): string {
  if (!xml.includes(SELLO_VACIO)) {
    throw new Error("El XML no tiene el atributo Sello vacío donde se esperaba.");
  }
  return xml.replace(SELLO_VACIO, ` Sello="${esc(sello)}"`);
}
