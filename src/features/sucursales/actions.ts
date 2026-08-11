"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/config/routes";
import { requirePermission } from "@/features/auth";
import { listRegimenesFiscales, type CatalogoItem } from "@/lib/cfdi/catalogos";
import { sucursalFormSchema, updateSucursalSchema, type SucursalFormInput, type UpdateSucursalInput } from "./schemas";
import { getSucursalById } from "./queries";
import { createSucursalUseCase } from "./use-cases/create-sucursal";
import { updateSucursalUseCase } from "./use-cases/update-sucursal";
import { getLogoMeta, setActivo, setAmbienteTimbrado, setLogo } from "./repositories/sucursales-repository";
import type { AmbienteFacturacion, LogoDetalle, LogoMutationResult, SucursalDetalle } from "./types";

const VIEW = "empresas.acceso";
const MANAGE = "empresas.write";

const TIPOS_LOGO_PERMITIDOS = new Set(["image/png", "image/jpeg"]);
const TAMANO_MAXIMO_LOGO = 2 * 1024 * 1024;

export type SucursalActionResult = { error: string };

/** Carga el detalle de una sucursal para el formulario de edición (modal). */
export async function getSucursalDetalleAction(id: number): Promise<SucursalDetalle | null> {
  const session = await requirePermission(VIEW);
  return getSucursalById(id, session.cliente.id);
}

export async function listRegimenesFiscalesAction(): Promise<CatalogoItem[]> {
  await requirePermission(VIEW);
  return listRegimenesFiscales();
}

export async function createSucursalAction(
  input: SucursalFormInput,
): Promise<SucursalActionResult | void> {
  const session = await requirePermission(MANAGE);

  const parsed = sucursalFormSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los datos del formulario." };

  const result = await createSucursalUseCase(parsed.data, session.cliente.id, session.cliente.plan);
  if (!result.ok) return { error: result.error };

  revalidatePath(ROUTES.sucursales);
}

export async function updateSucursalAction(
  id: number,
  input: UpdateSucursalInput,
): Promise<SucursalActionResult | void> {
  const session = await requirePermission(MANAGE);

  const parsed = updateSucursalSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los datos del formulario." };

  const result = await updateSucursalUseCase(id, parsed.data, session.cliente.id);
  if (!result.ok) return { error: result.error };

  revalidatePath(ROUTES.sucursales);
}

export async function setSucursalActivoAction(
  id: number,
  activo: boolean,
): Promise<SucursalActionResult | void> {
  const session = await requirePermission(MANAGE);

  await setActivo(id, session.cliente.id, activo);
  revalidatePath(ROUTES.sucursales);
}

/**
 * Cambia el ambiente de facturación de una sucursal (o la matriz). El gate de
 * cuenta ("solo Nuvio pasa a producción") sigue vivo: una empresa solo puede
 * pasar a 'produccion' si el cliente ya está aprobado, sin importar qué tan
 * bien haya validado sus pruebas en 'sandbox'.
 */
export async function setSucursalAmbienteFacturacionAction(
  id: number,
  ambiente: AmbienteFacturacion,
): Promise<SucursalActionResult | void> {
  const session = await requirePermission(MANAGE);

  if (ambiente === "produccion" && session.cliente.ambienteTimbrado !== "produccion") {
    return {
      error:
        "Tu cuenta aún no está aprobada por Nuvio para facturar en producción. Contáctanos para activarla antes de usar este modo en una sucursal.",
    };
  }

  await setAmbienteTimbrado(id, session.cliente.id, ambiente);
  revalidatePath(ROUTES.sucursales);
}

export async function getLogoDetalleAction(idEmpresa: number): Promise<LogoDetalle | null> {
  const session = await requirePermission(VIEW);
  return getLogoMeta(idEmpresa, session.cliente.id);
}

export async function subirLogoAction(idEmpresa: number, formData: FormData): Promise<LogoMutationResult> {
  const session = await requirePermission(MANAGE);

  const archivo = formData.get("logo");
  if (!(archivo instanceof File)) return { ok: false, error: "Selecciona una imagen." };
  if (!TIPOS_LOGO_PERMITIDOS.has(archivo.type)) {
    return { ok: false, error: "El logo debe ser una imagen PNG o JPG." };
  }
  if (archivo.size > TAMANO_MAXIMO_LOGO) {
    return { ok: false, error: "El logo no debe pesar más de 2 MB." };
  }

  await setLogo(idEmpresa, session.cliente.id, {
    data: Buffer.from(await archivo.arrayBuffer()),
    mimeType: archivo.type,
    nombre: archivo.name,
  });
  revalidatePath(ROUTES.sucursales);
  return { ok: true };
}
