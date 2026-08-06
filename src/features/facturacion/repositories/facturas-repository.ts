import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { concepto, conceptoImpuestos, contactosFacturacion, empresas, factura, servicio, unidad } from "@/lib/db/schema";
import { ahoraCfdi } from "@/lib/cfdi/fecha";
import type {
  ConceptoInput,
  CrearBorradorData,
  EstadoFactura,
  FacturaDetalle,
  FacturaListItem,
  FacturaResumenRelacion,
} from "../types";

/** `cfdi.tipo_comprobante` — comprobante de Ingreso. Compartido con `pagos-repository` (tipo Pago = 5, ver `TIPO_COMPROBANTE_PAGO` en `../types`). */
export const TIPO_COMPROBANTE_INGRESO = 1;
/** `cfdi.impuesto` — IVA. */
const IMPUESTO_IVA = 2;
/** `cfdi.factor` — Tasa (vs. Cuota/Exento). */
const FACTOR_TASA = 1;
const TASA_IVA = 0.16;

/** Compartido con `pagos-repository`: mismo criterio (tipoFactura + estatusCancelacion) para cualquier fila de `cfdi.factura`, sea Ingreso o Pago. */
export function toEstado(tipoFactura: number | null, estatusCancelacion: string | null): EstadoFactura {
  if (estatusCancelacion === "cancelada") return "cancelada";
  return tipoFactura === 1 ? "timbrada" : "borrador";
}

const listSelect = {
  id: factura.id,
  tipoFactura: factura.tipoFactura,
  estatusCancelacion: factura.estatusCancelacion,
  serie: factura.serie,
  folio: factura.folio,
  folioFiscal: factura.folioFiscal,
  fechaTimbrado: factura.fechaTimbrado,
  importe: factura.importe,
  emisorNombreCol: factura.emisorNombre,
  emisorRfcCol: factura.emisorRfc,
  nombreCol: factura.nombre,
  rfcCol: factura.rfc,
  idEmpresaEmisora: factura.idEmpresaEmisora,
  idContactoFacturacion: factura.idContactoFacturacion,
};

/**
 * Facturas de un cliente — filtra por `cve_cliente` de la empresa EMISORA
 * (`factura` no tiene columna de tenant propia) y por `idTipoComprobante`
 * Ingreso: los complementos de pago (tipo P, ver `TIPO_COMPROBANTE_PAGO` en
 * `../types`) son otra fila de esta misma tabla y tienen su propio listado
 * (`pagos-repository`), no deben mezclarse aquí.
 */
export async function listFacturas(idCliente: number): Promise<FacturaListItem[]> {
  const rows = await db
    .select(listSelect)
    .from(factura)
    .innerJoin(empresas, eq(empresas.id, factura.idEmpresaEmisora))
    .where(and(eq(empresas.idCliente, idCliente), eq(factura.idTipoComprobante, TIPO_COMPROBANTE_INGRESO)))
    .orderBy(desc(factura.id));

  return rows.map((r) => ({
    id: r.id,
    estado: toEstado(r.tipoFactura, r.estatusCancelacion),
    estatusCancelacion: r.estatusCancelacion,
    serie: r.serie,
    folio: r.folio,
    folioFiscal: r.folioFiscal,
    emisorNombre: r.emisorNombreCol,
    emisorRfc: r.emisorRfcCol,
    receptorNombre: r.nombreCol,
    receptorRfc: r.rfcCol,
    total: r.importe,
    fechaTimbrado: r.fechaTimbrado,
  }));
}

