import { and, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { concepto, conceptoImpuestos, documentoRelacionado, empresas, factura, formaPago, pago } from "@/lib/db/schema";
import { ahoraCfdi } from "@/lib/cfdi/fecha";
import {
  CVE_METODO_PPD,
  CVE_USO_CP01,
  TIPO_COMPROBANTE_PAGO,
  type DatosPago,
  type DocumentoAPagar,
  type FacturaPorPagar,
  type PagoAplicado,
  type PagoDetalle,
  type PagoDocumentoDetalle,
  type PagoListItem,
} from "../types";
import { TIPO_COMPROBANTE_INGRESO, toEstado } from "./facturas-repository";

/** Sentinela `N` (-1) del esquema heredado: usado en columnas NOT NULL de la cabecera que no aplican a un comprobante tipo Pago. */
const NA = -1;
/** `cfdi.moneda` — MXN, la única moneda operativa (el propio comprobante de pago siempre declara "XXX" en el XML). */
const CVE_MONEDA_MXN = 1;

/**
 * El complemento (`cfdi.pago` → `cve_factura_complemento`) que liquida un
 * documento cuenta si sigue vivo: no cancelado ante el SAT.
 *
 * El JOIN a la factura-complemento se escribe con SQL literal (no
 * interpolando el objeto `alias()` de Drizzle como destino del JOIN): al
 * interpolar una tabla aliasada directamente en un fragmento `sql` crudo,
 * Drizzle solo emite el identificador del alias, sin el `tabla_real AS
 * alias` que un JOIN necesita — produce "relation ... does not exist".
 * Verificado en runtime (`tsx`) contra la BD real, no solo por tipos.
 */
const complementoVivo = sql`(
    select coalesce(sum(${documentoRelacionado.importePagado}), 0)
      from ${documentoRelacionado}
      inner join ${pago} on ${pago.id} = ${documentoRelacionado.idPago}
      inner join cfdi.factura as factura_complemento_vivo on factura_complemento_vivo.cve_factura = ${pago.idFacturaComplemento}
     where ${documentoRelacionado.idFactura} = ${factura.id}
       and ${documentoRelacionado.activo} = 1
       and coalesce(factura_complemento_vivo.estatus_cancelacion, '') <> 'cancelada'
  )`;
const pagadoPrevioSql = sql<string>`${complementoVivo}`;
const parcialidadesPreviasSql = sql<number>`(
    select count(*)::int
      from ${documentoRelacionado}
      inner join ${pago} on ${pago.id} = ${documentoRelacionado.idPago}
      inner join cfdi.factura as factura_complemento_vivo on factura_complemento_vivo.cve_factura = ${pago.idFacturaComplemento}
     where ${documentoRelacionado.idFactura} = ${factura.id}
       and ${documentoRelacionado.activo} = 1
       and coalesce(factura_complemento_vivo.estatus_cancelacion, '') <> 'cancelada'
  )`;

/**
 * Facturas de ingreso PPD timbradas y vigentes, con saldo pendiente > 0 —
 * candidatas a recibir un pago. El saldo descuenta lo ya pagado por
 * complementos previos VIVOS (borrador o timbrados, no cancelados): un
 * borrador de pago sin timbrar ya reserva su parte, para que dos operadores
 * no paguen el mismo saldo dos veces; si el borrador se descarta
 * (`eliminarBorradorPago`), el saldo vuelve a aparecer aquí.
 */
export async function listFacturasPorPagar(
  idCliente: number,
  idContactoFacturacion?: number,
): Promise<FacturaPorPagar[]> {
  const condiciones = [
    eq(empresas.idCliente, idCliente),
    eq(factura.idTipoComprobante, TIPO_COMPROBANTE_INGRESO),
    eq(factura.tipoFactura, 1),
    eq(factura.idMetodo, CVE_METODO_PPD),
    isNull(factura.estatusCancelacion),
    // Las 33 facturas históricas de "Grupo" (heredadas de factura-facil) usan
    // `cve_empresa` como receptor y dejan `cve_contacto_facturacion` en NULL
    // (ver comentario en `src/lib/db/schema/cfdi.ts`) — no se les puede
    // resolver el receptor con la maquinaria de facturación nueva, así que
    // quedan fuera de "por pagar" en vez de generar un complemento roto.
    isNotNull(factura.idContactoFacturacion),
  ];
  if (idContactoFacturacion) condiciones.push(eq(factura.idContactoFacturacion, idContactoFacturacion));

  const rows = await db
    .select({
      id: factura.id,
      serie: factura.serie,
      folio: factura.folio,
      folioFiscal: factura.folioFiscal,
      emisorNombre: factura.emisorNombre,
      idEmpresaEmisora: factura.idEmpresaEmisora,
      receptorNombre: factura.nombre,
      receptorRfc: factura.rfc,
      idContactoFacturacion: factura.idContactoFacturacion,
      fechaTimbrado: factura.fechaTimbrado,
      total: factura.importe,
      pagado: pagadoPrevioSql,
      parcialidadesPrevias: parcialidadesPreviasSql,
    })
    .from(factura)
    .innerJoin(empresas, eq(empresas.id, factura.idEmpresaEmisora))
    .where(and(...condiciones))
    .orderBy(desc(factura.fechaTimbrado));

  return rows
    .map((r) => {
      const total = Number(r.total ?? 0);
      const pagado = Number(r.pagado ?? 0);
      const saldo = Math.round((total - pagado) * 100) / 100;
      return {
        id: r.id,
        serie: r.serie,
        folio: r.folio,
        folioFiscal: r.folioFiscal ?? "",
        emisorNombre: r.emisorNombre,
        idEmpresaEmisora: r.idEmpresaEmisora as number,
        receptorNombre: r.receptorNombre,
        receptorRfc: r.receptorRfc,
        idContactoFacturacion: r.idContactoFacturacion as number,
        fechaTimbrado: r.fechaTimbrado,
        total,
        pagado,
        saldo,
        siguienteParcialidad: r.parcialidadesPrevias + 1,
      };
    })
    .filter((f) => f.saldo > 0.009);
}

/** Saldo pendiente de UNA factura de ingreso PPD (para la tarjeta de "Saldo pendiente" en su detalle). `null` si no es PPD o no está timbrada. */
export async function getSaldoPendiente(idFactura: number, idCliente: number): Promise<number | null> {
  const [row] = await db
    .select({ total: factura.importe, pagado: pagadoPrevioSql })
    .from(factura)
    .innerJoin(empresas, eq(empresas.id, factura.idEmpresaEmisora))
    .where(
      and(
        eq(factura.id, idFactura),
        eq(empresas.idCliente, idCliente),
        eq(factura.idTipoComprobante, TIPO_COMPROBANTE_INGRESO),
        eq(factura.tipoFactura, 1),
        eq(factura.idMetodo, CVE_METODO_PPD),
        // Igual que en `listFacturasPorPagar`: sin `idContactoFacturacion` (facturas
        // históricas de "Grupo") no se le puede registrar un pago con esta maquinaria.
        isNotNull(factura.idContactoFacturacion),
      ),
    )
    .limit(1);
  if (!row) return null;
  const saldo = Math.round((Number(row.total ?? 0) - Number(row.pagado ?? 0)) * 100) / 100;
  return saldo;
}

interface IngresoParaPago {
  id: number;
  idEmpresaEmisora: number;
  idContactoFacturacion: number;
  serie: string | null;
  folio: number | null;
  folioFiscal: string | null;
  idMoneda: number;
  idMetodo: number;
  emisorNombre: string | null;
  emisorRfc: string | null;
  cpExpedicion: number | null;
  idRegimenEmisor: number | null;
  receptorNombre: string | null;
  receptorRfc: string | null;
  codigoPostal: number | null;
  idRegimen: number | null;
  email: string | null;
  total: number;
  pagadoPrevio: number;
  parcialidadesPrevias: number;
}

/** Registra un pago: crea el borrador del complemento (CFDI tipo P) que liquida, total o parcialmente, uno o más ingresos PPD. Falla sin dejar nada a medias si no comparten emisora/receptor o algún importe excede el saldo. */
export async function crearBorradorPago(
  idUsuario: number,
  idCliente: number,
  documentos: DocumentoAPagar[],
  datosPago: DatosPago,
): Promise<{ id: number } | { error: string }> {
  if (documentos.length === 0) return { error: "Selecciona al menos una factura para registrar el pago." };
  const { fecha, hora } = ahoraCfdi();

  return db.transaction(async (tx) => {
    const ids = documentos.map((d) => d.idFactura);
    const ingresos = await tx
      .select({
        id: factura.id,
        idEmpresaEmisora: factura.idEmpresaEmisora,
        idContactoFacturacion: factura.idContactoFacturacion,
        serie: factura.serie,
        folio: factura.folio,
        folioFiscal: factura.folioFiscal,
        idMoneda: factura.idMoneda,
        idMetodo: factura.idMetodo,
        emisorNombre: factura.emisorNombre,
        emisorRfc: factura.emisorRfc,
        cpExpedicion: factura.cpExpedicion,
        idRegimenEmisor: factura.idRegimenEmisor,
        receptorNombre: factura.nombre,
        receptorRfc: factura.rfc,
        codigoPostal: factura.codigoPostal,
        idRegimen: factura.idRegimen,
        email: factura.email,
        total: factura.importe,
        pagadoPrevio: pagadoPrevioSql,
        parcialidadesPrevias: parcialidadesPreviasSql,
      })
      .from(factura)
      .innerJoin(empresas, eq(empresas.id, factura.idEmpresaEmisora))
      .where(
        and(
          inArray(factura.id, ids),
          eq(empresas.idCliente, idCliente),
          eq(factura.idTipoComprobante, TIPO_COMPROBANTE_INGRESO),
          eq(factura.tipoFactura, 1),
          isNull(factura.estatusCancelacion),
          isNotNull(factura.idContactoFacturacion),
        ),
      )
      .for("update");

    if (ingresos.length !== documentos.length) {
      return { error: "Alguna de las facturas seleccionadas ya no existe, no está timbrada, o fue cancelada." };
    }
    const lista: IngresoParaPago[] = ingresos.map((i) => ({
      ...i,
      idEmpresaEmisora: i.idEmpresaEmisora as number,
      idContactoFacturacion: i.idContactoFacturacion as number,
      idMoneda: i.idMoneda,
      idMetodo: i.idMetodo,
      total: Number(i.total ?? 0),
      pagadoPrevio: Number(i.pagadoPrevio ?? 0),
    }));

    const emisora = lista[0].idEmpresaEmisora;
    const receptor = lista[0].idContactoFacturacion;
    if (lista.some((i) => i.idEmpresaEmisora !== emisora || i.idContactoFacturacion !== receptor)) {
      return { error: "Todas las facturas de un mismo pago deben ser de la misma empresa emisora y el mismo cliente." };
    }

    for (const doc of documentos) {
      const ingreso = lista.find((i) => i.id === doc.idFactura)!;
      const saldo = Math.round((ingreso.total - ingreso.pagadoPrevio) * 100) / 100;
      if (doc.importePagado <= 0) return { error: "El importe pagado de cada factura debe ser mayor a cero." };
      if (doc.importePagado > saldo + 0.009) {
        return {
          error: `El importe pagado de la factura ${ingreso.serie ?? ""}${ingreso.folio ?? ""} excede su saldo (${saldo}).`,
        };
      }
    }

    const cabecera = lista[0];
    const montoTotal = documentos.reduce((t, d) => t + d.importePagado, 0);

    const [{ id: idFacturaPago }] = await tx
      .insert(factura)
      .values({
        idContactoFacturacion: cabecera.idContactoFacturacion,
        idEmpresaEmisora: cabecera.idEmpresaEmisora,
        idUso: CVE_USO_CP01,
        idFormaPago: NA,
        idMetodo: NA,
        idCondicion: NA,
        idMoneda: CVE_MONEDA_MXN,
        idUsuario: idUsuario,
        idTipoComprobante: TIPO_COMPROBANTE_PAGO,
        idRegimen: cabecera.idRegimen,
        idRegimenEmisor: cabecera.idRegimenEmisor,
        emisorNombre: cabecera.emisorNombre,
        emisorRfc: cabecera.emisorRfc,
        nombre: cabecera.receptorNombre,
        rfc: cabecera.receptorRfc,
        email: cabecera.email,
        codigoPostal: cabecera.codigoPostal,
        cpExpedicion: cabecera.cpExpedicion,
        fecha,
        hora,
        tipoFactura: 0,
        activo: 1,
        publicoGeneral: 1,
      })
      .returning({ id: factura.id });

    const fechaPagoNumerica = Number(datosPago.fechaPago.replaceAll("-", "")) || fecha;
    const HORA_MEDIODIA = 120000;
    const [{ id: idPago }] = await tx
      .insert(pago)
      .values({
        idFacturaComplemento: idFacturaPago,
        idFormaPago: datosPago.idFormaPago,
        idMoneda: CVE_MONEDA_MXN,
        fechaPago: fechaPagoNumerica,
        horaPago: HORA_MEDIODIA,
        montoPagado: String(montoTotal),
        numeroOperacion: datosPago.numeroOperacion.trim(),
        cuentaOrdenante: datosPago.cuentaOrdenante?.trim() || null,
        cuentaBeneficiario: datosPago.cuentaBeneficiario?.trim() || null,
        activo: 1,
      })
      .returning({ id: pago.id });

    for (const doc of documentos) {
      const ingreso = lista.find((i) => i.id === doc.idFactura)!;
      const saldoAnterior = Math.round((ingreso.total - ingreso.pagadoPrevio) * 100) / 100;
      const insoluto = Math.round((saldoAnterior - doc.importePagado) * 100) / 100;
      const parcialidad = ingreso.parcialidadesPrevias + 1;
      await tx.insert(documentoRelacionado).values({
        idPago,
        idFactura: ingreso.id,
        idMoneda: ingreso.idMoneda,
        idMetodo: ingreso.idMetodo,
        serieDocumento: ingreso.serie ?? "",
        folioDocumento: ingreso.folio ?? 0,
        parcialidadDocumento: String(parcialidad),
        importeSaldo: String(saldoAnterior),
        importePagado: String(doc.importePagado),
        importeInsoluto: String(insoluto),
        fecha,
        hora,
        folioFiscal: ingreso.folioFiscal,
        activo: 1,
      });
    }

    return { id: idFacturaPago };
  });
}

/** true si el borrador del complemento pertenece al cliente y sigue sin timbrar. */
async function esBorradorPagoDelCliente(id: number, idCliente: number): Promise<boolean> {
  const [row] = await db
    .select({ id: factura.id })
    .from(factura)
    .innerJoin(empresas, eq(empresas.id, factura.idEmpresaEmisora))
    .where(
      and(
        eq(factura.id, id),
        eq(empresas.idCliente, idCliente),
        eq(factura.idTipoComprobante, TIPO_COMPROBANTE_PAGO),
        eq(factura.tipoFactura, 0),
      ),
    )
    .limit(1);
  return !!row;
}

/** Elimina (hard delete, igual que `eliminarBorrador` de facturas) el borrador de un complemento y sus hijos. Al desaparecer, el saldo de sus ingresos vuelve a "por pagar". No se puede eliminar uno ya timbrado: eso solo se deshace cancelándolo ante el SAT. */
export async function eliminarBorradorPago(id: number, idCliente: number): Promise<void> {
  const puede = await esBorradorPagoDelCliente(id, idCliente);
  if (!puede) return;
  await db.transaction(async (tx) => {
    const pagos = await tx.select({ id: pago.id }).from(pago).where(eq(pago.idFacturaComplemento, id));
    for (const p of pagos) {
      await tx.delete(documentoRelacionado).where(eq(documentoRelacionado.idPago, p.id));
    }
    await tx.delete(pago).where(eq(pago.idFacturaComplemento, id));
    await tx.delete(factura).where(eq(factura.id, id));
  });
}

const listSelectPago = {
  id: factura.id,
  tipoFactura: factura.tipoFactura,
  estatusCancelacion: factura.estatusCancelacion,
  serie: factura.serie,
  folio: factura.folio,
  folioFiscal: factura.folioFiscal,
  fechaTimbrado: factura.fechaTimbrado,
  emisorNombre: factura.emisorNombre,
  emisorRfc: factura.emisorRfc,
  receptorNombre: factura.nombre,
  receptorRfc: factura.rfc,
  idEmpresaEmisora: factura.idEmpresaEmisora,
  idContactoFacturacion: factura.idContactoFacturacion,
};

/** Complementos de pago (CFDI tipo P) de un cliente, borradores y timbrados. */
export async function listPagos(idCliente: number): Promise<PagoListItem[]> {
  const rows = await db
    .select({
      ...listSelectPago,
      fechaPago: pago.fechaPago,
      monto: pago.montoPagado,
      documentos: sql<number>`(select count(*)::int from ${documentoRelacionado} where ${documentoRelacionado.idPago} = ${pago.id} and ${documentoRelacionado.activo} = 1)`,
    })
    .from(factura)
    .innerJoin(empresas, eq(empresas.id, factura.idEmpresaEmisora))
    .innerJoin(pago, eq(pago.idFacturaComplemento, factura.id))
    .where(and(eq(empresas.idCliente, idCliente), eq(factura.idTipoComprobante, TIPO_COMPROBANTE_PAGO)))
    .orderBy(desc(factura.id));

  return rows.map((r) => ({
    id: r.id,
    estado: toEstado(r.tipoFactura, r.estatusCancelacion),
    estatusCancelacion: r.estatusCancelacion,
    serie: r.serie,
    folio: r.folio,
    folioFiscal: r.folioFiscal,
    emisorNombre: r.emisorNombre,
    emisorRfc: r.emisorRfc,
    receptorNombre: r.receptorNombre,
    receptorRfc: r.receptorRfc,
    fechaPago: fechaEnteraATexto(r.fechaPago),
    monto: r.monto,
    documentos: r.documentos,
    fechaTimbrado: r.fechaTimbrado,
  }));
}

export async function getPagoDetalle(id: number, idCliente: number): Promise<PagoDetalle | null> {
  const [row] = await db
    .select({
      ...listSelectPago,
      idFormaPago: pago.idFormaPago,
      numeroOperacion: pago.numeroOperacion,
      fechaPago: pago.fechaPago,
      monto: pago.montoPagado,
    })
    .from(factura)
    .innerJoin(empresas, eq(empresas.id, factura.idEmpresaEmisora))
    .innerJoin(pago, eq(pago.idFacturaComplemento, factura.id))
    .where(
      and(eq(factura.id, id), eq(empresas.idCliente, idCliente), eq(factura.idTipoComprobante, TIPO_COMPROBANTE_PAGO)),
    )
    .limit(1);
  if (!row || !row.idEmpresaEmisora || !row.idContactoFacturacion) return null;

  const documentosRows = await db
    .select({
      folioFiscal: documentoRelacionado.folioFiscal,
      serieDocumento: documentoRelacionado.serieDocumento,
      folioDocumento: documentoRelacionado.folioDocumento,
      parcialidad: documentoRelacionado.parcialidadDocumento,
      importeSaldo: documentoRelacionado.importeSaldo,
      importePagado: documentoRelacionado.importePagado,
      importeInsoluto: documentoRelacionado.importeInsoluto,
    })
    .from(documentoRelacionado)
    .innerJoin(pago, eq(pago.id, documentoRelacionado.idPago))
    .where(and(eq(pago.idFacturaComplemento, id), eq(documentoRelacionado.activo, 1)));

  const documentosDetalle: PagoDocumentoDetalle[] = documentosRows.map((d) => ({
    folioFiscal: d.folioFiscal,
    serieFolio: `${d.serieDocumento ?? ""}${d.folioDocumento ?? ""}`,
    parcialidad: d.parcialidad,
    impSaldoAnt: Number(d.importeSaldo),
    impPagado: Number(d.importePagado),
    impSaldoInsoluto: Number(d.importeInsoluto),
  }));

  return {
    id: row.id,
    estado: toEstado(row.tipoFactura, row.estatusCancelacion),
    estatusCancelacion: row.estatusCancelacion,
    serie: row.serie,
    folio: row.folio,
    folioFiscal: row.folioFiscal,
    emisorNombre: row.emisorNombre,
    emisorRfc: row.emisorRfc,
    receptorNombre: row.receptorNombre,
    receptorRfc: row.receptorRfc,
    fechaPago: fechaEnteraATexto(row.fechaPago),
    monto: row.monto,
    documentos: documentosDetalle.length,
    fechaTimbrado: row.fechaTimbrado,
    idEmpresaEmisora: row.idEmpresaEmisora,
    idContactoFacturacion: row.idContactoFacturacion,
    idFormaPago: row.idFormaPago,
    numeroOperacion: row.numeroOperacion,
    documentosDetalle,
  };
}

/** Pagos (timbrados) ya aplicados a una factura de ingreso — historial que se muestra en su detalle. */
export async function listPagosDeFactura(idFactura: number, idCliente: number): Promise<PagoAplicado[]> {
  const rows = await db
    .select({
      idPago: factura.id,
      folioFiscal: factura.folioFiscal,
      fechaPago: pago.fechaPago,
      impPagado: documentoRelacionado.importePagado,
    })
    .from(documentoRelacionado)
    .innerJoin(pago, eq(pago.id, documentoRelacionado.idPago))
    .innerJoin(factura, eq(factura.id, pago.idFacturaComplemento))
    .innerJoin(empresas, eq(empresas.id, factura.idEmpresaEmisora))
    .where(
      and(
        eq(documentoRelacionado.idFactura, idFactura),
        eq(documentoRelacionado.activo, 1),
        eq(empresas.idCliente, idCliente),
        eq(factura.tipoFactura, 1),
      ),
    )
    .orderBy(desc(factura.id));

  return rows.map((r) => ({
    idPago: r.idPago,
    folioFiscal: r.folioFiscal,
    fechaPago: fechaEnteraATexto(r.fechaPago),
    impPagado: Number(r.impPagado),
  }));
}

/** Cabecera + documentos, ya resueltos, para armar el XML del pago al timbrar. */
export async function getDatosParaTimbrarPago(idFactura: number, idCliente: number) {
  const [cab] = await db
    .select({
      idEmpresaEmisora: factura.idEmpresaEmisora,
      idContactoFacturacion: factura.idContactoFacturacion,
      tipoFactura: factura.tipoFactura,
      serie: factura.serie,
      idFormaPago: pago.idFormaPago,
      formaPagoClave: formaPago.clave,
      fechaPago: pago.fechaPago,
      horaPago: pago.horaPago,
      monto: pago.montoPagado,
      numeroOperacion: pago.numeroOperacion,
    })
    .from(factura)
    .innerJoin(empresas, eq(empresas.id, factura.idEmpresaEmisora))
    .innerJoin(pago, eq(pago.idFacturaComplemento, factura.id))
    .leftJoin(formaPago, eq(formaPago.id, pago.idFormaPago))
    .where(
      and(
        eq(factura.id, idFactura),
        eq(empresas.idCliente, idCliente),
        eq(factura.idTipoComprobante, TIPO_COMPROBANTE_PAGO),
      ),
    )
    .limit(1);
  if (!cab || !cab.idEmpresaEmisora || !cab.idContactoFacturacion) return null;

  const documentos = await db
    .select({
      folioFiscal: documentoRelacionado.folioFiscal,
      serie: documentoRelacionado.serieDocumento,
      folio: documentoRelacionado.folioDocumento,
      parcialidad: documentoRelacionado.parcialidadDocumento,
      importeSaldo: documentoRelacionado.importeSaldo,
      importePagado: documentoRelacionado.importePagado,
      importeInsoluto: documentoRelacionado.importeInsoluto,
      idFacturaIngreso: documentoRelacionado.idFactura,
    })
    .from(documentoRelacionado)
    .innerJoin(pago, eq(pago.id, documentoRelacionado.idPago))
    .where(and(eq(pago.idFacturaComplemento, idFactura), eq(documentoRelacionado.activo, 1)));

  // Base gravada e IVA REALES de cada ingreso (suma de sus conceptos/impuestos,
  // no una suposición de "todo al 16%": un ingreso puede mezclar conceptos
  // exentos y gravados). El total viene de `factura.importe` (ya timbrado).
  const idsIngresos = documentos.map((d) => d.idFacturaIngreso);
  const totales =
    idsIngresos.length === 0
      ? []
      : await db
          .select({ id: factura.id, total: factura.importe })
          .from(factura)
          .where(inArray(factura.id, idsIngresos));
  const impuestosPorFactura =
    idsIngresos.length === 0
      ? []
      : await db
          .select({
            idFactura: concepto.idFactura,
            gravado: sql<string>`coalesce(sum(${concepto.importe}) filter (where ${conceptoImpuestos.idImpuesto} is not null), 0)`,
            iva: sql<string>`coalesce(sum(${conceptoImpuestos.importeImpuesto}), 0)`,
          })
          .from(concepto)
          .leftJoin(conceptoImpuestos, and(eq(conceptoImpuestos.idConcepto, concepto.id), eq(conceptoImpuestos.activo, 1)))
          .where(and(inArray(concepto.idFactura, idsIngresos), eq(concepto.activo, 1)))
          .groupBy(concepto.idFactura);

  const documentosConImpuesto = documentos.map((d) => {
    const total = Number(totales.find((t) => t.id === d.idFacturaIngreso)?.total ?? 0);
    const impuestos = impuestosPorFactura.find((i) => i.idFactura === d.idFacturaIngreso);
    const gravado = Number(impuestos?.gravado ?? 0);
    const iva = Number(impuestos?.iva ?? 0);
    const fraccion = total > 0 ? Number(d.importePagado) / total : 0;
    return {
      idDocumento: d.folioFiscal ?? "",
      serie: d.serie,
      folio: String(d.folio ?? ""),
      numParcialidad: Number(d.parcialidad ?? "1"),
      impSaldoAnt: Number(d.importeSaldo),
      impPagado: Number(d.importePagado),
      impSaldoInsoluto: Number(d.importeInsoluto),
      base: Number((gravado * fraccion).toFixed(2)),
      importe: Number((iva * fraccion).toFixed(2)),
    };
  });

  return {
    idEmpresaEmisora: cab.idEmpresaEmisora,
    idContactoFacturacion: cab.idContactoFacturacion,
    esBorrador: cab.tipoFactura === 0,
    serie: cab.serie,
    idFormaPago: cab.idFormaPago,
    formaPagoClave: cab.formaPagoClave,
    fechaPago: cab.fechaPago,
    horaPago: cab.horaPago,
    monto: Number(cab.monto),
    numeroOperacion: cab.numeroOperacion,
    documentos: documentosConImpuesto,
  };
}

function fechaEnteraATexto(valor: number | null): string | null {
  if (!valor) return null;
  const s = String(valor);
  return s.length === 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : s;
}
