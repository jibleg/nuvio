import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { sesiones, usuarios } from "@/lib/db/schema";
import type { UsuarioRow } from "./usuarios-repository";

type SesionRow = typeof sesiones.$inferSelect;

export type SesionConUsuario = {
  sesion: SesionRow;
  usuario: UsuarioRow;
};

export async function createSesion(data: {
  tokenHash: string;
  idUsuario: number;
  fechaExpira: Date;
  ip: string | null;
  userAgent: string | null;
}): Promise<void> {
  await db.insert(sesiones).values(data);
}

/** Sesión vigente (no revocada, no expirada) junto con su usuario. */
export async function findSesionVigenteConUsuario(
  tokenHash: string,
): Promise<SesionConUsuario | null> {
  const [row] = await db
    .select({ sesion: sesiones, usuario: usuarios })
    .from(sesiones)
    .innerJoin(usuarios, eq(usuarios.id, sesiones.idUsuario))
    .where(
      and(
        eq(sesiones.tokenHash, tokenHash),
        eq(sesiones.revocada, 0),
        gt(sesiones.fechaExpira, new Date()),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function revocarSesion(tokenHash: string): Promise<void> {
  await db
    .update(sesiones)
    .set({ revocada: 1 })
    .where(eq(sesiones.tokenHash, tokenHash));
}

export async function actualizarEmpresaActiva(
  tokenHash: string,
  idEmpresa: number,
): Promise<void> {
  await db
    .update(sesiones)
    .set({ idEmpresaActiva: idEmpresa })
    .where(eq(sesiones.tokenHash, tokenHash));
}