export async function getFacturaDetalle(id: number, idCliente: number): Promise<FacturaDetalle | null> {
  const [row] = await db
    .select({
      ...listSelect,
      idUso: factura.idUso,
      idFormaPago: factura.idFormaPago,
      idMetodo: factura.idMetodo,
      idMoneda: factura.idMoneda,
      observacion: factura.observacion,
      cfdiRelacionado: factura.cfdiRelacionado,
      tipoRelacion: factura.tipoRelacion,
    })
    .from(factura)
    .innerJoin(empresas, eq(empresas.id, factura.idEmpresaEmisora))
    .where(
      and(
        eq(factura.id, id),
        eq(empresas.idCliente, idCliente),
        eq(factura.idTipoComprobante, TIPO_COMPROBANTE_INGRESO),
      ),
    )
    .limit(1);
  if (!row || !row.idEmpresaEmisora || !row.idContactoFacturacion) return null;

  const conceptoRows = await db
    .select({
      idServicio: concepto.idServicio,
      claveProdServ: servicio.clave,
      idUnidad: concepto.idUnidad,
      claveUnidad: unidad.clave,
      cantidad: concepto.cantidad,
      descripcion: concepto.descripcion,
      precio: concepto.precio,
      importe: concepto.importe,
      idImpuesto: conceptoImpuestos.idImpuesto,
    })
    .from(concepto)
    .leftJoin(servicio, eq(servicio.id, concepto.idServicio))
    .leftJoin(unidad, eq(unidad.id, concepto.idUnidad))
    .leftJoin(conceptoImpuestos, and(eq(conceptoImpuestos.idConcepto, concepto.id), eq(conceptoImpuestos.activo, 1)))
    .where(and(eq(concepto.idFactura, id), eq(concepto.activo, 1)))
    .orderBy(concepto.orden);

  return {
    id: row.id,
    estado: toEstado(row.tipoFactura, row.estatusCancelacion),
    estatusCancelacion: row.estatusCancelacion,
    serie: row.serie,
    folio: row.folio,
    folioFiscal: row.folioFiscal,
    emisorNombre: row.emisorNombreCol,
    emisorRfc: row.emisorRfcCol,
    receptorNombre: row.nombreCol,
    receptorRfc: row.rfcCol,
    total: row.importe,
    fechaTimbrado: row.fechaTimbrado,
    idEmpresaEmisora: row.idEmpresaEmisora,
    idContactoFacturacion: row.idContactoFacturacion,
    idUso: row.idUso,
    idFormaPago: row.idFormaPago,
    idMetodo: row.idMetodo,
    idMoneda: row.idMoneda,
    observacion: row.observacion,
    cfdiRelacionado: row.cfdiRelacionado,
    tipoRelacion: row.tipoRelacion,
    conceptos: conceptoRows.map((c) => ({
      idServicio: c.idServicio,
      claveProdServ: c.claveProdServ ?? "",
      idUnidad: c.idUnidad,
      claveUnidad: c.claveUnidad ?? "",
      descripcion: c.descripcion ?? "",
      cantidad: c.cantidad,
      valorUnitario: Number(c.precio),
      gravado: c.idImpuesto !== null,
      importe: Number(c.importe),
    })),
  };
}

async function insertarConceptos(idFactura: number, conceptos: ConceptoInput[]): Promise<void> {
  for (const [i, c] of conceptos.entries()) {
    const importe = c.cantidad * c.valorUnitario;
    const [{ id: idConcepto }] = await db
      .insert(concepto)
      .values({
        idFactura,
        idServicio: c.idServicio,
        idUnidad: c.idUnidad,
        descripcion: c.descripcion,
        cantidad: c.cantidad,
        precio: String(c.valorUnitario),
        importe: String(importe),
        orden: i + 1,
        activo: 1,
      })
      .returning({ id: concepto.id });

    if (c.gravado) {
      const importeIva = Math.round(importe * TASA_IVA * 100) / 100;
      await db.insert(conceptoImpuestos).values({
        idConcepto,
        idFactor: FACTOR_TASA,
        idImpuesto: IMPUESTO_IVA,
        tipoImpuesto: 0,
        importeBase: String(importe),
        tasaCuota: String(TASA_IVA),
        importeImpuesto: String(importeIva),
        activo: 1,
      });
    }
  }
}

/** La pertenencia del emisor/receptor al cliente ya se validó en el use-case. */
export async function createBorrador(idUsuario: number, data: CrearBorradorData): Promise<number> {
  const idCondicion = data.idMetodo === 2 ? 2 : 1; // PPD(2)->CREDITO(2), PUE(1)/N(-1)->CONTADO(1)
  const { fecha, hora } = ahoraCfdi();

  const [{ id }] = await db
    .insert(factura)
    .values({
      idContactoFacturacion: data.idContactoFacturacion,
      idEmpresaEmisora: data.idEmpresaEmisora,
      idUso: data.idUso,
      idFormaPago: data.idFormaPago,
      idMetodo: data.idMetodo,
      idCondicion,
      idMoneda: data.idMoneda,
      idUsuario,
      idTipoComprobante: TIPO_COMPROBANTE_INGRESO,
      observacion: data.observacion,
      cfdiRelacionado: data.cfdiRelacionado ?? null,
      tipoRelacion: data.tipoRelacion ?? null,
      fecha,
      hora,
      tipoFactura: 0,
      activo: 1,
      publicoGeneral: 1,
    })
    .returning({ id: factura.id });

  await insertarConceptos(id, data.conceptos);
  return id;
}

