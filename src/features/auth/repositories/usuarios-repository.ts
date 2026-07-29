import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { usuarios } from "@/lib/db/schema";

export type UsuarioRow = typeof usuarios.$inferSelect;

/** Usuario por su login (identificador de acceso). */
export async function findUsuarioByLogin(
  login: string,
): Promise<UsuarioRow | null> {
  const [row] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.login, login))
    .limit(1);

  return row ?? null;
}
