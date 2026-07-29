import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { perfilPermisos, perfilUsuarios, perfiles } from "@/lib/db/schema";
import type { PerfilDetalle, PerfilListItem } from "../types";

const SENTINEL_ID = -1;

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function listPerfilesAdmin(): Promise<PerfilListItem[]> {
  const [rows, permisoCounts, usuarioCounts] = await Promise.all([
    db
      .select({
        id: perfiles.id,
        nombre: perfiles.nombre,
        descripcion: perfiles.descripcion,
        activo: perfiles.activo,
      })
      .from(perfiles)
      .where(ne(perfiles.id, SENTINEL_ID))
      .orderBy(perfiles.nombre),
    db
      .select({
        idPerfil: perfilPermisos.idPerfil,
        total: sql<number>`count(*)::int`,
      })
      .from(perfilPermisos)
      .groupBy(perfilPermisos.idPerfil),
    db
      .select({
        idPerfil: perfilUsuarios.idPerfil,
        total: sql<number>`count(*)::int`,
      })
      .from(perfilUsuarios)
      .groupBy(perfilUsuarios.idPerfil),
  ]);

  const permisosPorPerfil = mapaConteo(permisoCounts);
  const usuariosPorPerfil = mapaConteo(usuarioCounts);

  return rows.map((row) => ({
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    activo: row.activo !== 0,
    permisosCount: permisosPorPerfil.get(row.id) ?? 0,
    usuariosCount: usuariosPorPerfil.get(row.id) ?? 0,
  }));
}

export async function getPerfilDetalle(
  id: number,
): Promise<PerfilDetalle | null> {
  const [perfil] = await db
    .select({
      id: perfiles.id,
      nombre: perfiles.nombre,
      descripcion: perfiles.descripcion,
      activo: perfiles.activo,
    })
    .from(perfiles)
    .where(eq(perfiles.id, id))
    .limit(1);

  if (!perfil) return null;

  const permisoRows = await db
    .select({ id: perfilPermisos.idPermiso })
    .from(perfilPermisos)
    .where(eq(perfilPermisos.idPerfil, id));

  return {
    id: perfil.id,
    nombre: perfil.nombre,
    descripcion: perfil.descripcion,
    activo: perfil.activo !== 0,
    permisoIds: permisoRows
      .map((row) => row.id)
      .filter((value): value is number => value !== null && value > 0),
  };
}

export async function existsNombre(
  nombre: string,
  exceptId?: number,
): Promise<boolean> {
  const [row] = await db
    .select({ id: perfiles.id })
    .from(perfiles)
    .where(
      exceptId === undefined
        ? eq(perfiles.nombre, nombre)
        : and(eq(perfiles.nombre, nombre), ne(perfiles.id, exceptId)),
    )
    .limit(1);
  return Boolean(row);
}

export async function createPerfil(data: {
  nombre: string;
  descripcion: string | null;
  permisoIds: number[];
}): Promise<number> {
  return db.transaction(async (tx) => {
    const [{ maxId }] = await tx
      .select({ maxId: sql<number>`coalesce(max(${perfiles.id}), 0)::int` })
      .from(perfiles);
    const id = maxId + 1;

    await tx.insert(perfiles).values({
      id,
      nombre: data.nombre,
      descripcion: data.descripcion,
      activo: 1,
    });
    await assignPermisos(tx, id, data.permisoIds);
    return id;
  });
}

export async function updatePerfil(
  id: number,
  data: {
    nombre: string;
    descripcion: string | null;
    activo: boolean;
    permisoIds: number[];
  },
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(perfiles)
      .set({
        nombre: data.nombre,
        descripcion: data.descripcion,
        activo: data.activo ? 1 : 0,
      })
      .where(eq(perfiles.id, id));

    await tx.delete(perfilPermisos).where(eq(perfilPermisos.idPerfil, id));
    await assignPermisos(tx, id, data.permisoIds);
  });
}

export async function setActivo(id: number, activo: boolean): Promise<void> {
  await db
    .update(perfiles)
    .set({ activo: activo ? 1 : 0 })
    .where(eq(perfiles.id, id));
}

function mapaConteo(
  rows: { idPerfil: number | null; total: number }[],
): Map<number, number> {
  return new Map(
    rows
      .filter((row) => row.idPerfil !== null)
      .map((row) => [row.idPerfil as number, row.total]),
  );
}

async function assignPermisos(
  tx: DbTransaction,
  idPerfil: number,
  permisoIds: number[],
): Promise<void> {
  if (permisoIds.length === 0) return;
  const [{ maxId }] = await tx
    .select({ maxId: sql<number>`coalesce(max(${perfilPermisos.id}), 0)::int` })
    .from(perfilPermisos);
  await tx.insert(perfilPermisos).values(
    permisoIds.map((idPermiso, index) => ({
      id: maxId + 1 + index,
      idPerfil,
      idPermiso,
    })),
  );
}
