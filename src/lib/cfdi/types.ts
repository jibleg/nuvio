/**
 * Tipos del CFDI 4.0: la forma de los datos que se convierten en XML.
 *
 * Son un espejo del comprobante, no de la base de datos: cada campo se llama
 * como el atributo del XML que alimenta. La traducción desde las tablas legacy
 * ocurre una sola vez, en `lectura.ts`, para que el armado del XML no tenga que
 * saber nada de `cfdi.factura` ni de sus catálogos.
 */

/** Versión del estándar que emitimos. */
export const VERSION_CFDI_XML = "4.0";
/** `Exportacion`: 01 = no aplica (nunca exportamos). */
export const EXPORTACION_NO_APLICA = "01";
/** `ObjetoImp`: 02 = sí objeto de impuesto; 01 = no objeto. */
export const OBJETO_IMP_SI = "02";
export const OBJETO_IMP_NO = "01";
/** `Impuesto`: 002 = IVA. */
export const IMPUESTO_IVA = "002";
/**
 * `TipoFactor`, tal como los escribe el SAT.
 *
 * OJO: no coinciden con el catálogo `cfdi.factor` de la BD, que los guarda en
 * mayúsculas (TASA / CUOTA / EXENTO). Emitir el texto de la BD tal cual produce
 * un CFDI que el SAT rechaza, así que la traducción se hace por clave —nunca por
 * nombre— en `factorSat` (`lectura.ts`).
 */
export const FACTOR_TASA = "Tasa";
export const FACTOR_CUOTA = "Cuota";
export const FACTOR_EXENTO = "Exento";
/** Solo facturamos en pesos, así que el tipo de cambio es siempre 1. */
export const TIPO_CAMBIO_MXN = "1";

/** El traslado de IVA de un concepto. Un concepto exento no lleva tasa ni importe. */
export interface TrasladoCfdi {
  base: number;
  impuesto: string;
  tipoFactor: string;
  /** Factor, no porcentaje: 16% viaja como 0.160000. Ausente si es exento. */
  tasaOCuota: number | null;
  importe: number | null;
}

export interface ConceptoCfdi {
  claveProdServ: string;
  noIdentificacion: string;
  cantidad: number;
  claveUnidad: string;
  unidad: string;
  descripcion: string;
  valorUnitario: number;
  importe: number;
  objetoImp: string;
  traslado: TrasladoCfdi | null;
}

export interface EmisorCfdi {
  rfc: string;
  nombre: string;
  regimenFiscal: string;
}

export interface ReceptorCfdi {
  rfc: string;
  nombre: string;
  domicilioFiscalReceptor: string;
  regimenFiscalReceptor: string;
  usoCfdi: string;
}

/**
 * `CfdiRelacionados`: liga este comprobante a uno o más CFDI previos.
 * Nuvio solo emite el caso de refacturación (`TipoRelacion = "04"`,
 * sustitución de los CFDI previos), siempre con un único UUID.
 */
export interface CfdiRelacionadosCfdi {
  tipoRelacion: string;
  uuids: string[];
}

/** Todo lo que el XML necesita, ya traducido y sin rastro de la BD. */
export interface ComprobanteCfdi {
  serie: string;
  folio: string;
  /** `AAAA-MM-DDTHH:MM:SS` en hora local del lugar de expedición. */
  fecha: string;
  formaPago: string;
  condicionesDePago: string;
  metodoPago: string;
  moneda: string;
  tipoDeComprobante: string;
  lugarExpedicion: string;
  /** Presente solo al refacturar: liga este CFDI al que sustituye. */
  cfdiRelacionados?: CfdiRelacionadosCfdi | null;
  emisor: EmisorCfdi;
  receptor: ReceptorCfdi;
  conceptos: ConceptoCfdi[];
  /** Decimales (2-6) con los que se declaran ValorUnitario, Base e Importe. */
  decimales: number;
}

/** El CSD listo para sellar, tal como lo necesita el XML. */
export interface FirmaCfdi {
  noCertificado: string;
  certificadoBase64: string;
  cer: Buffer;
  key: Buffer;
  password: string;
}
