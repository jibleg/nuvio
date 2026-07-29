/**
 * Barrel del schema físico de la base de datos `nuvio`.
 * Los repositories de cada feature importan las tablas desde aquí
 * (`@/lib/db/schema`); nunca definen tablas por su cuenta.
 */
export * from "./administracion";
export * from "./corporativo";
