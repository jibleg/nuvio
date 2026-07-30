import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  perfilUsuarios,
  perfiles,
  usuarioEmpresas,
  usuarioModulos,
  usuarios,
} from "@/lib/db/schema";
import { replaceModulosForUsuario } from "@/features/modulos";
import type { UsuarioDetalle, UsuarioListItem } from "../types";

const SENTINEL_ID = -1;

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type CreateUsuarioData = {
  idCliente: number;
  login: string;
  passwordHash: string;
  nombre: string;
  email: string;
  perfilIds: number[];
  empresaIds: number[];
  moduloKeys: string[];
};

export type UpdateUsuarioData = {
  nombre: string;
  email: string;
  passwordHash: string | null;
  activo: boolean;
  perfilIds: number[];
  empresaIds: number[];
  moduloKeys: string[];
};

export async function listUsuarios(
  idCliente: number,
): Promise<UsuarioListItem[]> {
  const [rows, perfilRows, empresaCounts] = await Promise.all([
    db
      .select({
        id: usuarios.id,
        login: usuarios.login,
        nombre: usuarios.nombre,
        email: usuarios.email,
        activo: usuarios.activo,
      })
      .from(usuarios)
      .where(and(ne(usuarios.id, SENTINEL_ID), eq(usuarios.idCliente, idCliente)))
      .orderBy(usuarios.nombre),
    db
      .select({ idUsuario: perfilUsuarios.idUsuario, nombre: perfiles.nombre })
      .from(perfilUsuarios)
      .innerJoin(perfiles, eq(perfiles.id, perfilUsuarios.idPerfil)),
    db
      .select({
        idUsuario: usuarioEmpresas.idUsuario,
        total: sql<number>`count(*)::int`,
      })
      .from(usuarioEmpresas)
      .groupBy(usuarioEmpresas.idUsuario),
  ]);

  const perfilesPorUsuario = new Map<number, string[]>();
  for (const row of perfilRows) {
    if (row.idUsuario === null) continue;
    const lista = perfilesPorUsuario.get(row.idUsuario) ?? [];
    lista.push(row.nombre);
    perfilesPorUsuario.set(row.idUsuario, lista);
  }
  const empresasPorUsuario = new Map<number, number>(
    empresaCounts
      .filter((row) => row.idUsuario !== null)
      .map((row) => [row.idUsuario as number, row.total]),
  );

  return rows.map((row) => ({
    id: row.id,
    login: row.login,
    nombre: row.nombre,
    email: row.email,
    activo: row.activo !== 0,
    perfiles: perfilesPorUsuario.get(row.id) ?? [],
    empresasCount: empresasPorUsuario.get(row.id) ?? 0,
  }));
}

export async function getUsuarioDetalle(
  id: number,
  idCliente: number,
): Promise<UsuarioDetalle | null> {
  const [usuario] = await db
    .select({
      id: usuarios.id,
      login: usuarios.login,
      nombre: usuarios.nombre,
      email: usuarios.email,
      activo: usuarios.activo,
    })
    .from(usuarios)
    .where(and(eq(usuarios.id, id), eq(usuarios.idCliente, idCliente)))
    .limit(1);

  if (!usuario) return null;

  const [perfilRows, empresaRows, moduloRows] = await Promise.all([
    db
      .select({ id: perfilUsuarios.idPerfil })
      .from(perfilUsuarios)
      .where(eq(perfilUsuarios.idUsuario, id)),
    db
      .select({ id: usuarioEmpresas.idEmpresa })
      .from(usuarioEmpresas)
      .where(eq(usuarioEmpresas.idUsuario, id)),
    db
      .select({ key: usuarioModulos.moduloKey })
      .from(usuarioModulos)
      .where(eq(usuarioModulos.idUsuario, id)),
  ]);

  return {
    id: usuario.id,
    login: usuario.login,
    nombre: usuario.nombre,
    email: usuario.email,
    activo: usuario.activo !== 0,
    perfilIds: perfilRows
      .map((row) => row.id)
      .filter((value): value is number => value !== null && value > 0),
    empresaIds: empresaRows.map((row) => row.id),
    moduloKeys: moduloRows.map((row) => row.key),
  };
}

