import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { superAdminSesiones, superAdmins } from "@/lib/db/schema";

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
