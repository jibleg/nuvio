import { alias } from "drizzle-orm/pg-core";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { empresas } from "@/lib/db/schema";
import type { AmbienteFacturacion, SucursalDetalle, SucursalFormData, SucursalListItem, UpdateSucursalData } from "../types";

const listColumns = {
  id: empresas.id,
  nombreComercial: empresas.nombreComercial,
  nombreCorto: empresas.nombreCorto,
  idEmpresaMatriz: empresas.idEmpresaMatriz,
  rfc: empresas.rfc,
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
  rfc: string | null;
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
    esFiscalPropio: row.rfc !== null,
    calle: row.calle,
    colonia: row.colonia,
    ciudad: row.ciudad,
    codigoPostal: row.codigoPostal,
    telefono: row.telefono,
    email: row.email,
    activo: row.activo !== 0,
  };
}

/** Filas de tipo "empresa propia" (matriz/sucursal); excluye contactos de facturación (tipo=2, ver `@/features/contactos-facturacion`). */
const esEmpresaPropia = eq(empresas.tipo, 1);

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
    .where(and(eq(empresas.idCliente, idCliente), isNull(empresas.idEmpresaMatriz), esEmpresaPropia))
    .limit(1);
  return row ?? null;
}

/** Matriz + sucursales del cliente, matriz primero. */
export async function listSucursales(idCliente: number): Promise<SucursalListItem[]> {
  const rows = await db
    .select(listColumns)
    .from(empresas)
    .where(and(eq(empresas.idCliente, idCliente), esEmpresaPropia))
    .orderBy(asc(empresas.idEmpresaMatriz), asc(empresas.nombreComercial));
  return rows.map(toListItem);
}

const matrizAlias = alias(empresas, "matriz");

export async function getSucursalDetalle(
  id: number,
  idCliente: number,
): Promise<SucursalDetalle | null> {
  const [row] = await db
    .select({
      ...listColumns,
      razonSocial: empresas.razonSocial,
      idRegimen: empresas.idRegimen,
      ambienteTimbrado: empresas.ambienteTimbrado,
      matrizRfc: matrizAlias.rfc,
      matrizRazonSocial: matrizAlias.razonSocial,
      matrizIdRegimen: matrizAlias.idRegimen,
    })
    .from(empresas)
    .leftJoin(matrizAlias, eq(empresas.idEmpresaMatriz, matrizAlias.id))
    .where(and(eq(empresas.id, id), eq(empresas.idCliente, idCliente), esEmpresaPropia))
    .limit(1);
  if (!row) return null;
  return {
    ...toListItem(row),
    rfcPropio: row.rfc,
    razonSocialPropia: row.razonSocial,
    idRegimenPropio: row.idRegimen,
    rfcEfectivo: row.rfc ?? row.matrizRfc,
    razonSocialEfectiva: row.razonSocial ?? row.matrizRazonSocial,
    idRegimenEfectivo: row.idRegimen ?? row.matrizIdRegimen,
    ambienteTimbrado: row.ambienteTimbrado === "produccion" ? "produccion" : "sandbox",
  };
}

/** Cambia el ambiente de Finkok con el que factura esta empresa (matriz o sucursal); el gate de cuenta se valida en la acción. */
export async function setAmbienteTimbrado(
  id: number,
  idCliente: number,
  ambiente: AmbienteFacturacion,
): Promise<void> {
  await db
    .update(empresas)
    .set({ ambienteTimbrado: ambiente })
    .where(and(eq(empresas.id, id), eq(empresas.idCliente, idCliente), esEmpresaPropia));
}

/** Total de empresas (matriz + sucursales) del cliente, para el tope del plan. */
export async function countEmpresas(idCliente: number): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(empresas)
    .where(and(eq(empresas.idCliente, idCliente), esEmpresaPropia));
  return row?.total ?? 0;
}

export async function createSucursal(data: {
  idCliente: number;
  idEmpresaMatriz: number;
  rfc: string | null;
  razonSocial: string | null;
  idRegimen: number | null;
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
    idRegimen: data.idRegimen,
    activo: 1,
    tipo: 1,
  });
  return id;
}

/**
 * Escribe los datos ya resueltos por `updateSucursalUseCase`: `rfc`/`razonSocial`
 * son el valor final a guardar (dato propio o `null` para heredar de la matriz),
 * no los campos crudos del form. La matriz siempre llega aquí con valores no
 * nulos porque el use-case los exige antes de llamar a este repositorio.
 */
export async function updateSucursal(
  id: number,
  idCliente: number,
  data: Omit<UpdateSucursalData, "usaFiscalPropio" | "razonSocialPropia" | "rfcPropio"> & {
    rfc: string | null;
    razonSocial: string | null;
  },
): Promise<void> {
  await db
    .update(empresas)
    .set({
      nombreComercial: data.nombreComercial,
      descripcion: data.nombreComercial,
      nombreCorto: data.nombreCorto,
      rfc: data.rfc,
      razonSocial: data.razonSocial,
      idRegimen: data.idRegimen,
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
        esEmpresaPropia,
      ),
    );
}

/** Metadatos del logo (sin el binario) — para la UI de subida, no para servirlo. */
export async function getLogoMeta(
  id: number,
  idCliente: number,
): Promise<{ tieneLogo: boolean; nombre: string | null } | null> {
  const [row] = await db
    .select({ logoMime: empresas.logoMime, logoNombre: empresas.logoNombre })
    .from(empresas)
    .where(and(eq(empresas.id, id), eq(empresas.idCliente, idCliente), esEmpresaPropia))
    .limit(1);
  if (!row) return null;
  return { tieneLogo: row.logoMime !== null, nombre: row.logoNombre };
}

/** Binario + mime del logo, para servirlo por HTTP (preview y hero del PDF). */
export async function getLogoBytes(
  id: number,
  idCliente: number,
): Promise<{ data: Buffer; mimeType: string } | null> {
  const [row] = await db
    .select({ logo: empresas.logo, logoMime: empresas.logoMime })
    .from(empresas)
    .where(and(eq(empresas.id, id), eq(empresas.idCliente, idCliente), esEmpresaPropia))
    .limit(1);
  if (!row?.logo || !row.logoMime) return null;
  return { data: row.logo, mimeType: row.logoMime };
}

export async function setLogo(
  id: number,
  idCliente: number,
  logo: { data: Buffer; mimeType: string; nombre: string },
): Promise<void> {
  await db
    .update(empresas)
    .set({ logo: logo.data, logoMime: logo.mimeType, logoNombre: logo.nombre })
    .where(and(eq(empresas.id, id), eq(empresas.idCliente, idCliente), esEmpresaPropia));
}
