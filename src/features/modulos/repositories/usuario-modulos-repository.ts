import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { usuarioModulos } from "@/lib/db/schema";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Claves de módulo a las que el usuario está asociado. */
export async function findModuloKeysByUsuario(
  usuarioId: number,
): Promise<string[]> {
  const rows = await db
    .select({ key: usuarioModulos.moduloKey })
    .from(usuarioModulos)
    .where(eq(usuarioModulos.idUsuario, usuarioId));
  return rows.map((row) => row.key);
}

export async function usuarioTieneModulo(
  usuarioId: number,
  moduloKey: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: usuarioModulos.id })
    .from(usuarioModulos)
    .where(
      and(
        eq(usuarioModulos.idUsuario, usuarioId),
        eq(usuarioModulos.moduloKey, moduloKey),
      ),
    )
    .limit(1);
  return Boolean(row);
}

/** Reemplaza el conjunto de módulos del usuario (usar dentro de una transacción). */
export async function replaceModulosForUsuario(
  tx: DbTransaction,
  usuarioId: number,
  moduloKeys: string[],
): Promise<void> {
  await tx.delete(usuarioModulos).where(eq(usuarioModulos.idUsuario, usuarioId));
  if (moduloKeys.length === 0) return;
  await tx.insert(usuarioModulos).values(
    moduloKeys.map((moduloKey) => ({ idUsuario: usuarioId, moduloKey })),
  );
}
