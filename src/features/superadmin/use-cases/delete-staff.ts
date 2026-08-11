import {
  countSuperAdminsActivos,
  deleteSuperAdmin,
  getSuperAdminDetalle,
} from "../repositories/super-admins-repository";
import type { SuperAdminMutationResult } from "../types";

/** Elimina una cuenta de staff. Mismas protecciones que `updateStaffUseCase`: no a sí mismo, no la última activa. */
export async function deleteStaffUseCase(
  id: number,
  idStaffActual: number,
): Promise<SuperAdminMutationResult> {
  if (id === idStaffActual) {
    return { ok: false, error: "No puedes eliminar tu propia cuenta." };
  }

  const staff = await getSuperAdminDetalle(id);
  if (!staff) return { ok: false, error: "Cuenta no encontrada." };

  if (staff.activo) {
    const activos = await countSuperAdminsActivos();
    if (activos <= 1) {
      return { ok: false, error: "No puedes eliminar la última cuenta de staff activa." };
    }
  }

  await deleteSuperAdmin(id);
  return { ok: true };
}
