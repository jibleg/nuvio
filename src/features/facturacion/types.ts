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
  conceptos: (ConceptoInput & { importe: number })[];
};

export type CrearBorradorData = {
  idEmpresaEmisora: number;
  idContactoFacturacion: number;
  idUso: number;
  idFormaPago: number;
  idMetodo: number;
  idMoneda: number;
  observacion: string | null;
  conceptos: ConceptoInput[];
};

export type FacturaMutationResult = { ok: true; id: number } | { ok: false; error: string };

export type TimbrarResult =
  | { ok: true }
  | { ok: false; error: string; puedeReintentar: boolean };

export type CancelarResult = { ok: true; mensaje: string } | { ok: false; error: string };
