import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { perfiles } from "@/lib/db/schema";

export type Perfil = {
  id: number;
  nombre: string;
  descripcion: string | null;
};

/** Perfiles activos (roles asignables). */
export async function findAllPerfiles(): Promise<Perfil[]> {
  return db
    .select({
      id: perfiles.id,
      nombre: perfiles.nombre,
      descripcion: perfiles.descripcion,
    })
    .from(perfiles)
    .where(eq(perfiles.activo, 1))
    .orderBy(perfiles.nombre);
}
