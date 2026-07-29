import {
  createPermiso,
  existsCodigo,
  setActivoPermiso,
  updatePermiso,
} from "../repositories/permisos-admin-repository";
import type { PermisoMutationResult } from "../types";

type PermisoData = { nombre: string; codigo: string; idModulo: number };

export async function createPermisoUseCase(
  data: PermisoData,
): Promise<PermisoMutationResult> {
  if (await existsCodigo(data.codigo)) {
    return { ok: false, error: "Ya existe un permiso con ese código." };
  }
  const id = await createPermiso(data);
  return { ok: true, id };
}

export async function updatePermisoUseCase(
  id: number,
  data: PermisoData & { activo: boolean },
): Promise<PermisoMutationResult> {
  if (await existsCodigo(data.codigo, id)) {
    return { ok: false, error: "Ya existe otro permiso con ese código." };
  }
  await updatePermiso(id, data);
  return { ok: true, id };
}

export async function togglePermisoActivoUseCase(
  id: number,
  activo: boolean,
): Promise<PermisoMutationResult> {
  await setActivoPermiso(id, activo);
  return { ok: true, id };
}
