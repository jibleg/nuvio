"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/config/routes";
import { requirePermission } from "@/features/auth";
import {
  createPermisoSchema,
  updatePermisoSchema,
  type CreatePermisoInput,
  type UpdatePermisoInput,
} from "./schemas";
import { getPermisoDetalle } from "./queries";
import {
  createPermisoUseCase,
  togglePermisoActivoUseCase,
  updatePermisoUseCase,
} from "./use-cases/save-permiso";
import type { PermisoDetalle } from "./types";

const MANAGE = "users.manage";

export type PermisoActionResult = { error: string };

/** Carga el detalle de un permiso para el formulario de edición (drawer). */
export async function getPermisoDetalleAction(
  id: number,
): Promise<PermisoDetalle | null> {
  await requirePermission("perfiles.acceso");
  return getPermisoDetalle(id);
}

export async function createPermisoAction(
  input: CreatePermisoInput,
): Promise<PermisoActionResult | void> {
  await requirePermission(MANAGE);
  const parsed = createPermisoSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los datos del formulario." };

  const result = await createPermisoUseCase(parsed.data);
  if (!result.ok) return { error: result.error };

  revalidatePath(ROUTES.permisos);
}

export async function updatePermisoAction(
  id: number,
  input: UpdatePermisoInput,
): Promise<PermisoActionResult | void> {
  await requirePermission(MANAGE);
  const parsed = updatePermisoSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los datos del formulario." };

  const result = await updatePermisoUseCase(id, parsed.data);
  if (!result.ok) return { error: result.error };

  revalidatePath(ROUTES.permisos);
}

export async function togglePermisoActivoAction(
  id: number,
  activo: boolean,
): Promise<PermisoActionResult | void> {
  await requirePermission(MANAGE);
  const result = await togglePermisoActivoUseCase(id, activo);
  if (!result.ok) return { error: result.error };
  revalidatePath(ROUTES.permisos);
}
