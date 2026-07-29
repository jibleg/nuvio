import { hashSessionToken } from "@/lib/auth/tokens";
import { getUserPermissionCodes } from "@/features/rbac";
import { findEmpresasByUsuario } from "@/features/empresas";
import { findModuloKeysByUsuario } from "@/features/modulos";
import { findSesionVigenteConUsuario } from "../repositories/sesiones-repository";
import type { SessionContext } from "../types";

/**
 * Arma el contexto de sesión a partir del token de la cookie: valida la sesión,
 * carga los permisos del usuario y sus empresas, y resuelve la empresa activa.
 * Devuelve null si el token no corresponde a una sesión vigente.
 */
export async function getSessionContext(
  token: string,
): Promise<SessionContext | null> {
  const found = await findSesionVigenteConUsuario(hashSessionToken(token));
  if (!found) return null;

  const { sesion, usuario } = found;
  const [permisos, empresas, modulos] = await Promise.all([
    getUserPermissionCodes(usuario.id),
    findEmpresasByUsuario(usuario.id),
    findModuloKeysByUsuario(usuario.id),
  ]);

  const empresaActiva =
    empresas.find((empresa) => empresa.id === sesion.idEmpresaActiva) ??
    empresas[0] ??
    null;

  return {
    usuario: {
      id: usuario.id,
      login: usuario.login,
      nombre: usuario.nombre,
      email: usuario.email,
      avatar: usuario.avatar,
    },
    permisos,
    modulos,
    empresaActiva,
    empresas,
  };
}
