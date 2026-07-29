import { findPermisoCodesByUsuario } from "../repositories/permisos-repository";

/**
 * Permisos efectivos de un usuario como lista de códigos.
 * Fuente única para autorizar tanto en servidor como en la UI.
 */
export function getUserPermissionCodes(usuarioId: number): Promise<string[]> {
  return findPermisoCodesByUsuario(usuarioId);
}
