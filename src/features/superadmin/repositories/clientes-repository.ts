import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { replaceModulosForCliente } from "@/features/modulos";
import type { PlanKey } from "@/config/plans";
import {
  clienteModulos,
  clientes,
  empresas,
  perfilPermisos,
  perfilUsuarios,
  perfiles,
  sesiones,
  usuarioEmpresas,
  usuarioModulos,
  usuarios,
} from "@/lib/db/schema";
import type { ClienteDetalle, ClienteListItem } from "../types";

export async function listClientes(): Promise<ClienteListItem[]> {
  const [rows, empresaCounts, usuarioCounts, moduloRows] = await Promise.all([
    db
      .select({
        id: clientes.id,
        slug: clientes.slug,
        nombre: clientes.nombre,
        activo: clientes.activo,
        plan: clientes.plan,
        fechaAlta: clientes.fechaAlta,
      })
      .from(clientes)
      .orderBy(clientes.fechaAlta),
    db
      .select({
        idCliente: empresas.idCliente,
        total: sql<number>`count(*)::int`,
      })
      .from(empresas)
      .groupBy(empresas.idCliente),
    db
      .select({
        idCliente: usuarios.idCliente,
        total: sql<number>`count(*)::int`,
      })
      .from(usuarios)
      .groupBy(usuarios.idCliente),
    db
      .select({ idCliente: clienteModulos.idCliente, key: clienteModulos.moduloKey })
      .from(clienteModulos),
  ]);

  const empresasPorCliente = new Map(
    empresaCounts.map((row) => [row.idCliente, row.total]),
  );
  const usuariosPorCliente = new Map(
    usuarioCounts.map((row) => [row.idCliente, row.total]),
  );
  const modulosPorCliente = new Map<number, string[]>();
  for (const row of moduloRows) {
    const lista = modulosPorCliente.get(row.idCliente) ?? [];
    lista.push(row.key);
    modulosPorCliente.set(row.idCliente, lista);
  }

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    nombre: row.nombre,
    activo: row.activo !== 0,
    plan: row.plan as PlanKey,
    fechaAlta: row.fechaAlta,
    empresasCount: empresasPorCliente.get(row.id) ?? 0,
    usuariosCount: usuariosPorCliente.get(row.id) ?? 0,
    moduloKeys: modulosPorCliente.get(row.id) ?? [],
  }));
}

export async function getClienteDetalle(
  id: number,
): Promise<ClienteDetalle | null> {
  const [row] = await db
    .select({
      id: clientes.id,
      slug: clientes.slug,
      nombre: clientes.nombre,
      activo: clientes.activo,
      plan: clientes.plan,
    })
    .from(clientes)
    .where(eq(clientes.id, id))
    .limit(1);

  if (!row) return null;

  const [moduloRows, adminUsuario, empresaCountRows] = await Promise.all([
    db
      .select({ key: clienteModulos.moduloKey })
      .from(clienteModulos)
      .where(eq(clienteModulos.idCliente, id)),
    findAdminUsuario(id),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(empresas)
      .where(eq(empresas.idCliente, id)),
  ]);

  return {
    id: row.id,
    slug: row.slug,
    nombre: row.nombre,
    activo: row.activo !== 0,
    plan: row.plan as PlanKey,
    empresasCount: empresaCountRows[0]?.total ?? 0,
    moduloKeys: moduloRows.map((r) => r.key),
    adminUsuario,
  };
}

/** Usuario administrador sembrado en el onboarding (login "admin") de un cliente. */
export async function findAdminUsuario(
  idCliente: number,
): Promise<{ id: number; nombre: string; email: string | null } | null> {
  const [row] = await db
    .select({ id: usuarios.id, nombre: usuarios.nombre, email: usuarios.email })
    .from(usuarios)
    .where(and(eq(usuarios.idCliente, idCliente), eq(usuarios.login, "admin")))
    .limit(1);
  return row ?? null;
}

/** Restablece la contraseña del usuario administrador de un cliente (acotado a ese cliente). */
export async function setAdminPassword(
  idUsuario: number,
  idCliente: number,
  passwordHash: string,
): Promise<void> {
  await db
    .update(usuarios)
    .set({ passwordHash })
    .where(and(eq(usuarios.id, idUsuario), eq(usuarios.idCliente, idCliente)));
}

