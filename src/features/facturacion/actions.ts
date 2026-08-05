"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/config/routes";
import { requirePermission } from "@/features/auth";
import { getContactosList } from "@/features/contactos-facturacion";
import type { ContactoListItem } from "@/features/contactos-facturacion";
import {
  buscarClaveProdServ,
  buscarClaveUnidad,
  listFormasPago,
  listMetodosPago,
  listMonedas,
  listMotivosCancelacion,
  listUsosCfdi,
  type CatalogoItem,
  type MetodoPagoItem,
} from "@/lib/cfdi/catalogos";
import type { CodigoMotivo } from "@/lib/finkok/cancel-soap";
import type { EnviarCorreoResult } from "@/lib/email/sparkpost";
import { borradorFormSchema, type BorradorFormInput } from "./schemas";
import { eliminarBorrador, getEmailReceptorActual } from "./repositories/facturas-repository";
import { getEmisoresList, getFacturaById } from "./queries";
import { actualizarBorradorUseCase } from "./use-cases/actualizar-borrador";
import { cancelarFacturaUseCase } from "./use-cases/cancelar-factura";
import { crearBorradorUseCase } from "./use-cases/crear-borrador";
import { enviarFacturaCorreoUseCase } from "./use-cases/enviar-factura-correo";
import { timbrarFacturaUseCase } from "./use-cases/timbrar-factura";
import type { EmisorListItem } from "./repositories/emisor-repository";
import type { CancelarResult, FacturaDetalle } from "./types";

const VIEW = "facturas.consulta";
const MANAGE = "facturas.write";

export type FacturaActionResult = { error: string };

export async function getFacturaDetalleAction(id: number): Promise<FacturaDetalle | null> {
  const session = await requirePermission(VIEW);
  return getFacturaById(id, session.cliente.id);
}

export async function listEmisoresAction(): Promise<EmisorListItem[]> {
  const session = await requirePermission(VIEW);
  return getEmisoresList(session.cliente.id);
}

export async function listClientesFacturablesAction(): Promise<ContactoListItem[]> {
  const session = await requirePermission(VIEW);
  const contactos = await getContactosList(session.cliente.id);
  return contactos.filter((c) => c.tipo === "cliente" && c.activo);
}

export type CatalogosFactura = {
  usos: CatalogoItem[];
  formasPago: CatalogoItem[];
  metodosPago: MetodoPagoItem[];
  monedas: CatalogoItem[];
};

export async function listCatalogosFacturaAction(): Promise<CatalogosFactura> {
  await requirePermission(VIEW);
  const [usos, formasPago, metodosPago, monedas] = await Promise.all([
    listUsosCfdi(),
    listFormasPago(),
    listMetodosPago(),
    listMonedas(),
  ]);
  return { usos, formasPago, metodosPago, monedas };
}

export async function buscarClaveProdServAction(query: string): Promise<CatalogoItem[]> {
  await requirePermission(VIEW);
  return buscarClaveProdServ(query);
}

export async function buscarClaveUnidadAction(query: string): Promise<CatalogoItem[]> {
  await requirePermission(VIEW);
  return buscarClaveUnidad(query);
}

export async function crearBorradorAction(input: BorradorFormInput): Promise<FacturaActionResult & { id?: number }> {
  const session = await requirePermission(MANAGE);

  const parsed = borradorFormSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los datos del formulario." };

  const result = await crearBorradorUseCase(session.cliente.id, session.usuario.id, parsed.data);
  if (!result.ok) return { error: result.error };

  revalidatePath(ROUTES.facturacion);
  return { error: "", id: result.id };
}

export async function actualizarBorradorAction(
  id: number,
  input: BorradorFormInput,
): Promise<FacturaActionResult | void> {
  const session = await requirePermission(MANAGE);

  const parsed = borradorFormSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los datos del formulario." };

  const result = await actualizarBorradorUseCase(id, session.cliente.id, parsed.data);
  if (!result.ok) return { error: result.error };

  revalidatePath(ROUTES.facturacion);
}

export async function eliminarBorradorAction(id: number): Promise<FacturaActionResult | void> {
  const session = await requirePermission(MANAGE);
  await eliminarBorrador(id, session.cliente.id);
  revalidatePath(ROUTES.facturacion);
}

export async function timbrarFacturaAction(id: number): Promise<FacturaActionResult | void> {
  const session = await requirePermission(MANAGE);

  const result = await timbrarFacturaUseCase(id, session.cliente.id, session.cliente.ambienteTimbrado);
  if (!result.ok) return { error: result.error };

  revalidatePath(ROUTES.facturacion);
}

export async function listMotivosCancelacionAction(): Promise<CatalogoItem[]> {
  await requirePermission(VIEW);
  return listMotivosCancelacion();
}

export async function cancelarFacturaAction(
  id: number,
  motivo: CodigoMotivo,
  folioSustitucion: string | null,
): Promise<CancelarResult> {
  const session = await requirePermission(MANAGE);

  const result = await cancelarFacturaUseCase(id, session.cliente.id, session.cliente.ambienteTimbrado, motivo, folioSustitucion);
  if (result.ok) revalidatePath(ROUTES.facturacion);
  return result;
}

/** Correo capturado del cliente, para prellenar el modal de envío (editable antes de mandar). */
export async function getEmailReceptorAction(idFactura: number): Promise<string | null> {
  const session = await requirePermission(VIEW);
  return getEmailReceptorActual(idFactura, session.cliente.id);
}

export async function enviarFacturaCorreoAction(id: number, correo: string): Promise<EnviarCorreoResult> {
  const session = await requirePermission(MANAGE);
  return enviarFacturaCorreoUseCase(id, session.cliente.id, correo);
}
