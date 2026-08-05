import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { empresaFolios } from "@/lib/db/schema";

/**
 * Consume y devuelve el siguiente folio de una empresa, de forma atómica
 * (upsert: `siguienteFolio + 1` referencia la fila existente en la BD, no un
 * valor leído en la app, así que dos timbrados concurrentes no repiten
 * folio). Reemplaza el patrón de secuencia Postgres dinámica por-empresa de
 * factura-facil (`sign_namesequence` + `nextval` interpolado).
 */
export async function siguienteFolio(idEmpresa: number): Promise<number> {
  const [row] = await db
    .insert(empresaFolios)
    .values({ idEmpresa, siguienteFolio: 2 })
    .onConflictDoUpdate({
      target: empresaFolios.idEmpresa,
      set: { siguienteFolio: sql`${empresaFolios.siguienteFolio} + 1` },
    })
    .returning({ siguienteFolio: empresaFolios.siguienteFolio });
  return row.siguienteFolio - 1;
}
