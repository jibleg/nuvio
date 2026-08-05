import { sql } from "drizzle-orm";
import { customType, integer, pgSchema, smallint, timestamp, varchar } from "drizzle-orm/pg-core";

/** Columna `bytea` cruda (certificados/llaves CSD, secretos cifrados). */
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

/**
 * Mapeo Drizzle del schema `corporativo`. Por ahora solo se mapean `clientes` y
 * `empresas` con las columnas relevantes para autenticación y multitenancy; el
 * resto de columnas fiscales/CFDI se añaden cuando un módulo las necesite.
 */
export const corporativo = pgSchema("corporativo");

/** Cliente = tenant raíz (organización que adquiere Nuvio). Se resuelve por subdominio (`slug`). */
export const clientes = corporativo.table("clientes", {
  id: integer("cve_cliente")
    .primaryKey()
    .default(sql`nextval('corporativo.sq_corp_clientes')`),
  slug: varchar("slug", { length: 63 }).notNull(),
  nombre: varchar("nombre", { length: 150 }).notNull(),
  activo: smallint("activo").notNull().default(1),
  /** Plan comercial contratado: limita empresas y módulos de negocio (ver src/config/plans.ts). */
  plan: varchar("plan", { length: 20 }).notNull().default("empresarial"),
  fechaAlta: timestamp("fecha_alta", { withTimezone: true }).notNull().defaultNow(),
  /** Gate de seguridad: nace en 'sandbox', solo Nuvio (superadmin) lo pasa a 'produccion'. */
  ambienteTimbrado: varchar("ambiente_timbrado", { length: 10 }).notNull().default("sandbox"),
});

export const empresas = corporativo.table("empresas", {
  id: integer("cve_empresa").primaryKey(),
  idCliente: integer("cve_cliente").notNull(),
  /** NULL = esta fila es la matriz; con valor = es sucursal de esa matriz. */
  idEmpresaMatriz: integer("cve_empresa_matriz"),
  nombreComercial: varchar("nombre_comercial").notNull(),
  descripcion: varchar("descripcion").notNull(),
  nombreCorto: varchar("nombre_corto"),
  razonSocial: varchar("razon_social"),
  rfc: varchar("rfc"),
  calle: varchar("calle"),
  colonia: varchar("colonia"),
  ciudad: varchar("ciudad"),
  codigoPostal: integer("codigo_postal"),
  telefono: varchar("telefono"),
  email: varchar("email"),
  activo: integer("activo"),
  idRegimen: integer("cve_regimen"),
  /** 1 = empresa propia (matriz/sucursal); 2 = contacto de facturación (legado, ver `contactosFacturacion`). */
  tipo: integer("tipo"),
  /** Certificado de sello digital (CSD) para timbrar CFDI a nombre de esta empresa. */
  signCer: bytea("sign_cer"),
  signKey: bytea("sign_key"),
  /** Contraseña de `signKey` cifrada (AES-256-GCM, ver `@/lib/crypto/secrets`). */
  signPasswordEnc: bytea("sign_password_enc"),
  signNumeroCertificado: varchar("sign_numero_certificado", { length: 30 }),
  signValidoDesde: timestamp("sign_valido_desde", { withTimezone: true }),
  signValidoHasta: timestamp("sign_valido_hasta", { withTimezone: true }),
  /** Serie del CFDI (opcional, prefijo de folio a nivel de empresa). */
  serie: varchar("serie", { length: 5 }),
});

/** Folio consecutivo por empresa (contador transaccional, ver `empresa-folios-repository.ts`). */
export const empresaFolios = corporativo.table("empresa_folios", {
  idEmpresa: integer("cve_empresa").primaryKey(),
  siguienteFolio: integer("siguiente_folio").notNull().default(1),
});

/**
 * Clientes y proveedores de facturación (a quién facturas / quién te
 * factura) — distinto de `empresas` (tu propia matriz/sucursales). En
 * factura-facil ambos conceptos vivían mezclados en una sola tabla
 * (`empresas.tipo` 1/2); aquí quedan separados para que "Sucursales" no se
 * enrede con tu directorio de contactos de facturación.
 */
export const contactosFacturacion = corporativo.table("contactos_facturacion", {
  id: integer("cve_contacto_facturacion")
    .primaryKey()
    .default(sql`nextval('corporativo.sq_corp_contactos_facturacion')`),
  idCliente: integer("cve_cliente").notNull(),
  /** 1 = cliente (a quien facturas), 2 = proveedor (quien te factura). */
  tipo: smallint("tipo").notNull(),
  razonSocial: varchar("razon_social").notNull(),
  rfc: varchar("rfc").notNull(),
  nombreComercial: varchar("nombre_comercial"),
  calle: varchar("calle"),
  colonia: varchar("colonia"),
  ciudad: varchar("ciudad"),
  codigoPostal: integer("codigo_postal"),
  telefono: varchar("telefono"),
  email: varchar("email"),
  /** Régimen fiscal SAT — requerido por el CFDI 4.0 (`RegimenFiscalReceptor`), nullable: contactos legados no lo tienen. */
  idRegimen: integer("cve_regimen"),
  /** Uso de CFDI, forma y método de pago habituales — prellenan la factura nueva, editables ahí. */
  idUso: integer("cve_uso"),
  idFormaPago: integer("cve_forma_pago"),
  idMetodo: integer("cve_metodo"),
  activo: smallint("activo").notNull().default(1),
});

/**
 * Staff de Nuvio con acceso al panel interno (gestión de clientes/tenants).
 * Aislado a propósito de `administracion.usuarios`: no pertenece a ningún
 * cliente, así que una brecha en un tenant nunca puede escalar hasta aquí.
 */
export const superAdmins = corporativo.table("super_admins", {
  id: integer("cve_super_admin")
    .primaryKey()
    .default(sql`nextval('corporativo.sq_corp_super_admins')`),
  email: varchar("email").notNull(),
  passwordHash: varchar("password").notNull(),
  nombre: varchar("nombre").notNull(),
  activo: smallint("activo").notNull().default(1),
  fechaAlta: timestamp("fecha_alta", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Módulos LICENCIADOS por cliente (paquete/plan). Distinto de
 * `administracion.usuario_modulos` (acceso por operador, un subconjunto de esto).
 */
export const clienteModulos = corporativo.table("cliente_modulos", {
  id: integer("cve_cliente_modulo")
    .primaryKey()
    .default(sql`nextval('corporativo.sq_corp_cliente_modulos')`),
  idCliente: integer("cve_cliente").notNull(),
  moduloKey: varchar("modulo_key", { length: 50 }).notNull(),
  fechaAlta: timestamp("fecha_alta", { withTimezone: true }).notNull().defaultNow(),
});

/** Sesiones del panel interno (respaldo de su propia cookie httpOnly). */
export const superAdminSesiones = corporativo.table("super_admin_sesiones", {
  id: integer("cve_sesion")
    .primaryKey()
    .default(sql`nextval('corporativo.sq_corp_super_admin_sesiones')`),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  idSuperAdmin: integer("cve_super_admin").notNull(),
  fechaCreacion: timestamp("fecha_creacion", { withTimezone: true })
    .notNull()
    .defaultNow(),
  fechaExpira: timestamp("fecha_expira", { withTimezone: true }).notNull(),
  fechaUltimoUso: timestamp("fecha_ultimo_uso", { withTimezone: true }),
  ip: varchar("ip", { length: 64 }),
  userAgent: varchar("user_agent", { length: 512 }),
  revocada: smallint("revocada").notNull().default(0),
});
