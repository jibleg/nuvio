"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/config/routes";
import { requirePermission } from "@/features/auth";
import {
  createPerfilSchema,
  updatePerfilSchema,
  type CreatePerfilInput,
  type UpdatePerfilInput,
} from "./schemas";
import { getPerfilById } from "./queries";
import {
  createPerfilUseCase,
  togglePerfilActivoUseCase,
  updatePerfilUseCase,
} from "./use-cases/save-perfil";
import type { PerfilDetalle } from "./types";

const MANAGE = "users.manage";

export type PerfilActionResult = { error: string };

/** Carga el detalle de un perfil para el formulario de edición (modal). */
export async function getPerfilDetalleAction(
  id: number,
): Promise<PerfilDetalle | null> {
  const session = await requirePermission("perfiles.acceso");
  return getPerfilById(id, session.cliente.id);
}

export async function createPerfilAction(
  input: CreatePerfilInput,
): Promise<PerfilActionResult | void> {
  const session = await requirePermission(MANAGE);
  const parsed = createPerfilSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los datos del formulario." };

  const result = await createPerfilUseCase(parsed.data, session.cliente.id);
  if (!result.ok) return { error: result.error };

  revalidatePath(ROUTES.perfiles);
}

export async function updatePerfilAction(
  id: number,
  input: UpdatePerfilInput,
): Promise<PerfilActionResult | void> {
  const session = await requirePermission(MANAGE);
  const parsed = updatePerfilSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los datos del formulario." };

  const result = await updatePerfilUseCase(id, parsed.data, session.cliente.id);
  if (!result.ok) return { error: result.error };

  revalidatePath(ROUTES.perfiles);
}

export async function togglePerfilActivoAction(
  id: number,
  activo: boolean,
): Promise<PerfilActionResult | void> {
  const session = await requirePermission(MANAGE);
  const result = await togglePerfilActivoUseCase(id, activo, session.cliente.id);
  if (!result.ok) return { error: result.error };
  revalidatePath(ROUTES.perfiles);
}
