import { countSuperAdminsActivos, setSuperAdminActivo } from "../repositories/super-admins-repository";
import type { SuperAdminMutationResult } from "../types";

/** Toggle rápido de estado desde el listado — mismas protecciones que `updateStaffUseCase`. */
export async function toggleStaffActivoUseCase(
  id: number,
  activo: boolean,
  idStaffActual: number,
): Promise<SuperAdminMutationResult> {
  if (!activo) {
    if (id === idStaffActual) {
      return { ok: false, error: "No puedes desactivar tu propia cuenta." };
    }
    const activos = await countSuperAdminsActivos();
    if (activos <= 1) {
      return { ok: false, error: "No puedes desactivar la última cuenta de staff activa." };
    }
  }

  await setSuperAdminActivo(id, activo);
  return { ok: true, id };
}