export async function existsSlug(
  slug: string,
  exceptId?: number,
): Promise<boolean> {
  const slugMatch = eq(sql`lower(${clientes.slug})`, slug.toLowerCase());
  const [row] = await db
    .select({ id: clientes.id })
    .from(clientes)
    .where(
      exceptId === undefined ? slugMatch : and(slugMatch, ne(clientes.id, exceptId)),
    )
    .limit(1);
  return Boolean(row);
}

export async function updateCliente(
  id: number,
  data: { nombre: string; activo: boolean; plan: PlanKey; modulos: string[] },
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(clientes)
      .set({ nombre: data.nombre, activo: data.activo ? 1 : 0, plan: data.plan })
      .where(eq(clientes.id, id));

    const moduloKeys = Array.from(new Set(["administracion", ...data.modulos]));
    await replaceModulosForCliente(tx, id, moduloKeys);
  });
}

/**
 * Elimina un cliente y todo lo que le pertenece dentro del dominio de
 * auth+RBAC+multitenant (usuarios, perfiles, empresas, módulos, sesiones).
 * Todo en una transacción: si el cliente tiene datos de negocio en otras
 * partes del sistema legado (facturas, contratos, etc.), la FK correspondiente
 * revierte todo el borrado y el use-case lo traduce en un error legible.
 */
export async function deleteCliente(id: number): Promise<void> {
  await db.transaction(async (tx) => {
    const usuarioRows = await tx
      .select({ id: usuarios.id })
      .from(usuarios)
      .where(eq(usuarios.idCliente, id));
    const usuarioIds = usuarioRows.map((row) => row.id);

    const perfilRows = await tx
      .select({ id: perfiles.id })
      .from(perfiles)
      .where(eq(perfiles.idCliente, id));
    const perfilIds = perfilRows.map((row) => row.id);

    const empresaRows = await tx
      .select({ id: empresas.id })
      .from(empresas)
      .where(eq(empresas.idCliente, id));
    const empresaIds = empresaRows.map((row) => row.id);

    if (usuarioIds.length > 0) {
      await tx.delete(sesiones).where(inArray(sesiones.idUsuario, usuarioIds));
      await tx.delete(usuarioModulos).where(inArray(usuarioModulos.idUsuario, usuarioIds));
      await tx.delete(usuarioEmpresas).where(inArray(usuarioEmpresas.idUsuario, usuarioIds));
      await tx.delete(perfilUsuarios).where(inArray(perfilUsuarios.idUsuario, usuarioIds));
    }

    if (perfilIds.length > 0) {
      await tx.delete(perfilPermisos).where(inArray(perfilPermisos.idPerfil, perfilIds));
      await tx.delete(perfilUsuarios).where(inArray(perfilUsuarios.idPerfil, perfilIds));
    }

    if (usuarioIds.length > 0) {
      await tx.delete(usuarios).where(inArray(usuarios.id, usuarioIds));
    }
    if (perfilIds.length > 0) {
      await tx.delete(perfiles).where(inArray(perfiles.id, perfilIds));
    }

    await tx.delete(clienteModulos).where(eq(clienteModulos.idCliente, id));

    if (empresaIds.length > 0) {
      await tx.delete(empresas).where(inArray(empresas.id, empresaIds));
    }

    await tx.delete(clientes).where(eq(clientes.id, id));
  });
}

export async function setActivo(id: number, activo: boolean): Promise<void> {
  await db
    .update(clientes)
    .set({ activo: activo ? 1 : 0 })
    .where(eq(clientes.id, id));
}

export async function getStats() {
  const [[clientesRow], [empresasRow], [usuariosRow]] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        activos: sql<number>`count(*) filter (where ${clientes.activo} = 1)::int`,
      })
      .from(clientes),
    db.select({ total: sql<number>`count(*)::int` }).from(empresas),
    db.select({ total: sql<number>`count(*)::int` }).from(usuarios),
  ]);

  return {
    clientesTotal: clientesRow.total,
    clientesActivos: clientesRow.activos,
    empresasTotal: empresasRow.total,
    usuariosTotal: usuariosRow.total,
  };
}
