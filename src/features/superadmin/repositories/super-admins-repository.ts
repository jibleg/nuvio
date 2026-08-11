import { and, eq, gt, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { superAdminSesiones, superAdmins } from "@/lib/db/schema";
import type { StaffDetalle, StaffListItem } from "../types";

export type SuperAdminRow = typeof superAdmins.$inferSelect;
type SesionRow = typeof superAdminSesiones.$inferSelect;

export async function findSuperAdminByEmail(
  email: string,
): Promise<SuperAdminRow | null> {
  const [row] = await db
    .select()
    .from(superAdmins)
    .where(eq(sql`lower(${superAdmins.email})`, email.toLowerCase()))
    .limit(1);
  return row ?? null;
}

export async function createSuperAdminSesion(data: {
  tokenHash: string;
  idSuperAdmin: number;
  fechaExpira: Date;
  ip: string | null;
  userAgent: string | null;
}): Promise<void> {
  await db.insert(superAdminSesiones).values(data);
}

export type SesionConSuperAdmin = {
  sesion: SesionRow;
  superAdmin: SuperAdminRow;
};

export async function findSuperAdminSesionVigente(
  tokenHash: string,
): Promise<SesionConSuperAdmin | null> {
  const [row] = await db
    .select({ sesion: superAdminSesiones, superAdmin: superAdmins })
    .from(superAdminSesiones)
    .innerJoin(
      superAdmins,
      eq(superAdmins.id, superAdminSesiones.idSuperAdmin),
    )
    .where(
      and(
        eq(superAdminSesiones.tokenHash, tokenHash),
        eq(superAdminSesiones.revocada, 0),
        gt(superAdminSesiones.fechaExpira, new Date()),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function revocarSuperAdminSesion(tokenHash: string): Promise<void> {
  await db
    .update(superAdminSesiones)
    .set({ revocada: 1 })
    .where(eq(superAdminSesiones.tokenHash, tokenHash));
}

const staffColumns = {
  id: superAdmins.id,
  email: superAdmins.email,
  nombre: superAdmins.nombre,
  activo: superAdmins.activo,
  fechaAlta: superAdmins.fechaAlta,
};

function toStaffItem(row: {
  id: number;
  email: string;
  nombre: string;
  activo: number;
  fechaAlta: Date;
}): StaffListItem {
  return { id: row.id, email: row.email, nombre: row.nombre, activo: row.activo !== 0, fechaAlta: row.fechaAlta };
}

/** Cuentas de staff (`/superadmin`) — no confundir con usuarios de un tenant. */
export async function listSuperAdmins(): Promise<StaffListItem[]> {
  const rows = await db.select(staffColumns).from(superAdmins).orderBy(superAdmins.fechaAlta);
  return rows.map(toStaffItem);
}

export async function getSuperAdminDetalle(id: number): Promise<StaffDetalle | null> {
  const [row] = await db.select(staffColumns).from(superAdmins).where(eq(superAdmins.id, id)).limit(1);
  return row ? toStaffItem(row) : null;
}

export async function existsSuperAdminEmail(email: string, exceptId?: number): Promise<boolean> {
  const emailMatch = eq(sql`lower(${superAdmins.email})`, email.toLowerCase());
  const [row] = await db
    .select({ id: superAdmins.id })
    .from(superAdmins)
    .where(exceptId === undefined ? emailMatch : and(emailMatch, ne(superAdmins.id, exceptId)))
    .limit(1);
  return Boolean(row);
}

export async function createSuperAdmin(data: {
  nombre: string;
  email: string;
  passwordHash: string;
}): Promise<number> {
  const [{ id }] = await db
    .insert(superAdmins)
    .values({ nombre: data.nombre, email: data.email, passwordHash: data.passwordHash })
    .returning({ id: superAdmins.id });
  return id;
}

export async function updateSuperAdmin(
  id: number,
  data: { nombre: string; email: string; activo: boolean },
): Promise<void> {
  await db
    .update(superAdmins)
    .set({ nombre: data.nombre, email: data.email, activo: data.activo ? 1 : 0 })
    .where(eq(superAdmins.id, id));
}

export async function setSuperAdminPassword(id: number, passwordHash: string): Promise<void> {
  await db.update(superAdmins).set({ passwordHash }).where(eq(superAdmins.id, id));
}

/** Solo el estado activo/inactivo, para el toggle rápido en el listado (sin tocar nombre/correo). */
export async function setSuperAdminActivo(id: number, activo: boolean): Promise<void> {
  await db.update(superAdmins).set({ activo: activo ? 1 : 0 }).where(eq(superAdmins.id, id));
}

/** Elimina la cuenta de staff y sus sesiones (`super_admin_sesiones` referencia por FK). */
export async function deleteSuperAdmin(id: number): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(superAdminSesiones).where(eq(superAdminSesiones.idSuperAdmin, id));
    await tx.delete(superAdmins).where(eq(superAdmins.id, id));
  });
}

/** Para bloquear que se desactive/elimine la última cuenta de staff activa (evitaría quedar sin acceso al panel). */
export async function countSuperAdminsActivos(): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`count(*) filter (where ${superAdmins.activo} = 1)::int` })
    .from(superAdmins);
  return row?.total ?? 0;
}
