import { setActivo } from "../repositories/usuarios-admin-repository";
import type { UsuarioMutationResult } from "../types";

export async function toggleUsuarioActivoUseCase(
  id: number,
  activo: boolean,
  currentUserId: number,
): Promise<UsuarioMutationResult> {
  if (id === currentUserId && !activo) {
    return { ok: false, error: "No puedes desactivar tu propia cuenta." };
  }
  await setActivo(id, activo);
  return { ok: true, id };
}
