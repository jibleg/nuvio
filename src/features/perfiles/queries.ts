import { getPermisoOptionsAgrupados } from "@/features/permisos";
import {
  getPerfilDetalle,
  listPerfilesAdmin,
} from "./repositories/perfiles-admin-repository";
import type { PerfilDetalle, PerfilFormOptions, PerfilListItem } from "./types";

export function getPerfilesList(): Promise<PerfilListItem[]> {
  return listPerfilesAdmin();
}

export function getPerfilById(id: number): Promise<PerfilDetalle | null> {
  return getPerfilDetalle(id);
}

/** Permisos disponibles (agrupados por módulo) para asignar al perfil. */
export async function getPerfilFormOptions(): Promise<PerfilFormOptions> {
  const permisos = await getPermisoOptionsAgrupados();
  return { permisos };
}
