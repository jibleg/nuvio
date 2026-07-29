import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { modulos, permisos } from "@/lib/db/schema";
import type { PermisoDetalle, PermisoListItem } from "../types";

const SIN_MODULO = -1;

function nombreModulo(id: number | null, nombre: string | null): string {
  if (id === null || id === SIN_MODULO) return "Sin módulo";
  return nombre ?? "Sin módulo";
}

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

export async function getPermisoById(id: number): Promise<PermisoDetalle | null> {
  const [row] = await db
    .select({
      id: permisos.id,
      nombre: permisos.nombre,
      codigo: permisos.codigo,
      idModulo: permisos.idModulo,
      activo: permisos.activo,
    })
    .from(permisos)
    .where(eq(permisos.id, id))
    .limit(1);

  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre,
    codigo: row.codigo,
    idModulo: row.idModulo ?? SIN_MODULO,
    activo: row.activo !== 0,
  };
}

export async function existsCodigo(
  codigo: string,
  exceptId?: number,
): Promise<boolean> {
  const [row] = await db
    .select({ id: permisos.id })
    .from(permisos)
    .where(
      exceptId === undefined
        ? eq(permisos.codigo, codigo)
        : and(eq(permisos.codigo, codigo), ne(permisos.id, exceptId)),
    )
    .limit(1);
  return Boolean(row);
}

export async function createPermiso(data: {
  nombre: string;
  codigo: string;
  idModulo: number;
}): Promise<number> {
  return db.transaction(async (tx) => {
    const [{ maxId }] = await tx
      .select({ maxId: sql<number>`coalesce(max(${permisos.id}), 0)::int` })
      .from(permisos);
    const id = maxId + 1;
    await tx.insert(permisos).values({
      id,
      idModulo: data.idModulo,
      nombre: data.nombre,
      codigo: data.codigo,
      activo: 1,
    });
    return id;
  });
}

export async function updatePermiso(
  id: number,
  data: { nombre: string; codigo: string; idModulo: number; activo: boolean },
): Promise<void> {
  await db
    .update(permisos)
    .set({
      nombre: data.nombre,
      codigo: data.codigo,
      idModulo: data.idModulo,
      activo: data.activo ? 1 : 0,
    })
    .where(eq(permisos.id, id));
}

export async function setActivoPermiso(
  id: number,
  activo: boolean,
): Promise<void> {
  await db
    .update(permisos)
    .set({ activo: activo ? 1 : 0 })
    .where(eq(permisos.id, id));
}
