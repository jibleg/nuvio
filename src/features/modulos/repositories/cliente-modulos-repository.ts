import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clienteModulos } from "@/lib/db/schema";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Claves de módulo que un cliente (tenant) tiene licenciadas. */
export async function findModuloKeysByCliente(idCliente: number): Promise<string[]> {
  const rows = await db
    .select({ key: clienteModulos.moduloKey })
    .from(clienteModulos)
    .where(eq(clienteModulos.idCliente, idCliente));
  return rows.map((row) => row.key);
}

/** Reemplaza el conjunto de módulos licenciados por un cliente (usar dentro de una transacción). */
export async function replaceModulosForCliente(
  tx: DbTransaction,
  idCliente: number,
  moduloKeys: string[],
): Promise<void> {
  await tx.delete(clienteModulos).where(eq(clienteModulos.idCliente, idCliente));
  if (moduloKeys.length === 0) return;
  await tx
    .insert(clienteModulos)
    .values(moduloKeys.map((moduloKey) => ({ idCliente, moduloKey })));
}
