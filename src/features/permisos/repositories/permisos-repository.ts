import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { modulos, permisos } from "@/lib/db/schema";
import type { PermisoListItem } from "../types";

const SIN_MODULO = -1;

function nombreModulo(id: number | null, nombre: string | null): string {
  if (id === null || id === SIN_MODULO) return "Sin módulo";
  return nombre ?? "Sin módulo";
}

/** Catálogo de permisos (sembrado por el sistema, ligado a los guards por código). */
export async function listPermisos(): Promise<PermisoListItem[]> {
  const rows = await db
    .select({
      id: permisos.id,
      nombre: permisos.nombre,
      codigo: permisos.codigo,
      activo: permisos.activo,
      moduloId: permisos.idModulo,
      moduloNombre: modulos.nombre,
    })
    .from(permisos)
    .leftJoin(modulos, eq(modulos.id, permisos.idModulo))
    .orderBy(permisos.nombre);

  return rows.map((row) => ({
    id: row.id,
    nombre: row.nombre,
    codigo: row.codigo,
    activo: row.activo !== 0,
    moduloId: row.moduloId ?? SIN_MODULO,
    moduloNombre: nombreModulo(row.moduloId, row.moduloNombre),
  }));
}
