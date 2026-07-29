/**
 * RBAC: carga de permisos efectivos de un usuario (solo lectura).
 * La autorización server-side y los guards viven en el feature `auth`, que
 * compone este feature con la sesión activa.
 */
export { getUserPermissionCodes } from "./use-cases/get-user-permission-codes";
export { hasPermission, hasAnyPermission } from "./authorization";
export {
  findAllPerfiles,
  findPerfilNamesByUsuario,
} from "./repositories/perfiles-repository";
export type { Perfil } from "./repositories/perfiles-repository";
