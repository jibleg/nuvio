import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { empresas, usuarioEmpresas } from "@/lib/db/schema";
import type { Empresa } from "../types";

const empresaColumns = {
  id: empresas.id,
  nombreComercial: empresas.nombreComercial,
  nombreCorto: empresas.nombreCorto,
  rfc: empresas.rfc,
  activo: empresas.activo,
  idEmpresaMatriz: empresas.idEmpresaMatriz,
};

/** Filas de tipo "empresa propia" (matriz/sucursal); excluye contactos de facturación (tipo=2, ver `@/features/contactos-facturacion`). */
const esEmpresaPropia = eq(empresas.tipo, 1);

/** Empresas a las que un usuario tiene acceso (según `usuario_empresas`). */
export async function findEmpresasByUsuario(
  usuarioId: number,
): Promise<Empresa[]> {
  return db
    .select(empresaColumns)
    .from(usuarioEmpresas)
    .innerJoin(empresas, eq(empresas.id, usuarioEmpresas.idEmpresa))
    .where(and(eq(usuarioEmpresas.idUsuario, usuarioId), esEmpresaPropia));
}

/** Empresas activas de un cliente (para asignación en administración). */
export async function findAllEmpresas(idCliente: number): Promise<Empresa[]> {
  return db
    .select(empresaColumns)
    .from(empresas)
    .where(and(eq(empresas.activo, 1), eq(empresas.idCliente, idCliente), esEmpresaPropia))
    .orderBy(empresas.nombreComercial);
}

/** Verifica que un usuario tenga acceso a una empresa concreta. */
export async function usuarioTieneAccesoAEmpresa(
  usuarioId: number,
  empresaId: number,
): Promise<boolean> {
  const [row] = await db
    .select({ id: usuarioEmpresas.id })
    .from(usuarioEmpresas)
    .where(
      and(
        eq(usuarioEmpresas.idUsuario, usuarioId),
        eq(usuarioEmpresas.idEmpresa, empresaId),
      ),
    )
    .limit(1);

  return Boolean(row);
}
