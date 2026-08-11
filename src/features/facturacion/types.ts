/**
 * Factura = `cfdi.factura` + sus `cfdi.concepto`. El emisor siempre es una
 * fila de `corporativo.empresas` con identidad fiscal propia (matriz o
 * sucursal con RFC propio, `@/features/facturacion/repositories/emisor-repository`);
 * el receptor siempre es un `contactos_facturacion` (nunca `empresas`, ver
 * el comentario en `src/lib/db/schema/cfdi.ts` sobre `cveEmpresa`).
 *
 * MVP: solo comprobantes de Ingreso, IVA trasladado a tasa 16% por concepto
 * (sin exentos, IEPS ni retenciones), 2 decimales fijos. Cancelación vive en
 * `use-cases/cancelar-factura.ts` (Fase 2).
 */

export type EstadoFactura = "borrador" | "timbrada" | "cancelada";

export type ConceptoInput = {
  idServicio: number;
  claveProdServ: string;
  idUnidad: number;
  claveUnidad: string;
  descripcion: string;
  cantidad: number;
  valorUnitario: number;
  /** true = aplica IVA 16% trasladado; false = no objeto de impuesto. */
  gravado: boolean;
};

export type FacturaListItem = {
  id: number;
  estado: EstadoFactura;
  /**
   * Detalle crudo del trámite de cancelación cuando la factura sigue vigente
   * pero ya se solicitó: `solicitada` (en proceso, pendiente de aceptación),
   * `rechazada` o `plazo_vencido` (el SAT la dejó vigente). `null` si nunca
   * se ha intentado cancelar, o si `estado` ya es `"cancelada"`.
   */
  estatusCancelacion: string | null;
  serie: string | null;
  folio: number | null;
  folioFiscal: string | null;
  emisorNombre: string | null;
  emisorRfc: string | null;
  receptorNombre: string | null;
  receptorRfc: string | null;
  total: string | null;
  fechaTimbrado: string | null;
};

export type FacturaDetalle = FacturaListItem & {
  idEmpresaEmisora: number;
  idContactoFacturacion: number;
  idUso: number;
  idFormaPago: number;
  idMetodo: number;
  idMoneda: number;
  observacion: string | null;
  /** Régimen fiscal del emisor y del receptor al momento de timbrar (foto, no referencia) — `null` en un borrador aún sin timbrar. */
  idRegimenEmisor: number | null;
  idRegimenReceptor: number | null;
  /** Lugar de expedición (CP del emisor) y CP del receptor, ambos snapshot al timbrar — `null` en un borrador. */
  cpExpedicion: number | null;
  codigoPostalReceptor: number | null;
  conceptos: (ConceptoInput & { importe: number })[];
  /** UUID del CFDI al que este comprobante sustituye (refacturación), si aplica. */
  cfdiRelacionado: string | null;
  /** `"04"` = sustitución de los CFDI previos — el único tipo de relación que emite Nuvio. */
  tipoRelacion: string | null;
  /** Ambiente de Finkok con el que se timbró (`null` = borrador aún sin timbrar, o fila histórica sin este dato). */
  ambienteTimbrado: "sandbox" | "produccion" | null;
};

/** Referencia liviana a otra factura del mismo cliente — usada para enlazar original ↔ sustituto en refacturación. */
export type FacturaResumenRelacion = { id: number; folioFiscal: string };

export type CrearBorradorData = {
  idEmpresaEmisora: number;
  idContactoFacturacion: number;
  idUso: number;
  idFormaPago: number;
  idMetodo: number;
  idMoneda: number;
  observacion: string | null;
  conceptos: ConceptoInput[];
  /** Presentes solo al refacturar (ver `use-cases/refacturar.ts`). */
  cfdiRelacionado?: string | null;
  tipoRelacion?: string | null;
};

export type FacturaMutationResult = { ok: true; id: number } | { ok: false; error: string };

