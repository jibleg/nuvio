import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { usuarios } from "@/lib/db/schema";

export type UsuarioRow = typeof usuarios.$inferSelect;

/**
 * Usuario por su email DENTRO de un cliente (tenant). El email es único por
 * cliente, así que la búsqueda siempre va acotada por `idCliente`.
 */
export async function findUsuarioByEmail(
  email: string,
  idCliente: number,
): Promise<UsuarioRow | null> {
  const [row] = await db
    .select()
    .from(usuarios)
    .where(
      and(
        eq(usuarios.idCliente, idCliente),
        eq(sql`lower(${usuarios.email})`, email.toLowerCase()),
      ),
    )
    .limit(1);

  return row ?? null;
}
