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
import { eliminarBorradorPago } from "./repositories/pagos-repository";
import { getEmisoresList, getFacturaById, getFacturasPorPagar, getPagoById, getPagosList, getSaldoPendienteFactura } from "./queries";
import { actualizarBorradorUseCase } from "./use-cases/actualizar-borrador";
import { cancelarFacturaUseCase } from "./use-cases/cancelar-factura";
import { cancelarPagoUseCase } from "./use-cases/cancelar-pago";
import { crearBorradorUseCase } from "./use-cases/crear-borrador";
import { crearBorradorPagoUseCase } from "./use-cases/crear-borrador-pago";
import { enviarFacturaCorreoUseCase } from "./use-cases/enviar-factura-correo";
import { recurrirFacturaUseCase } from "./use-cases/recurrir-factura";
import { refacturarUseCase } from "./use-cases/refacturar";
import { verificarEstatusCancelacionUseCase } from "./use-cases/verificar-estatus-cancelacion";
import { timbrarFacturaUseCase } from "./use-cases/timbrar-factura";
import { timbrarPagoUseCase } from "./use-cases/timbrar-pago";
import type { EmisorListItem } from "./repositories/emisor-repository";
import type {
  CancelarResult,
  CrearBorradorPagoResult,
  DatosPago,
  DocumentoAPagar,
  FacturaDetalle,
  FacturaMutationResult,
  FacturaPorPagar,
  PagoDetalle,
  PagoListItem,
} from "./types";

const VIEW = "facturas.consulta";
const MANAGE = "facturas.write";

export type FacturaActionResult = { error: string };

/** El home del módulo (dashboard) y el listado viven en rutas distintas; una mutación de factura afecta a ambas. */
function revalidarFacturacion(): void {
  revalidatePath(ROUTES.facturacion);
  revalidatePath(`${ROUTES.facturacion}/consultar`);
}

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

  revalidarFacturacion();
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

  revalidarFacturacion();
}

export async function eliminarBorradorAction(id: number): Promise<FacturaActionResult | void> {
  const session = await requirePermission(MANAGE);
  await eliminarBorrador(id, session.cliente.id);
  revalidarFacturacion();
}

export async function timbrarFacturaAction(id: number): Promise<FacturaActionResult | void> {
  const session = await requirePermission(MANAGE);

  const result = await timbrarFacturaUseCase(id, session.cliente.id, session.cliente.ambienteTimbrado);
  if (!result.ok) return { error: result.error };

  revalidarFacturacion();
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

  const result = await cancelarFacturaUseCase(id, session.cliente.id, motivo, folioSustitucion);
  if (result.ok) revalidarFacturacion();
  return result;
}

/** Re-consulta al SAT el estatus de una cancelación "en proceso" (sin volver a solicitarla) — ver `verificar-estatus-cancelacion.ts`. Sirve igual para facturas y complementos de pago. */
export async function verificarEstatusCancelacionAction(id: number): Promise<CancelarResult> {
  const session = await requirePermission(MANAGE);

  const result = await verificarEstatusCancelacionUseCase(id, session.cliente.id);
  if (result.ok) revalidarFacturacion();
  return result;
}

/** Correo capturado del cliente, para prellenar el modal de envío (editable antes de mandar). */
export async function getEmailReceptorAction(idFactura: number): Promise<string | null> {
  const session = await requirePermission(VIEW);
  return getEmailReceptorActual(idFactura, session.cliente.id);
}

export async function enviarFacturaCorreoAction(id: number, correos: string[]): Promise<EnviarCorreoResult> {
  const session = await requirePermission(MANAGE);
  return enviarFacturaCorreoUseCase(id, session.cliente.id, session.cliente.slug, correos);
}

export async function getSaldoPendienteAction(idFactura: number): Promise<number | null> {
  const session = await requirePermission(VIEW);
  return getSaldoPendienteFactura(idFactura, session.cliente.id);
}

export async function refacturarAction(idFacturaOriginal: number): Promise<FacturaMutationResult> {
  const session = await requirePermission(MANAGE);
  const result = await refacturarUseCase(idFacturaOriginal, session.cliente.id, session.usuario.id);
  if (result.ok) revalidarFacturacion();
  return result;
}

/** Crea un borrador nuevo e independiente (sin relación CFDI) a partir de una factura vigente — para servicios recurrentes que se facturan periodo a periodo. Ver `recurrir-factura.ts`. */
export async function recurrirFacturaAction(idFacturaOriginal: number): Promise<FacturaMutationResult> {
  const session = await requirePermission(MANAGE);
  const result = await recurrirFacturaUseCase(idFacturaOriginal, session.cliente.id, session.usuario.id);
  if (result.ok) revalidarFacturacion();
  return result;
}

// ---- Complementos de pago ----

export async function listPagosAction(): Promise<PagoListItem[]> {
  const session = await requirePermission(VIEW);
  return getPagosList(session.cliente.id);
}

export async function getPagoDetalleAction(id: number): Promise<PagoDetalle | null> {
  const session = await requirePermission(VIEW);
  return getPagoById(id, session.cliente.id);
}

export async function listFacturasPorPagarAction(idContactoFacturacion?: number): Promise<FacturaPorPagar[]> {
  const session = await requirePermission(VIEW);
  return getFacturasPorPagar(session.cliente.id, idContactoFacturacion);
}

export async function crearBorradorPagoAction(
  documentos: DocumentoAPagar[],
  datosPago: DatosPago,
): Promise<CrearBorradorPagoResult> {
  const session = await requirePermission(MANAGE);
  const result = await crearBorradorPagoUseCase(session.usuario.id, session.cliente.id, documentos, datosPago);
  if (result.ok) {
    revalidatePath(`${ROUTES.facturacion}/pagos`);
    revalidarFacturacion();
  }
  return result;
}

export async function eliminarBorradorPagoAction(id: number): Promise<void> {
  const session = await requirePermission(MANAGE);
  await eliminarBorradorPago(id, session.cliente.id);
  revalidatePath(`${ROUTES.facturacion}/pagos`);
  revalidarFacturacion();
}

export async function timbrarPagoAction(id: number): Promise<FacturaActionResult | void> {
  const session = await requirePermission(MANAGE);
  const result = await timbrarPagoUseCase(id, session.cliente.id, session.cliente.ambienteTimbrado);
  if (!result.ok) return { error: result.error };
  revalidatePath(`${ROUTES.facturacion}/pagos`);
  revalidarFacturacion();
}

export async function cancelarPagoAction(id: number, motivo: CodigoMotivo): Promise<CancelarResult> {
  const session = await requirePermission(MANAGE);
  const result = await cancelarPagoUseCase(id, session.cliente.id, motivo);
  if (result.ok) {
    revalidatePath(`${ROUTES.facturacion}/pagos`);
    revalidarFacturacion();
  }
  return result;
}
