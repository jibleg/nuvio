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
  actualizarStaffSchema,
  crearStaffSchema,
  onboardClienteSchema,
  resetAdminPasswordSchema,
  resetStaffPasswordSchema,
  superAdminLoginSchema,
  updateClienteSchema,
  type ActualizarStaffInput,
  type CrearStaffInput,
  type OnboardClienteInput,
  type ResetAdminPasswordInput,
  type ResetStaffPasswordInput,
  type SuperAdminLoginInput,
  type UpdateClienteInput,
} from "./schemas";
import { authenticateSuperAdmin } from "./use-cases/authenticate-super-admin";
import { startSuperAdminSession } from "./use-cases/start-super-admin-session";
import { onboardClienteUseCase } from "./use-cases/onboard-cliente";
import { updateClienteUseCase } from "./use-cases/update-cliente";
import { resetAdminPasswordUseCase } from "./use-cases/reset-admin-password";
import { deleteClienteUseCase } from "./use-cases/delete-cliente";
import { createStaffUseCase } from "./use-cases/create-staff";
import { updateStaffUseCase } from "./use-cases/update-staff";
import { resetStaffPasswordUseCase } from "./use-cases/reset-staff-password";
import { deleteStaffUseCase } from "./use-cases/delete-staff";
import { toggleStaffActivoUseCase } from "./use-cases/toggle-staff-activo";
import { getSuperAdminDetalle, revocarSuperAdminSesion } from "./repositories/super-admins-repository";
import { existsSlug, getClienteDetalle, setActivo, setAmbienteTimbrado } from "./repositories/clientes-repository";
import type { ClienteDetalle, StaffDetalle } from "./types";

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

// ---- Staff (cuentas con acceso a /superadmin) ----

/** Carga el detalle de una cuenta de staff para el formulario de edición (modal). */
export async function getStaffDetalleAction(id: number): Promise<StaffDetalle | null> {
  await requireSuperAdminSession();
  return getSuperAdminDetalle(id);
}

export async function createStaffAction(input: CrearStaffInput): Promise<SuperAdminActionResult | void> {
  await requireSuperAdminSession();

  const parsed = crearStaffSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los datos del formulario." };

  const result = await createStaffUseCase(parsed.data);
  if (!result.ok) return { error: result.error };

  revalidatePath(ROUTES.superadminStaff);
}

export async function updateStaffAction(
  id: number,
  input: ActualizarStaffInput,
): Promise<SuperAdminActionResult | void> {
  const { superAdmin } = await requireSuperAdminSession();

  const parsed = actualizarStaffSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los datos del formulario." };

  const result = await updateStaffUseCase(id, parsed.data, superAdmin.id);
  if (!result.ok) return { error: result.error };

  revalidatePath(ROUTES.superadminStaff);
}

export async function resetStaffPasswordAction(
  id: number,
  input: ResetStaffPasswordInput,
): Promise<SuperAdminActionResult | void> {
  await requireSuperAdminSession();

  const parsed = resetStaffPasswordSchema.safeParse(input);
  if (!parsed.success) return { error: "Mínimo 6 caracteres." };

  const result = await resetStaffPasswordUseCase(id, parsed.data.password);
  if (!result.ok) return { error: result.error };
}

export async function deleteStaffAction(id: number): Promise<SuperAdminActionResult | void> {
  const { superAdmin } = await requireSuperAdminSession();

  const result = await deleteStaffUseCase(id, superAdmin.id);
  if (!result.ok) return { error: result.error };

  revalidatePath(ROUTES.superadminStaff);
}

export async function toggleStaffActivoAction(
  id: number,
  activo: boolean,
): Promise<SuperAdminActionResult | void> {
  const { superAdmin } = await requireSuperAdminSession();

  const result = await toggleStaffActivoUseCase(id, activo, superAdmin.id);
  if (!result.ok) return { error: result.error };

  revalidatePath(ROUTES.superadminStaff);
}
