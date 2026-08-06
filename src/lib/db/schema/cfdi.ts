import { sql } from "drizzle-orm";
import { integer, numeric, pgSchema, smallint, text, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Mapeo Drizzle del schema `cfdi` (heredado de factura-facil). Los catálogos
 * SAT (regímenes, usos, formas/métodos de pago, monedas, claves de producto/
 * servicio y de unidad) ya vienen sembrados en la BD — aquí solo se mapean
 * para lectura, nunca se insertan filas nuevas en ellos desde Nuvio.
 */
export const cfdi = pgSchema("cfdi");

export const factura = cfdi.table("factura", {
  id: integer("cve_factura")
    .primaryKey()
    .default(sql`nextval('cfdi.sq_cfdi_factura')`),
  /**
   * OJO: pese al nombre de columna y de la FK (`fk_factura_empresadestino`),
   * `cveEmpresa` es el RECEPTOR de la factura (a quién se factura), no el
   * emisor — verificado contra las 33 facturas reales de "Grupo". Solo lo
   * usan las facturas HISTÓRICAS (referencia `corporativo.empresas`, modelo
   * legado); las facturas NUEVAS dejan esta columna en NULL y usan
   * `idContactoFacturacion` en su lugar (migración `0010`).
   */
  cveEmpresa: integer("cve_empresa"),
  /** Receptor de facturas NUEVAS (a partir de la migración `0010`). */
  idContactoFacturacion: integer("cve_contacto_facturacion"),
  /** El EMISOR real de la factura (empresa propia con CSD, `empresas.tipo = 1`). */
  idEmpresaEmisora: integer("cve_empresa_proveedora"),
  idUso: integer("cve_uso").notNull(),
  idMetodo: integer("cve_metodo").notNull(),
  idMoneda: integer("cve_moneda").notNull(),
  idUsuario: integer("cve_usuario").notNull(),
  idTipoComprobante: integer("cve_tipo_comprobante").notNull(),
  idRegimen: integer("cve_regimen"),
  /** Régimen fiscal del EMISOR al momento de timbrar (foto, no referencia). */
  idRegimenEmisor: integer("cve_regimen_emisor"),
  idFormaPago: integer("cve_forma_pago").notNull(),
  idCondicion: integer("cve_condicion").notNull(),
  idMotivoCancelacion: integer("cve_motivo_cancelacion"),
  /** Foto del emisor al timbrar — nunca cambia aunque la razón social cambie después. */
  emisorNombre: varchar("emisor_nombre", { length: 100 }),
  emisorRfc: varchar("emisor_rfc", { length: 50 }),
  nombre: varchar("nombre", { length: 200 }),
  rfc: varchar("rfc", { length: 15 }),
  email: varchar("email", { length: 100 }),
  domicilio: varchar("domicilio", { length: 200 }),
  codigoPostal: integer("codigo_postal"),
  cpExpedicion: integer("cp_expedicion"),
  observacion: varchar("observacion", { length: 500 }),
  serie: varchar("serie", { length: 5 }),
  folio: integer("folio"),
  fecha: integer("fecha"),
  hora: integer("hora"),
  importe: numeric("importe", { precision: 18, scale: 4 }),
  iva: numeric("iva", { precision: 6, scale: 4 }),
  retencionIsr: numeric("retencion_isr", { precision: 6, scale: 4 }),
  retencionIva: numeric("retencion_iva", { precision: 6, scale: 4 }),
  publicoGeneral: integer("publico_general").default(1),
  /** 0 = borrador (prefactura, sin valor fiscal); 1 = timbrada. */
  tipoFactura: integer("tipo_factura"),
  activo: integer("activo"),
  xmlResponse: text("xml_response"),
  xmlAcuse: text("xml_acuse"),
  folioFiscal: varchar("folio_fiscal", { length: 50 }),
  fechaTimbrado: varchar("fecha_timbrado", { length: 50 }),
  cadenaOriginal: varchar("cadena_original", { length: 2000 }),
  ambienteTimbrado: varchar("ambiente_timbrado", { length: 4 }),
  cfdiRelacionado: varchar("cfdi_relacionado", { length: 50 }),
  tipoRelacion: varchar("tipo_relacion", { length: 5 }),
  estatusCancelacion: varchar("estatus_cancelacion", { length: 20 }),
  fechaCancelacion: varchar("fecha_cancelacion", { length: 40 }),
  folioSustitucion: varchar("folio_sustitucion", { length: 40 }),
  version: integer("version").default(1),
});

export const concepto = cfdi.table("concepto", {
  id: integer("cve_concepto")
    .primaryKey()
    .default(sql`nextval('cfdi.sq_cfdi_concepto')`),
  idFactura: integer("cve_factura").notNull(),
  /** Clave de producto/servicio SAT (catálogo `servicio`, no un servicio propio). */
  idServicio: integer("cve_servicio").notNull(),
  /** Clave de unidad SAT (catálogo `unidad`). */
  idUnidad: integer("cve_unidad").notNull(),
  identificacion: varchar("identificacion_concepto", { length: 20 }),
  cantidad: integer("cantidad_concepto").notNull(),
  unidadMedida: varchar("unidad_medida_concepto", { length: 100 }),
  descripcion: varchar("descripcion_concepto", { length: 1500 }),
  precio: numeric("precio_concepto", { precision: 18, scale: 4 }).notNull(),
  importe: numeric("importe_concepto", { precision: 18, scale: 4 }).notNull(),
  descuento: numeric("descuento_concepto", { precision: 18, scale: 4 }),
  orden: integer("orden_concepto").default(1),
  activo: integer("activo").notNull().default(1),
});

export const conceptoImpuestos = cfdi.table("concepto_impuestos", {
  id: integer("cve_concepto_impuesto")
    .primaryKey()
    .default(sql`nextval('cfdi.sq_cfdi_concepto_impuestos')`),
  idConcepto: integer("cve_concepto").notNull(),
  /** 1 = tasa, 2 = cuota, 3 = exento (ver `factor`). */
  idFactor: integer("cve_factor").notNull(),
  /** 1 = ISR, 2 = IVA, 3 = IEPS (ver `impuesto`). */
  idImpuesto: integer("cve_impuesto").notNull(),
  /** 0 = traslado, 1 = retención. */
  tipoImpuesto: integer("tipo_impuesto").default(0),
  importeBase: numeric("importe_base", { precision: 18, scale: 4 }),
  tasaCuota: numeric("tasa_cuota_impuesto", { precision: 18, scale: 6 }),
  importeImpuesto: numeric("importe_impuesto", { precision: 18, scale: 4 }),
  activo: integer("activo").notNull().default(1),
});

/**
 * Cabecera de un complemento de pago (CFDI 4.0 tipo "P"): igual que un CSD de
 * ingreso, el comprobante en sí es una fila de `factura` con
 * `idTipoComprobante = 5` — esta tabla solo guarda lo propio del pago (nodo
 * `pago20:Pago`). Heredada de factura-facil, sin usar hasta ahora.
 */
export const pago = cfdi.table("pago", {
  id: integer("cve_pago")
    .primaryKey()
    .default(sql`nextval('cfdi.sq_cfdi_pago')`),
  /** La fila de `factura` (tipo P) que es este comprobante de pago. */
  idFacturaComplemento: integer("cve_factura_complemento").notNull(),
  idFormaPago: integer("cve_forma_pago").notNull(),
  idMoneda: integer("cve_moneda").notNull(),
  fechaPago: integer("fecha_pago").notNull(),
  horaPago: integer("hora_pago").notNull(),
  montoPagado: numeric("monto_pagado", { precision: 18, scale: 4 }).notNull(),
  numeroOperacion: varchar("numero_operacion", { length: 50 }).notNull(),
  cuentaOrdenante: varchar("cuenta_ordenante", { length: 50 }),
  cuentaBeneficiario: varchar("cuenta_beneficiario", { length: 50 }),
  activo: integer("activo").default(1),
});

/**
 * Un documento (factura de ingreso PPD) que un pago liquida, total o
 * parcialmente (nodo `pago20:DoctoRelacionado`). `idFactura` apunta al CFDI
 * de ingreso pagado; `idPago` al complemento que lo paga.
 */
export const documentoRelacionado = cfdi.table("documento_relacionado", {
  id: integer("cve_documento_relacionado")
    .primaryKey()
    .default(sql`nextval('cfdi.sq_cfdi_documento_relacionado')`),
  idPago: integer("cve_pago").notNull(),
  /** El CFDI de ingreso (PPD) que se está pagando. */
  idFactura: integer("cve_factura").notNull(),
  idMoneda: integer("cve_moneda").notNull(),
  idMetodo: integer("cve_metodo").notNull(),
  serieDocumento: varchar("serie_documento", { length: 5 }).notNull(),
  folioDocumento: integer("folio_documento").notNull(),
  parcialidadDocumento: varchar("parcialidad_documento", { length: 10 }),
  importeSaldo: numeric("importe_saldo", { precision: 18, scale: 4 }).notNull(),
  importePagado: numeric("importe_pagado", { precision: 18, scale: 4 }).notNull(),
  importeInsoluto: numeric("importe_insoluto", { precision: 18, scale: 4 }).notNull(),
  fecha: integer("fecha"),
  hora: integer("hora"),
  activo: integer("activo").notNull().default(1),
  /** Folio fiscal (UUID) del CFDI de ingreso pagado — snapshot, no join. */
  folioFiscal: varchar("folio_fiscal", { length: 50 }),
  importeGravado: numeric("importe_gravado", { precision: 18, scale: 4 }),
  importeExentado: numeric("importe_exentado", { precision: 18, scale: 4 }),
});

// ---- Catálogos SAT (solo lectura, ya sembrados) ----

export const regimenFiscal = cfdi.table("regimen_fiscal", {
  id: integer("cve_regimen").primaryKey(),
  clave: varchar("nombre_regimen", { length: 3 }).notNull(),
  descripcion: varchar("descripcion_regimen", { length: 100 }),
  aplicaPersonaMoral: integer("aplica_persona_moral"),
  aplicaPersonaFisica: integer("aplica_persona_fisica"),
  activo: integer("activo").notNull().default(1),
});

export const uso = cfdi.table("uso", {
  id: integer("cve_uso").primaryKey(),
  clave: varchar("nombre_uso", { length: 4 }).notNull(),
  descripcion: varchar("descripcion_uso", { length: 100 }),
  aplicaPersonaMoral: integer("aplica_persona_moral"),
  aplicaPersonaFisica: integer("aplica_persona_fisica"),
  regimenes: varchar("regimenes", { length: 100 }),
  activo: integer("activo").notNull().default(1),
});

export const formaPago = cfdi.table("forma_pago", {
  id: integer("cve_forma_pago").primaryKey(),
  clave: varchar("nombre_forma_pago", { length: 3 }).notNull(),
  descripcion: varchar("descripcion_forma_pago", { length: 50 }),
  activo: integer("activo").default(1),
});

export const metodoPago = cfdi.table("metodo_pago", {
  id: integer("cve_metodo").primaryKey(),
  clave: varchar("nombre_metodo", { length: 3 }).notNull(),
  descripcion: varchar("descripcion_metodo", { length: 50 }),
  idCondicion: integer("cve_condicion").notNull(),
  activo: integer("activo").notNull().default(1),
});

export const condicion = cfdi.table("condicion", {
  id: integer("cve_condicion").primaryKey(),
  nombre: varchar("nombre_condicion", { length: 50 }).notNull(),
  descripcion: varchar("descripcion_condicion", { length: 100 }),
  activo: integer("activo").notNull().default(1),
});

export const moneda = cfdi.table("moneda", {
  id: integer("cve_moneda").primaryKey(),
  clave: varchar("nombre_moneda", { length: 3 }).notNull(),
  descripcion: varchar("descripcion_moneda", { length: 50 }),
  activo: integer("activo").notNull().default(1),
});

export const tipoComprobante = cfdi.table("tipo_comprobante", {
  id: integer("cve_tipo_comprobante").primaryKey(),
  clave: varchar("nombre_comprobante", { length: 1 }).notNull(),
  descripcion: varchar("descripcion_comprobante", { length: 50 }),
  nombreComun: varchar("nombre_comun_comprobante", { length: 20 }),
  activo: integer("activo").notNull().default(1),
});

export const motivoCancelacion = cfdi.table("motivo_cancelacion", {
  id: integer("cve_motivo_cancelacion").primaryKey(),
  clave: varchar("nombre_motivo", { length: 2 }).notNull(),
  descripcion: varchar("descripcion_motivo", { length: 70 }),
  activo: integer("activo").notNull().default(1),
});

/** Catálogo SAT `c_ClaveProdServ` (52,514 filas) — clave de producto/servicio. */
export const servicio = cfdi.table("servicio", {
  id: integer("cve_servicio").primaryKey(),
  clave: varchar("nombre_servicio", { length: 8 }).notNull(),
  descripcion: varchar("descripcion_servicio", { length: 200 }),
  activo: integer("activo").notNull().default(1),
});

/** Catálogo SAT `c_ClaveUnidad` (2,419 filas). */
export const unidad = cfdi.table("unidad", {
  id: integer("cve_unidad").primaryKey(),
  clave: varchar("nombre_unidad", { length: 3 }).notNull(),
  descripcion: varchar("descripcion_unidad", { length: 200 }),
  activo: integer("activo").notNull().default(1),
});

export const impuesto = cfdi.table("impuesto", {
  id: integer("cve_impuesto").primaryKey(),
  clave: varchar("nombre_impuesto", { length: 3 }).notNull(),
  descripcion: varchar("descripcion_impuesto", { length: 100 }),
  aplicaRetencion: smallint("aplica_retencion"),
  aplicaTraslado: smallint("aplica_traslado"),
  activo: integer("activo").notNull().default(1),
});

export const factor = cfdi.table("factor", {
  id: integer("cve_factor").primaryKey(),
  nombre: varchar("nombre_factor", { length: 20 }).notNull(),
  activo: integer("activo").notNull().default(1),
});
