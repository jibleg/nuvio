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
  idCliente: number,
): Promise<PerfilMutationResult> {
  if (await existsNombre(data.nombre, idCliente)) {
    return { ok: false, error: "Ya existe un perfil con ese nombre." };
  }
  const id = await createPerfil({
    idCliente,
    nombre: data.nombre,
    descripcion: data.descripcion,
    permisoIds: data.permisos,
  });
  return { ok: true, id };
}

export async function updatePerfilUseCase(
  id: number,
  data: PerfilData & { activo: boolean },
  idCliente: number,
): Promise<PerfilMutationResult> {
  if (await existsNombre(data.nombre, idCliente, id)) {
    return { ok: false, error: "Ya existe otro perfil con ese nombre." };
  }
  await updatePerfil(id, idCliente, {
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
  idCliente: number,
): Promise<PerfilMutationResult> {
  await setActivo(id, idCliente, activo);
  return { ok: true, id };
}