async function borrarConceptos(idFactura: number): Promise<void> {
  const idsConceptos = await db.select({ id: concepto.id }).from(concepto).where(eq(concepto.idFactura, idFactura));
  if (idsConceptos.length > 0) {
    await db.delete(conceptoImpuestos).where(
      inArray(
        conceptoImpuestos.idConcepto,
        idsConceptos.map((c) => c.id),
      ),
    );
  }
  await db.delete(concepto).where(eq(concepto.idFactura, idFactura));
}

/** Reemplaza los conceptos de un borrador (nunca de una factura ya timbrada). */
export async function reemplazarConceptos(idFactura: number, conceptos: ConceptoInput[]): Promise<void> {
  await borrarConceptos(idFactura);
  await insertarConceptos(idFactura, conceptos);
}

/**
 * También limpia `xmlResponse`: si había un XML sellado de un intento de
 * timbrado previo (ver `getXmlPrevio`), editar la cabecera/conceptos lo
 * vuelve obsoleto — reusarlo timbraría datos viejos.
 */
export async function actualizarCabecera(
  idFactura: number,
  data: Omit<CrearBorradorData, "conceptos">,
): Promise<void> {
  const idCondicion = data.idMetodo === 2 ? 2 : 1;
  await db
    .update(factura)
    .set({
      idContactoFacturacion: data.idContactoFacturacion,
      idEmpresaEmisora: data.idEmpresaEmisora,
      idUso: data.idUso,
      idFormaPago: data.idFormaPago,
      idMetodo: data.idMetodo,
      idCondicion,
      idMoneda: data.idMoneda,
      observacion: data.observacion,
      xmlResponse: null,
    })
    .where(eq(factura.id, idFactura));
}

/** true si la factura pertenece al cliente y sigue en borrador (editable/timbrable). */
export async function esBorradorDelCliente(id: number, idCliente: number): Promise<boolean> {
  const [row] = await db
    .select({ id: factura.id })
    .from(factura)
    .innerJoin(empresas, eq(empresas.id, factura.idEmpresaEmisora))
    .where(and(eq(factura.id, id), eq(empresas.idCliente, idCliente), eq(factura.tipoFactura, 0)))
    .limit(1);
  return !!row;
}

/** El CFDI (de este cliente) con este folio fiscal, si existe — para enlazar "factura original" desde el sustituto. */
export async function findFacturaPorFolioFiscal(
  folioFiscal: string,
  idCliente: number,
): Promise<FacturaResumenRelacion | null> {
  const [row] = await db
    .select({ id: factura.id, folioFiscal: factura.folioFiscal })
    .from(factura)
    .innerJoin(empresas, eq(empresas.id, factura.idEmpresaEmisora))
    .where(and(eq(factura.folioFiscal, folioFiscal), eq(empresas.idCliente, idCliente)))
    .limit(1);
  return row?.folioFiscal ? { id: row.id, folioFiscal: row.folioFiscal } : null;
}

/** El CFDI YA TIMBRADO que sustituye a `folioFiscalOriginal` (si ya se timbró) — para el CTA "cancelar la original" desde ella misma. */
export async function findSustitutoTimbrado(
  folioFiscalOriginal: string,
  idCliente: number,
): Promise<FacturaResumenRelacion | null> {
  const [row] = await db
    .select({ id: factura.id, folioFiscal: factura.folioFiscal })
    .from(factura)
    .innerJoin(empresas, eq(empresas.id, factura.idEmpresaEmisora))
    .where(
      and(
        eq(factura.cfdiRelacionado, folioFiscalOriginal),
        eq(factura.tipoRelacion, "04"),
        eq(factura.tipoFactura, 1),
        eq(empresas.idCliente, idCliente),
      ),
    )
    .limit(1);
  return row?.folioFiscal ? { id: row.id, folioFiscal: row.folioFiscal } : null;
}

/**
 * true si `folioFiscal` es el UUID de un CFDI YA TIMBRADO del cliente — usado
 * para exigir, al cancelar con motivo "01" (sustitución), que el folio de
 * sustitución sea real y no un texto capturado a mano sin verificar contra
 * ningún comprobante existente.
 */
export async function existeFacturaTimbradaConFolioFiscal(folioFiscal: string, idCliente: number): Promise<boolean> {
  const [row] = await db
    .select({ id: factura.id })
    .from(factura)
    .innerJoin(empresas, eq(empresas.id, factura.idEmpresaEmisora))
    .where(and(eq(factura.folioFiscal, folioFiscal), eq(empresas.idCliente, idCliente), eq(factura.tipoFactura, 1)))
    .limit(1);
  return !!row;
}

export async function eliminarBorrador(id: number, idCliente: number): Promise<void> {
  const puede = await esBorradorDelCliente(id, idCliente);
  if (!puede) return;
  await borrarConceptos(id);
  await db.delete(factura).where(eq(factura.id, id));
}

