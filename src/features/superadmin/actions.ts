"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/config/routes";
import { hashSessionToken } from "@/lib/auth/tokens";
import {
  clearSuperAdminSessionCookie,
  readSuperAdminSessionCookie,
  setSuperAdminSessionCookie,
} from "@/lib/auth/superadmin-session-cookie";
import { requireSuperAdminSession } from "./guards";
import {
  onboardClienteSchema,
  resetAdminPasswordSchema,
  superAdminLoginSchema,
  updateClienteSchema,
  type OnboardClienteInput,
  type ResetAdminPasswordInput,
  type SuperAdminLoginInput,
  type UpdateClienteInput,
} from "./schemas";
import { authenticateSuperAdmin } from "./use-cases/authenticate-super-admin";
import { startSuperAdminSession } from "./use-cases/start-super-admin-session";
import { onboardClienteUseCase } from "./use-cases/onboard-cliente";
import { updateClienteUseCase } from "./use-cases/update-cliente";
import { resetAdminPasswordUseCase } from "./use-cases/reset-admin-password";
import { deleteClienteUseCase } from "./use-cases/delete-cliente";
import { revocarSuperAdminSesion } from "./repositories/super-admins-repository";
import { existsSlug, getClienteDetalle, setActivo, setAmbienteTimbrado } from "./repositories/clientes-repository";
import type { ClienteDetalle } from "./types";

export type SuperAdminActionResult = { error: string };

/** Carga el detalle de un cliente para el formulario de edición (modal). */
export async function getClienteDetalleAction(
  id: number,
): Promise<ClienteDetalle | null> {
  await requireSuperAdminSession();
  return getClienteDetalle(id);
}

/** Chequeo en vivo (mientras se escribe) de si un slug ya está tomado. */
export async function checkSlugDisponibleAction(slug: string): Promise<boolean> {
  await requireSuperAdminSession();
  if (!slug) return true;
  return !(await existsSlug(slug));
}

export async function superAdminLoginAction(
  input: SuperAdminLoginInput,
): Promise<SuperAdminActionResult | void> {
  const parsed = superAdminLoginSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos." };

  const result = await authenticateSuperAdmin(parsed.data.email, parsed.data.password);
  if (!result.ok) {
    if (result.reason === "inactive") return { error: "Cuenta inactiva." };
    return { error: "Correo o contraseña incorrectos." };
  }

  const requestHeaders = await headers();
  const token = await startSuperAdminSession(result.superAdminId, {
    ip: requestHeaders.get("x-forwarded-for"),
    userAgent: requestHeaders.get("user-agent"),
  });
  await setSuperAdminSessionCookie(token);

  redirect(ROUTES.superadmin);
}

export async function superAdminLogoutAction(): Promise<void> {
  const token = await readSuperAdminSessionCookie();
  if (token) await revocarSuperAdminSesion(hashSessionToken(token));
  await clearSuperAdminSessionCookie();
  redirect(ROUTES.superadminLogin);
}

export async function onboardClienteAction(
  input: OnboardClienteInput,
): Promise<SuperAdminActionResult | void> {
  await requireSuperAdminSession();

  const parsed = onboardClienteSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los datos del formulario." };

  const result = await onboardClienteUseCase(parsed.data);
  if (!result.ok) return { error: result.error };

  revalidatePath(ROUTES.superadminClientes);
}

export async function updateClienteAction(
  id: number,
  input: UpdateClienteInput,
): Promise<SuperAdminActionResult | void> {
  await requireSuperAdminSession();

  const parsed = updateClienteSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los datos del formulario." };

  const result = await updateClienteUseCase(id, parsed.data);
  if (!result.ok) return { error: result.error };

  revalidatePath(ROUTES.superadminClientes);
}

export async function resetAdminPasswordAction(
  idCliente: number,
  input: ResetAdminPasswordInput,
): Promise<SuperAdminActionResult | void> {
  await requireSuperAdminSession();

  const parsed = resetAdminPasswordSchema.safeParse(input);
  if (!parsed.success) return { error: "Mínimo 6 caracteres." };

  const result = await resetAdminPasswordUseCase(idCliente, parsed.data.password);
  if (!result.ok) return { error: result.error };
}

export async function deleteClienteAction(
  id: number,
): Promise<SuperAdminActionResult | void> {
  await requireSuperAdminSession();

  const result = await deleteClienteUseCase(id);
  if (!result.ok) return { error: result.error };

  revalidatePath(ROUTES.superadminClientes);
}

export async function toggleClienteActivoAction(
  id: number,
  activo: boolean,
): Promise<SuperAdminActionResult | void> {
  await requireSuperAdminSession();

  await setActivo(id, activo);
  revalidatePath(ROUTES.superadminClientes);
}

/** Aprueba (o revoca) el gate de Finkok de la cuenta — solo el panel interno puede pasarlo a 'produccion'. */
export async function toggleClienteAmbienteTimbradoAction(
  id: number,
  ambiente: "sandbox" | "produccion",
): Promise<SuperAdminActionResult | void> {
  await requireSuperAdminSession();

  await setAmbienteTimbrado(id, ambiente);
  revalidatePath(ROUTES.superadminClientes);
}
