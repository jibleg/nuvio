/**
 * Punto de entrada de infraestructura de datos.
 * Consumir siempre `db` desde aquí (`@/lib/db`) en los repositories.
 */
export { db } from "./client";
export * as schema from "./schema";
