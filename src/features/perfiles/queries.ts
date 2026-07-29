import { getPermisoOptionsAgrupados } from "@/features/permisos";
import {
  getPerfilDetalle,
  listPerfilesAdmin,
} from "./repositories/perfiles-admin-repository";
import type { PerfilDetalle, PerfilFormOptions, PerfilListItem } from "./types";

export function getPerfilesList(idCliente: number): Promise<PerfilListItem[]> {
  return listPerfilesAdmin(idCliente);
}

export function getPerfilById(
  id: number,
  idCliente: number,
): Promise<PerfilDetalle | null> {
  return getPerfilDetalle(id, idCliente);
}

/** Permisos disponibles (agrupados por módulo) para asignar al perfil. */
export async function getPerfilFormOptions(): Promise<PerfilFormOptions> {
  const permisos = await getPermisoOptionsAgrupados();
  return { permisos };
}
