"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/config/routes";
import { requirePermission } from "@/features/auth";
import {
  listFormasPago,
  listMetodosPago,
  listRegimenesFiscales,
  listUsosCfdi,
  type CatalogoItem,
  type MetodoPagoItem,
} from "@/lib/cfdi/catalogos";
import {
  contactoFormSchema,
  updateContactoSchema,
  type ContactoFormInput,
  type UpdateContactoInput,
} from "./schemas";
import { getContactoById } from "./queries";
import { createContactoUseCase } from "./use-cases/create-contacto";
import { updateContactoUseCase } from "./use-cases/update-contacto";
import { setActivo } from "./repositories/contactos-repository";
import type { ContactoDetalle } from "./types";

/**
 * Reutiliza los permisos legados `catalogos.clientes`/`clientes.write`
 * (heredados de factura-facil, sin usar hasta ahora) para todo el
 * directorio de clientes Y proveedores de facturación.
 */
const VIEW = "catalogos.clientes";
const MANAGE = "clientes.write";

export type ContactoActionResult = { error: string };

/** Carga el detalle de un contacto para el formulario de edición (modal). */
export async function getContactoDetalleAction(id: number): Promise<ContactoDetalle | null> {
  const session = await requirePermission(VIEW);
  return getContactoById(id, session.cliente.id);
}

export type CatalogosContacto = {
  regimenes: CatalogoItem[];
  usos: CatalogoItem[];
  formasPago: CatalogoItem[];
  metodosPago: MetodoPagoItem[];
};

/** Catálogos para la pestaña "Información de facturación" del contacto. */
export async function listCatalogosContactoAction(): Promise<CatalogosContacto> {
  await requirePermission(VIEW);
  const [regimenes, usos, formasPago, metodosPago] = await Promise.all([
    listRegimenesFiscales(),
    listUsosCfdi(),
    listFormasPago(),
    listMetodosPago(),
  ]);
  return { regimenes, usos, formasPago, metodosPago };
}

export async function createContactoAction(
  input: ContactoFormInput,
): Promise<ContactoActionResult | { id: number }> {
  const session = await requirePermission(MANAGE);

  const parsed = contactoFormSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los datos del formulario." };

  const result = await createContactoUseCase(parsed.data, session.cliente.id);
  if (!result.ok) return { error: result.error };

  revalidatePath(ROUTES.clientesProveedores);
  return { id: result.id! };
}

export async function updateContactoAction(
  id: number,
  input: UpdateContactoInput,
): Promise<ContactoActionResult | void> {
  const session = await requirePermission(MANAGE);

  const parsed = updateContactoSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los datos del formulario." };

  const result = await updateContactoUseCase(id, parsed.data, session.cliente.id);
  if (!result.ok) return { error: result.error };

  revalidatePath(ROUTES.clientesProveedores);
}

export async function setContactoActivoAction(
  id: number,
  activo: boolean,
): Promise<ContactoActionResult | void> {
  const session = await requirePermission(MANAGE);

  await setActivo(id, session.cliente.id, activo);
  revalidatePath(ROUTES.clientesProveedores);
}
