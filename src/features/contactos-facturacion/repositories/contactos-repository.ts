import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contactosFacturacion } from "@/lib/db/schema";
import type {
  ContactoDetalle,
  ContactoFormData,
  ContactoListItem,
  TipoContacto,
  UpdateContactoData,
} from "../types";

function toTipo(valor: number): TipoContacto {
  return valor === 2 ? "proveedor" : "cliente";
}

function toTipoValor(tipo: TipoContacto): number {
  return tipo === "proveedor" ? 2 : 1;
}

const listColumns = {
  id: contactosFacturacion.id,
  tipo: contactosFacturacion.tipo,
  razonSocial: contactosFacturacion.razonSocial,
  rfc: contactosFacturacion.rfc,
  nombreComercial: contactosFacturacion.nombreComercial,
  ciudad: contactosFacturacion.ciudad,
  telefono: contactosFacturacion.telefono,
  email: contactosFacturacion.email,
  activo: contactosFacturacion.activo,
  idRegimen: contactosFacturacion.idRegimen,
  idUso: contactosFacturacion.idUso,
  idFormaPago: contactosFacturacion.idFormaPago,
  idMetodo: contactosFacturacion.idMetodo,
};

type ListRow = {
  id: number;
  tipo: number;
  razonSocial: string;
  rfc: string;
  nombreComercial: string | null;
  ciudad: string | null;
  telefono: string | null;
  email: string | null;
  activo: number;
  idRegimen: number | null;
  idUso: number | null;
  idFormaPago: number | null;
  idMetodo: number | null;
};

function toListItem(row: ListRow): ContactoListItem {
  return {
    id: row.id,
    tipo: toTipo(row.tipo),
    razonSocial: row.razonSocial,
    rfc: row.rfc,
    nombreComercial: row.nombreComercial,
    ciudad: row.ciudad,
    telefono: row.telefono,
    email: row.email,
    activo: row.activo !== 0,
    idRegimen: row.idRegimen,
    idUso: row.idUso,
    idFormaPago: row.idFormaPago,
    idMetodo: row.idMetodo,
  };
}

export async function listContactos(idCliente: number): Promise<ContactoListItem[]> {
  const rows = await db
    .select(listColumns)
    .from(contactosFacturacion)
    .where(eq(contactosFacturacion.idCliente, idCliente))
    .orderBy(asc(contactosFacturacion.tipo), asc(contactosFacturacion.razonSocial));
  return rows.map(toListItem);
}

export async function getContactoDetalle(
  id: number,
  idCliente: number,
): Promise<ContactoDetalle | null> {
  const [row] = await db
    .select({
      ...listColumns,
      calle: contactosFacturacion.calle,
      colonia: contactosFacturacion.colonia,
      codigoPostal: contactosFacturacion.codigoPostal,
    })
    .from(contactosFacturacion)
    .where(and(eq(contactosFacturacion.id, id), eq(contactosFacturacion.idCliente, idCliente)))
    .limit(1);
  if (!row) return null;
  return {
    ...toListItem(row),
    calle: row.calle,
    colonia: row.colonia,
    codigoPostal: row.codigoPostal,
  };
}

export async function createContacto(idCliente: number, form: ContactoFormData): Promise<number> {
  const [{ id }] = await db
    .insert(contactosFacturacion)
    .values({
      idCliente,
      tipo: toTipoValor(form.tipo),
      razonSocial: form.razonSocial,
      rfc: form.rfc,
      nombreComercial: form.nombreComercial,
      calle: form.calle,
      colonia: form.colonia,
      ciudad: form.ciudad,
      codigoPostal: form.codigoPostal,
      telefono: form.telefono,
      email: form.email,
      idRegimen: form.idRegimen,
      idUso: form.idUso,
      idFormaPago: form.idFormaPago,
      idMetodo: form.idMetodo,
      activo: 1,
    })
    .returning({ id: contactosFacturacion.id });
  return id;
}

export async function updateContacto(
  id: number,
  idCliente: number,
  data: UpdateContactoData,
): Promise<void> {
  await db
    .update(contactosFacturacion)
    .set({
      tipo: toTipoValor(data.tipo),
      razonSocial: data.razonSocial,
      rfc: data.rfc,
      nombreComercial: data.nombreComercial,
      calle: data.calle,
      colonia: data.colonia,
      ciudad: data.ciudad,
      codigoPostal: data.codigoPostal,
      telefono: data.telefono,
      email: data.email,
      idRegimen: data.idRegimen,
      idUso: data.idUso,
      idFormaPago: data.idFormaPago,
      idMetodo: data.idMetodo,
      activo: data.activo ? 1 : 0,
    })
    .where(and(eq(contactosFacturacion.id, id), eq(contactosFacturacion.idCliente, idCliente)));
}

export async function setActivo(id: number, idCliente: number, activo: boolean): Promise<void> {
  await db
    .update(contactosFacturacion)
    .set({ activo: activo ? 1 : 0 })
    .where(and(eq(contactosFacturacion.id, id), eq(contactosFacturacion.idCliente, idCliente)));
}
