"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/config/routes";
import { requirePermission } from "@/features/auth";
import {
  createUsuarioSchema,
  updateUsuarioSchema,
  type CreateUsuarioInput,
  type UpdateUsuarioInput,
} from "./schemas";
import { getUsuarioById } from "./queries";
import { createUsuarioUseCase } from "./use-cases/create-usuario";
import { updateUsuarioUseCase } from "./use-cases/update-usuario";
import { toggleUsuarioActivoUseCase } from "./use-cases/toggle-usuario-activo";
import type { UsuarioDetalle } from "./types";

const MANAGE = "users.manage";

export type UsuarioActionResult = { error: string };

/** Carga el detalle de un usuario para el formulario de edición (modal). */
export async function getUsuarioDetalleAction(
  id: number,
): Promise<UsuarioDetalle | null> {
  const session = await requirePermission("usuarios.acceso");
  return getUsuarioById(id, session.cliente.id);
}

export async function createUsuarioAction(
  input: CreateUsuarioInput,
): Promise<UsuarioActionResult | void> {
  const session = await requirePermission(MANAGE);

  const parsed = createUsuarioSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los datos del formulario." };

  const result = await createUsuarioUseCase(parsed.data, session.cliente.id);
  if (!result.ok) return { error: result.error };

  revalidatePath(ROUTES.usuarios);
}

export async function updateUsuarioAction(
  id: number,
  input: UpdateUsuarioInput,
): Promise<UsuarioActionResult | void> {
  const session = await requirePermission(MANAGE);

  const parsed = updateUsuarioSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los datos del formulario." };

  const result = await updateUsuarioUseCase(
    id,
    parsed.data,
    session.usuario.id,
    session.cliente.id,
  );
  if (!result.ok) return { error: result.error };

  revalidatePath(ROUTES.usuarios);
}

export async function toggleUsuarioActivoAction(
  id: number,
  activo: boolean,
): Promise<UsuarioActionResult | void> {
  const session = await requirePermission(MANAGE);

  const result = await toggleUsuarioActivoUseCase(
    id,
    activo,
    session.usuario.id,
    session.cliente.id,
  );
  if (!result.ok) return { error: result.error };

  revalidatePath(ROUTES.usuarios);
}
