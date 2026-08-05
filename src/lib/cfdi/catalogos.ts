import { and, asc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { formaPago, metodoPago, moneda, motivoCancelacion, regimenFiscal, servicio, unidad, uso } from "@/lib/db/schema";

/**
 * Lectura de los catálogos SAT ya sembrados en la BD (regímenes, usos,
 * formas/métodos de pago, moneda, claves de producto/servicio y de unidad).
 * Vive en `lib` (no en una feature) porque lo consumen varias: `sucursales`
 * y `contactos-facturacion` (régimen fiscal de emisor/receptor) y
 * `facturacion` (todo lo demás).
 */

export type CatalogoItem = { id: number; clave: string; descripcion: string | null };

export async function listRegimenesFiscales(): Promise<CatalogoItem[]> {
  return db
    .select({ id: regimenFiscal.id, clave: regimenFiscal.clave, descripcion: regimenFiscal.descripcion })
    .from(regimenFiscal)
    .where(eq(regimenFiscal.activo, 1))
    .orderBy(asc(regimenFiscal.clave));
}

export async function listUsosCfdi(): Promise<CatalogoItem[]> {
  return db
    .select({ id: uso.id, clave: uso.clave, descripcion: uso.descripcion })
    .from(uso)
    .where(eq(uso.activo, 1))
    .orderBy(asc(uso.clave));
}

export async function listFormasPago(): Promise<CatalogoItem[]> {
  return db
    .select({ id: formaPago.id, clave: formaPago.clave, descripcion: formaPago.descripcion })
    .from(formaPago)
    .where(eq(formaPago.activo, 1))
    .orderBy(asc(formaPago.clave));
}

export type MetodoPagoItem = CatalogoItem & { idCondicion: number };

export async function listMetodosPago(): Promise<MetodoPagoItem[]> {
  return db
    .select({ id: metodoPago.id, clave: metodoPago.clave, descripcion: metodoPago.descripcion, idCondicion: metodoPago.idCondicion })
    .from(metodoPago)
    .where(eq(metodoPago.activo, 1))
    .orderBy(asc(metodoPago.clave));
}

export async function listMonedas(): Promise<CatalogoItem[]> {
  return db
    .select({ id: moneda.id, clave: moneda.clave, descripcion: moneda.descripcion })
    .from(moneda)
    .where(eq(moneda.activo, 1))
    .orderBy(asc(moneda.clave));
}

export async function listMotivosCancelacion(): Promise<CatalogoItem[]> {
  return db
    .select({ id: motivoCancelacion.id, clave: motivoCancelacion.clave, descripcion: motivoCancelacion.descripcion })
    .from(motivoCancelacion)
    .where(eq(motivoCancelacion.activo, 1))
    .orderBy(asc(motivoCancelacion.clave));
}

const MIN_QUERY = 2;
const LIMITE_BUSQUEDA = 20;

/** Typeahead sobre `c_ClaveProdServ` (52,514 filas) — acelerado por índice trigram. */
export async function buscarClaveProdServ(query: string): Promise<CatalogoItem[]> {
  const q = query.trim();
  if (q.length < MIN_QUERY) return [];
  return db
    .select({ id: servicio.id, clave: servicio.clave, descripcion: servicio.descripcion })
    .from(servicio)
    .where(and(eq(servicio.activo, 1), or(ilike(servicio.descripcion, `%${q}%`), ilike(servicio.clave, `${q}%`))))
    .orderBy(asc(servicio.descripcion))
    .limit(LIMITE_BUSQUEDA);
}

/** Typeahead sobre `c_ClaveUnidad` (2,419 filas) — acelerado por índice trigram. */
export async function buscarClaveUnidad(query: string): Promise<CatalogoItem[]> {
  const q = query.trim();
  if (q.length < MIN_QUERY) return [];
  return db
    .select({ id: unidad.id, clave: unidad.clave, descripcion: unidad.descripcion })
    .from(unidad)
    .where(and(eq(unidad.activo, 1), or(ilike(unidad.descripcion, `%${q}%`), ilike(unidad.clave, `${q}%`))))
    .orderBy(asc(unidad.descripcion))
    .limit(LIMITE_BUSQUEDA);
}