export async function existsLogin(
  login: string,
  idCliente: number,
  exceptId?: number,
): Promise<boolean> {
  const [row] = await db
    .select({ id: usuarios.id })
    .from(usuarios)
    .where(
      exceptId === undefined
        ? and(eq(usuarios.login, login), eq(usuarios.idCliente, idCliente))
        : and(
            eq(usuarios.login, login),
            eq(usuarios.idCliente, idCliente),
            ne(usuarios.id, exceptId),
          ),
    )
    .limit(1);
  return Boolean(row);
}

export async function existsEmail(
  email: string,
  idCliente: number,
  exceptId?: number,
): Promise<boolean> {
  const [row] = await db
    .select({ id: usuarios.id })
    .from(usuarios)
    .where(
      exceptId === undefined
        ? and(
            eq(sql`lower(${usuarios.email})`, email.toLowerCase()),
            eq(usuarios.idCliente, idCliente),
          )
        : and(
            eq(sql`lower(${usuarios.email})`, email.toLowerCase()),
            eq(usuarios.idCliente, idCliente),
            ne(usuarios.id, exceptId),
          ),
    )
    .limit(1);
  return Boolean(row);
}

export async function createUsuario(data: CreateUsuarioData): Promise<number> {
  return db.transaction(async (tx) => {
    const [{ maxId }] = await tx
      .select({ maxId: sql<number>`coalesce(max(${usuarios.id}), 0)::int` })
      .from(usuarios);
    const id = maxId + 1;

    await tx.insert(usuarios).values({
      id,
      idCliente: data.idCliente,
      login: data.login,
      passwordHash: data.passwordHash,
      nombre: data.nombre,
      descripcion: data.nombre,
      email: data.email,
      activo: 1,
      debeCambiarPassword: 0,
    });
    await assignPerfiles(tx, id, data.perfilIds);
    await assignEmpresas(tx, id, data.empresaIds);
    await replaceModulosForUsuario(tx, id, data.moduloKeys);
    return id;
  });
}

export async function updateUsuario(
  id: number,
  idCliente: number,
  data: UpdateUsuarioData,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(usuarios)
      .set({
        nombre: data.nombre,
        email: data.email,
        activo: data.activo ? 1 : 0,
        ...(data.passwordHash ? { passwordHash: data.passwordHash } : {}),
      })
      .where(and(eq(usuarios.id, id), eq(usuarios.idCliente, idCliente)));

    await tx.delete(perfilUsuarios).where(eq(perfilUsuarios.idUsuario, id));
    await assignPerfiles(tx, id, data.perfilIds);

    await tx.delete(usuarioEmpresas).where(eq(usuarioEmpresas.idUsuario, id));
    await assignEmpresas(tx, id, data.empresaIds);

    await replaceModulosForUsuario(tx, id, data.moduloKeys);
  });
}

export async function setActivo(
  id: number,
  idCliente: number,
  activo: boolean,
): Promise<void> {
  await db
    .update(usuarios)
    .set({ activo: activo ? 1 : 0 })
    .where(and(eq(usuarios.id, id), eq(usuarios.idCliente, idCliente)));
}

async function assignPerfiles(
  tx: DbTransaction,
  idUsuario: number,
  perfilIds: number[],
): Promise<void> {
  if (perfilIds.length === 0) return;
  const [{ maxId }] = await tx
    .select({ maxId: sql<number>`coalesce(max(${perfilUsuarios.id}), 0)::int` })
    .from(perfilUsuarios);
  await tx.insert(perfilUsuarios).values(
    perfilIds.map((idPerfil, index) => ({
      id: maxId + 1 + index,
      idUsuario,
      idPerfil,
    })),
  );
}

async function assignEmpresas(
  tx: DbTransaction,
  idUsuario: number,
  empresaIds: number[],
): Promise<void> {
  if (empresaIds.length === 0) return;
  await tx
    .insert(usuarioEmpresas)
    .values(empresaIds.map((idEmpresa) => ({ idUsuario, idEmpresa })));
}
