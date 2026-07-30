import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { empresas } from "@/lib/db/schema";
import type { SucursalDetalle, SucursalFormData, SucursalListItem, UpdateSucursalData } from "../types";

const listColumns = {
  id: empresas.id,
  nombreComercial: empresas.nombreComercial,
  nombreCorto: empresas.nombreCorto,
  idEmpresaMatriz: empresas.idEmpresaMatriz,
  calle: empresas.calle,
  colonia: empresas.colonia,
  ciudad: empresas.ciudad,
  codigoPostal: empresas.codigoPostal,
  telefono: empresas.telefono,
  email: empresas.email,
  activo: empresas.activo,
};

type ListRow = {
  id: number;
  nombreComercial: string;
  nombreCorto: string | null;
  idEmpresaMatriz: number | null;
  calle: string | null;
  colonia: string | null;
  ciudad: string | null;
  codigoPostal: number | null;
  telefono: string | null;
  email: string | null;
  activo: number | null;
};

function toListItem(row: ListRow): SucursalListItem {
  return {
    id: row.id,
    nombreComercial: row.nombreComercial,
    nombreCorto: row.nombreCorto,
    esMatriz: row.idEmpresaMatriz === null,
    calle: row.calle,
    colonia: row.colonia,
    ciudad: row.ciudad,
    codigoPostal: row.codigoPostal,
    telefono: row.telefono,
    email: row.email,
    activo: row.activo !== 0,
  };
}

/** La matriz del cliente: la única fila con `idEmpresaMatriz IS NULL`. */
export async function findMatriz(
  idCliente: number,
): Promise<{ id: number; nombreComercial: string; rfc: string | null; razonSocial: string | null } | null> {
  const [row] = await db
    .select({
      id: empresas.id,
      nombreComercial: empresas.nombreComercial,
      rfc: empresas.rfc,
      razonSocial: empresas.razonSocial,
    })
    .from(empresas)
    .where(and(eq(empresas.idCliente, idCliente), isNull(empresas.idEmpresaMatriz)))
    .limit(1);
  return row ?? null;
}

/** Matriz + sucursales del cliente, matriz primero. */
export async function listSucursales(idCliente: number): Promise<SucursalListItem[]> {
  const rows = await db
    .select(listColumns)
    .from(empresas)
    .where(eq(empresas.idCliente, idCliente))
    .orderBy(asc(empresas.idEmpresaMatriz), asc(empresas.nombreComercial));
  return rows.map(toListItem);
}

export async function getSucursalDetalle(
  id: number,
  idCliente: number,
): Promise<SucursalDetalle | null> {
  const [row] = await db
    .select({ ...listColumns, rfc: empresas.rfc, razonSocial: empresas.razonSocial })
    .from(empresas)
    .where(and(eq(empresas.id, id), eq(empresas.idCliente, idCliente)))
    .limit(1);
  if (!row) return null;
  return { ...toListItem(row), rfc: row.rfc, razonSocial: row.razonSocial };
}

/** Total de empresas (matriz + sucursales) del cliente, para el tope del plan. */
export async function countEmpresas(idCliente: number): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(empresas)
    .where(eq(empresas.idCliente, idCliente));
  return row?.total ?? 0;
}

export async function createSucursal(data: {
  idCliente: number;
  idEmpresaMatriz: number;
  rfc: string | null;
  razonSocial: string | null;
  form: SucursalFormData;
}): Promise<number> {
  const [{ maxId }] = await db
    .select({ maxId: sql<number>`coalesce(max(${empresas.id}), 0)::int` })
    .from(empresas);
  const id = maxId + 1;

  await db.insert(empresas).values({
    id,
    idCliente: data.idCliente,
    idEmpresaMatriz: data.idEmpresaMatriz,
    nombreComercial: data.form.nombreComercial,
    descripcion: data.form.nombreComercial,
    nombreCorto: data.form.nombreCorto,
    calle: data.form.calle,
    colonia: data.form.colonia,
    ciudad: data.form.ciudad,
    codigoPostal: data.form.codigoPostal,
    telefono: data.form.telefono,
    email: data.form.email,
    rfc: data.rfc,
    razonSocial: data.razonSocial,
    activo: 1,
  });
  return id;
}

export async function updateSucursal(
  id: number,
  idCliente: number,
  data: UpdateSucursalData,
): Promise<void> {
  await db
    .update(empresas)
    .set({
      nombreComercial: data.nombreComercial,
      descripcion: data.nombreComercial,
      nombreCorto: data.nombreCorto,
      calle: data.calle,
      colonia: data.colonia,
      ciudad: data.ciudad,
      codigoPostal: data.codigoPostal,
      telefono: data.telefono,
      email: data.email,
      activo: data.activo ? 1 : 0,
    })
    .where(and(eq(empresas.id, id), eq(empresas.idCliente, idCliente)));
}

/** No permite desactivar la matriz (idEmpresaMatriz IS NULL): su ciclo de vida lo gobierna superadmin. */
export async function setActivo(id: number, idCliente: number, activo: boolean): Promise<void> {
  await db
    .update(empresas)
    .set({ activo: activo ? 1 : 0 })
    .where(
      and(
        eq(empresas.id, id),
        eq(empresas.idCliente, idCliente),
        sql`${empresas.idEmpresaMatriz} is not null`,
      ),
    );
}
