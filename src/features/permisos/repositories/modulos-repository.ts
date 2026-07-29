import { ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { modulos } from "@/lib/db/schema";
import type { ModuloOption } from "../types";

const SENTINEL_ID = -1;

/** Módulos reales (excluye el sentinel), para agrupar y para el selector. */
export async function listModulos(): Promise<ModuloOption[]> {
  return db
    .select({ id: modulos.id, nombre: modulos.nombre })
    .from(modulos)
    .where(ne(modulos.id, SENTINEL_ID))
    .orderBy(modulos.nombre);
}
