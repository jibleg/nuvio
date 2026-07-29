import { integer, pgSchema, smallint, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Mapeo Drizzle del schema `corporativo`. Por ahora solo se mapean `clientes` y
 * `empresas` con las columnas relevantes para autenticación y multitenancy; el
 * resto de columnas fiscales/CFDI se añaden cuando un módulo las necesite.
 */
export const corporativo = pgSchema("corporativo");

/** Cliente = tenant raíz (organización que adquiere Nuvio). Se resuelve por subdominio (`slug`). */
export const clientes = corporativo.table("clientes", {
  id: integer("cve_cliente").primaryKey(),
  slug: varchar("slug", { length: 63 }).notNull(),
  nombre: varchar("nombre", { length: 150 }).notNull(),
  activo: smallint("activo").notNull().default(1),
  fechaAlta: timestamp("fecha_alta", { withTimezone: true }).notNull().defaultNow(),
});

export const empresas = corporativo.table("empresas", {
  id: integer("cve_empresa").primaryKey(),
  idCliente: integer("cve_cliente").notNull(),
  nombreComercial: varchar("nombre_comercial").notNull(),
  nombreCorto: varchar("nombre_corto"),
  razonSocial: varchar("razon_social"),
  rfc: varchar("rfc"),
  activo: integer("activo"),
  idRegimen: integer("cve_regimen"),
});
