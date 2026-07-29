import {
  createPerfil,
  existsNombre,
  setActivo,
  updatePerfil,
} from "../repositories/perfiles-admin-repository";
import type { PerfilMutationResult } from "../types";

type PerfilData = {
  nombre: string;
  descripcion: string | null;
  permisos: number[];
};

export async function createPerfilUseCase(
  data: PerfilData,
): Promise<PerfilMutationResult> {
  if (await existsNombre(data.nombre)) {
    return { ok: false, error: "Ya existe un perfil con ese nombre." };
  }
  const id = await createPerfil({
    nombre: data.nombre,
    descripcion: data.descripcion,
    permisoIds: data.permisos,
  });
  return { ok: true, id };
}

export async function updatePerfilUseCase(
  id: number,
  data: PerfilData & { activo: boolean },
): Promise<PerfilMutationResult> {
  if (await existsNombre(data.nombre, id)) {
    return { ok: false, error: "Ya existe otro perfil con ese nombre." };
  }
  await updatePerfil(id, {
    nombre: data.nombre,
    descripcion: data.descripcion,
    activo: data.activo,
    permisoIds: data.permisos,
  });
  return { ok: true, id };
}

export async function togglePerfilActivoUseCase(
  id: number,
  activo: boolean,
): Promise<PerfilMutationResult> {
  await setActivo(id, activo);
  return { ok: true, id };
}
