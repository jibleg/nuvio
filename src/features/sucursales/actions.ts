"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/config/routes";
import { requirePermission } from "@/features/auth";
import { sucursalFormSchema, updateSucursalSchema, type SucursalFormInput, type UpdateSucursalInput } from "./schemas";
import { getSucursalById } from "./queries";
import { createSucursalUseCase } from "./use-cases/create-sucursal";
import { updateSucursalUseCase } from "./use-cases/update-sucursal";
import { setActivo } from "./repositories/sucursales-repository";
import type { SucursalDetalle } from "./types";

const VIEW = "empresas.acceso";
const MANAGE = "empresas.write";

export type SucursalActionResult = { error: string };

/** Carga el detalle de una sucursal para el formulario de edición (modal). */
export async function getSucursalDetalleAction(id: number): Promise<SucursalDetalle | null> {
  const session = await requirePermission(VIEW);
  return getSucursalById(id, session.cliente.id);
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
