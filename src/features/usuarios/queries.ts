import { findAllPerfiles } from "@/features/rbac";
import { findAllEmpresas } from "@/features/empresas";
import { APP_MODULOS } from "@/config/modules";
import {
  getUsuarioDetalle,
  listUsuarios,
} from "./repositories/usuarios-admin-repository";
import type { UsuarioDetalle, UsuarioFormOptions, UsuarioListItem } from "./types";

export function getUsuariosList(idCliente: number): Promise<UsuarioListItem[]> {
  return listUsuarios(idCliente);
}

export function getUsuarioById(
  id: number,
  idCliente: number,
): Promise<UsuarioDetalle | null> {
  return getUsuarioDetalle(id, idCliente);
}

/** Roles y empresas del cliente disponibles para asignar en el formulario. */
export async function getUsuarioFormOptions(
  idCliente: number,
): Promise<UsuarioFormOptions> {
  const [perfiles, empresas] = await Promise.all([
    findAllPerfiles(idCliente),
    findAllEmpresas(idCliente),
  ]);
  return { perfiles, empresas, modulos: APP_MODULOS };
}