/** XML sellado de un intento de timbrado previo, si lo hay (borrador que aún no llega a `tipoFactura=1`). */
export async function getXmlPrevio(idFactura: number): Promise<string | null> {
  const [row] = await db.select({ xmlResponse: factura.xmlResponse }).from(factura).where(eq(factura.id, idFactura)).limit(1);
  return row?.xmlResponse ?? null;
}

/**
 * Guarda el XML ya sellado ANTES de llamar al PAC (patrón de 3 fases): si la
 * llamada de red falla de forma ambigua (timeout), el reintento reutiliza
 * este mismo XML sellado en vez de reconstruirlo con un folio nuevo.
 */
export async function guardarXmlSellado(idFactura: number, xmlSellado: string): Promise<void> {
  await db.update(factura).set({ xmlResponse: xmlSellado }).where(eq(factura.id, idFactura));
}

export type DatosTimbrado = {
  xmlFinal: string;
  uuid: string;
  fechaTimbrado: string;
  cadenaOriginal: string | null;
  ambiente: "sandbox" | "produccion";
  serie: string | null;
  folio: number;
  emisorNombre: string;
  emisorRfc: string;
  idRegimenEmisor: number;
  receptorNombre: string;
  receptorRfc: string;
  idRegimen: number;
  codigoPostalReceptor: number | null;
  cpExpedicion: number | null;
  importe: number;
};

export async function marcarTimbrada(idFactura: number, d: DatosTimbrado): Promise<void> {
  await db
    .update(factura)
    .set({
      tipoFactura: 1,
      xmlResponse: d.xmlFinal,
      folioFiscal: d.uuid,
      fechaTimbrado: d.fechaTimbrado,
      cadenaOriginal: d.cadenaOriginal,
      ambienteTimbrado: d.ambiente === "produccion" ? "PROD" : "TEST",
      serie: d.serie,
      folio: d.folio,
      emisorNombre: d.emisorNombre,
      emisorRfc: d.emisorRfc,
      idRegimenEmisor: d.idRegimenEmisor,
      nombre: d.receptorNombre,
      rfc: d.receptorRfc,
      idRegimen: d.idRegimen,
      codigoPostal: d.codigoPostalReceptor,
      cpExpedicion: d.cpExpedicion,
      importe: String(d.importe),
      activo: 1,
    })
    .where(eq(factura.id, idFactura));
}

/** XML timbrado (con TFD) para armar la representación impresa (PDF). */
export async function getXmlTimbrado(id: number, idCliente: number): Promise<string | null> {
  const [row] = await db
    .select({ xmlResponse: factura.xmlResponse })
    .from(factura)
    .innerJoin(empresas, eq(empresas.id, factura.idEmpresaEmisora))
    .where(and(eq(factura.id, id), eq(empresas.idCliente, idCliente), eq(factura.tipoFactura, 1)))
    .limit(1);
  return row?.xmlResponse ?? null;
}

/**
 * `estatus` es el crudo de la cancelación: `"cancelada"` la consuma;
 * `"solicitada" | "rechazada" | "plazo_vencido"` la dejan vigente pero con
 * un trámite en curso (ver `EstadoFactura` en `../types`).
 */
export async function marcarCancelacion(
  idFactura: number,
  data: { estatus: string; idMotivoCancelacion: number; fechaCancelacion: string | null; folioSustitucion: string | null; acuse: string | null },
): Promise<void> {
  await db
    .update(factura)
    .set({
      estatusCancelacion: data.estatus,
      idMotivoCancelacion: data.idMotivoCancelacion,
      fechaCancelacion: data.fechaCancelacion,
      folioSustitucion: data.folioSustitucion,
      xmlAcuse: data.acuse,
    })
    .where(eq(factura.id, idFactura));
}

/**
 * Correo ACTUAL del receptor (join en vivo a `contactos_facturacion`, no el
 * snapshot de la factura — el CFDI no imprime el correo, así que no hace
 * falta congelarlo; usar el más reciente es lo correcto para reenviar).
 */
export async function getEmailReceptorActual(idFactura: number, idCliente: number): Promise<string | null> {
  const [row] = await db
    .select({ email: contactosFacturacion.email })
    .from(factura)
    .innerJoin(empresas, eq(empresas.id, factura.idEmpresaEmisora))
    .innerJoin(contactosFacturacion, eq(contactosFacturacion.id, factura.idContactoFacturacion))
    .where(and(eq(factura.id, idFactura), eq(empresas.idCliente, idCliente)))
    .limit(1);
  return row?.email ?? null;
}
