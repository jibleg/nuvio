import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  perfilPermisos,
  perfilUsuarios,
  perfiles,
  permisos,
} from "@/lib/db/schema";

/**
 * Códigos de permiso efectivos de un usuario, recorriendo la cadena RBAC:
 * usuario → perfiles activos → permisos activos. Devuelve códigos únicos.
 */
export async function findPermisoCodesByUsuario(
  usuarioId: number,
): Promise<string[]> {
  const rows = await db
    .selectDistinct({ codigo: permisos.codigo })
    .from(perfilUsuarios)
    .innerJoin(
      perfiles,
      and(eq(perfiles.id, perfilUsuarios.idPerfil), eq(perfiles.activo, 1)),
    )
    .innerJoin(perfilPermisos, eq(perfilPermisos.idPerfil, perfilUsuarios.idPerfil))
    .innerJoin(
      permisos,
      and(eq(permisos.id, perfilPermisos.idPermiso), eq(permisos.activo, 1)),
    )
    .where(eq(perfilUsuarios.idUsuario, usuarioId));

  return rows
    .map((row) => row.codigo)
    .filter((codigo): codigo is string => Boolean(codigo));
}
