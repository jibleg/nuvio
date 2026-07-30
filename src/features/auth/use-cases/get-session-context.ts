import { hashSessionToken } from "@/lib/auth/tokens";
import { getUserPermissionCodes, findPerfilNamesByUsuario } from "@/features/rbac";
import { findEmpresasByUsuario } from "@/features/empresas";
import { findModuloKeysByCliente, findModuloKeysByUsuario } from "@/features/modulos";
import { getCurrentTenant } from "@/features/tenant";
import { findSesionVigenteConUsuario } from "../repositories/sesiones-repository";
import type { SessionContext } from "../types";

/**
 * Arma el contexto de sesión a partir del token de la cookie: valida la sesión,
 * exige que pertenezca al cliente (tenant) del subdominio actual, y carga
 * permisos, empresas y módulos del usuario. Devuelve null si el token no
 * corresponde a una sesión vigente del tenant en curso (bloquea reuso de cookie
 * entre subdominios de distintos clientes).
 */
export async function getSessionContext(
  token: string,
): Promise<SessionContext | null> {
  const tenant = await getCurrentTenant();
  if (!tenant) return null;

  const found = await findSesionVigenteConUsuario(hashSessionToken(token));
  if (!found) return null;

  const { sesion, usuario } = found;

  // La sesión y el usuario deben pertenecer al tenant del subdominio.
  if (sesion.idCliente !== tenant.id || usuario.idCliente !== tenant.id) {
    return null;
  }

  const [permisos, empresas, modulosUsuario, modulosCliente, perfiles] = await Promise.all([
    getUserPermissionCodes(usuario.id),
    findEmpresasByUsuario(usuario.id),
    findModuloKeysByUsuario(usuario.id),
    findModuloKeysByCliente(tenant.id),
    findPerfilNamesByUsuario(usuario.id),
  ]);

  // El cliente licencia módulos (paquete); el operador recibe un subconjunto.
  // Si el cliente pierde un módulo, ningún operador conserva acceso a él aunque
  // su asignación individual (`usuario_modulos`) no se haya actualizado.
  const modulos = modulosUsuario.filter((key) => modulosCliente.includes(key));

  const empresaActiva =
    empresas.find((empresa) => empresa.id === sesion.idEmpresaActiva) ??
    empresas[0] ??
    null;

  return {
    cliente: tenant,
    usuario: {
      id: usuario.id,
      login: usuario.login,
      nombre: usuario.nombre,
      email: usuario.email,
      avatar: usuario.avatar,
      perfil: perfiles.join(" · ") || null,
    },
    permisos,
    modulos,
    empresaActiva,
    empresas,
  };
}