export type TimbrarResult =
  | { ok: true }
  | { ok: false; error: string; puedeReintentar: boolean };

export type CancelarResult = { ok: true; mensaje: string } | { ok: false; error: string };

/**
 * Complementos de pago (CFDI 4.0 tipo "P"): un pago recibido que liquida, total
 * o parcialmente, una o más facturas de ingreso a crédito (método PPD). El
 * comprobante en sí es otra fila de `cfdi.factura` (`idTipoComprobante = 5`,
 * ver `TIPO_COMPROBANTE_PAGO`); `cfdi.pago`/`cfdi.documento_relacionado` (tablas
 * heredadas, sin usar hasta ahora) guardan lo propio del pago.
 */

/** `cfdi.tipo_comprobante` — el complemento de pago es su propio tipo. */
export const TIPO_COMPROBANTE_PAGO = 5;
/** `cfdi.uso` — CP01 "Pagos", uso de CFDI obligatorio en el receptor de un pago. */
export const CVE_USO_CP01 = 24;
/** `cfdi.metodo_pago` — único método que exige complemento de pago (crédito). */
export const CVE_METODO_PPD = 2;

/** Una factura de ingreso PPD con saldo pendiente, candidata a recibir un pago. */
export type FacturaPorPagar = {
  id: number;
  serie: string | null;
  folio: number | null;
  folioFiscal: string;
  emisorNombre: string | null;
  idEmpresaEmisora: number;
  receptorNombre: string | null;
  receptorRfc: string | null;
  idContactoFacturacion: number;
  fechaTimbrado: string | null;
  /** Total con IVA del CFDI de ingreso. */
  total: number;
  /** Suma de lo ya pagado por complementos previos (borrador o timbrados) vivos. */
  pagado: number;
  /** `total - pagado`. */
  saldo: number;
  /** Parcialidad que le tocaría al próximo pago. */
  siguienteParcialidad: number;
};

/** Datos del pago recibido, capturados por el operador. */
export type DatosPago = {
  idFormaPago: number;
  /** `AAAA-MM-DD`; la hora se fija a mediodía local. */
  fechaPago: string;
  numeroOperacion: string;
  cuentaOrdenante: string | null;
  cuentaBeneficiario: string | null;
};

/** Una factura de ingreso que este pago liquida (total o parcialmente). */
export type DocumentoAPagar = {
  idFactura: number;
  /** Lo que se abona a ESTA factura con este pago. */
  importePagado: number;
};

export type CrearBorradorPagoResult = { ok: true; id: number } | { ok: false; error: string };

export type PagoListItem = {
  id: number;
  estado: EstadoFactura;
  estatusCancelacion: string | null;
  serie: string | null;
  folio: number | null;
  folioFiscal: string | null;
  emisorNombre: string | null;
  emisorRfc: string | null;
  receptorNombre: string | null;
  receptorRfc: string | null;
  fechaPago: string | null;
  monto: string | null;
  documentos: number;
  fechaTimbrado: string | null;
};

export type PagoDocumentoDetalle = {
  folioFiscal: string | null;
  serieFolio: string;
  parcialidad: string | null;
  impSaldoAnt: number;
  impPagado: number;
  impSaldoInsoluto: number;
};

/** Un pago (ya timbrado) aplicado a una factura de ingreso — para mostrar su historial en el detalle de la factura. */
export type PagoAplicado = {
  idPago: number;
  folioFiscal: string | null;
  fechaPago: string | null;
  impPagado: number;
};

export type PagoDetalle = PagoListItem & {
  idEmpresaEmisora: number;
  idContactoFacturacion: number;
  idFormaPago: number | null;
  numeroOperacion: string | null;
  documentosDetalle: PagoDocumentoDetalle[];
  /** Ambiente de Finkok con el que se timbró (`null` = borrador aún sin timbrar, o fila histórica sin este dato). */
  ambienteTimbrado: "sandbox" | "produccion" | null;
};
