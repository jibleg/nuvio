import { integer, pgSchema, varchar } from "drizzle-orm/pg-core";

/**
 * Mapeo Drizzle del schema `corporativo`. Por ahora solo se mapea `empresas`
 * con las columnas relevantes para autenticación y multiempresa; el resto de
 * columnas fiscales/CFDI se añaden cuando un módulo las necesite.
 */
export const corporativo = pgSchema("corporativo");

export const empresas = corporativo.table("empresas", {
  id: integer("cve_empresa").primaryKey(),
  nombreComercial: varchar("nombre_comercial").notNull(),
  nombreCorto: varchar("nombre_corto"),
  razonSocial: varchar("razon_social"),
  rfc: varchar("rfc"),
  activo: integer("activo"),
  idRegimen: integer("cve_regimen"),
});
