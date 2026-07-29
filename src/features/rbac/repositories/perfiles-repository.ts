import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { perfilUsuarios, perfiles } from "@/lib/db/schema";

export type Perfil = {
  id: number;
  nombre: string;
  descripcion: string | null;
};

/** Perfiles activos (roles asignables) de un cliente. */
export async function findAllPerfiles(idCliente: number): Promise<Perfil[]> {
  return db
    .select({
      id: perfiles.id,
      nombre: perfiles.nombre,
      descripcion: perfiles.descripcion,
    })
    .from(perfiles)
    .where(and(eq(perfiles.activo, 1), eq(perfiles.idCliente, idCliente)))
    .orderBy(perfiles.nombre);
}

/** Nombres de los perfiles (roles) activos asignados a un usuario. */
export async function findPerfilNamesByUsuario(
  usuarioId: number,
): Promise<string[]> {
  const rows = await db
    .select({ nombre: perfiles.nombre })
    .from(perfilUsuarios)
    .innerJoin(
      perfiles,
      and(eq(perfiles.id, perfilUsuarios.idPerfil), eq(perfiles.activo, 1)),
    )
    .where(eq(perfilUsuarios.idUsuario, usuarioId))
    .orderBy(perfiles.nombre);

  return rows.map((row) => row.nombre);
}
