import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { clientes } from "@/lib/db/schema";
import type { PlanKey } from "@/config/plans";

export type Cliente = {
  id: number;
  slug: string;
  nombre: string;
  plan: PlanKey;
  /** Gate de Finkok: nace en 'sandbox', solo Nuvio (superadmin) lo pasa a 'produccion'. */
  ambienteTimbrado: "sandbox" | "produccion";
};

/** Cliente activo por su slug (subdominio). Devuelve null si no existe o está inactivo. */
export async function findClienteBySlug(slug: string): Promise<Cliente | null> {
  const [row] = await db
    .select({
      id: clientes.id,
      slug: clientes.slug,
      nombre: clientes.nombre,
      plan: clientes.plan,
      ambienteTimbrado: clientes.ambienteTimbrado,
    })
    .from(clientes)
    .where(and(eq(sql`lower(${clientes.slug})`, slug.toLowerCase()), eq(clientes.activo, 1)))
    .limit(1);

  return row
    ? { ...row, plan: row.plan as PlanKey, ambienteTimbrado: row.ambienteTimbrado as "sandbox" | "produccion" }
    : null;
}
