import {
  countSuperAdminsActivos,
  existsSuperAdminEmail,
  getSuperAdminDetalle,
  updateSuperAdmin,
} from "../repositories/super-admins-repository";
import type { ActualizarStaffData, SuperAdminMutationResult } from "../types";

/**
 * Edita una cuenta de staff. Dos protecciones para no dejar el panel sin
 * acceso: nadie puede desactivar su propia cuenta, y no se puede desactivar
 * la última cuenta de staff que sigue activa (aunque sea otra persona).
 */
export async function updateStaffUseCase(
  id: number,
  data: ActualizarStaffData,
  idStaffActual: number,
): Promise<SuperAdminMutationResult> {
  if (await existsSuperAdminEmail(data.email, id)) {
    return { ok: false, error: "Ya existe otra cuenta de staff con ese correo." };
  }

  if (!data.activo) {
    if (id === idStaffActual) {
      return { ok: false, error: "No puedes desactivar tu propia cuenta." };
    }
    const actual = await getSuperAdminDetalle(id);
    if (actual?.activo) {
      const activos = await countSuperAdminsActivos();
      if (activos <= 1) {
        return { ok: false, error: "No puedes desactivar la última cuenta de staff activa." };
      }
    }
  }

  await updateSuperAdmin(id, data);
  return { ok: true, id };
}
