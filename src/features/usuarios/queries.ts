import { findAllPerfiles } from "@/features/rbac";
import { findAllEmpresas } from "@/features/empresas";
import { APP_MODULOS } from "@/config/modules";
import {
  getUsuarioDetalle,
  listUsuarios,
} from "./repositories/usuarios-admin-repository";
import type { UsuarioDetalle, UsuarioFormOptions, UsuarioListItem } from "./types";

export function getUsuariosList(): Promise<UsuarioListItem[]> {
  return listUsuarios();
}

export function getUsuarioById(id: number): Promise<UsuarioDetalle | null> {
  return getUsuarioDetalle(id);
}

/** Roles y empresas disponibles para asignar en el formulario. */
export async function getUsuarioFormOptions(): Promise<UsuarioFormOptions> {
  const [perfiles, empresas] = await Promise.all([
    findAllPerfiles(),
    findAllEmpresas(),
  ]);
  return { perfiles, empresas, modulos: APP_MODULOS };
}
