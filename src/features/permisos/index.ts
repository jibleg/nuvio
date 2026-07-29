/**
 * Gestión de permisos (CRUD) agrupados por módulo. También expone las opciones
 * de permisos agrupadas que consume el feature `perfiles` para asignarlos.
 */
export type {
  PermisoOption,
  PermisosPorModulo,
  ModuloOption,
} from "./types";
export {
  getPermisosList,
  getPermisoDetalle,
  getModuloOptions,
  getPermisoOptionsAgrupados,
} from "./queries";
export { PermisosAdmin } from "./components/PermisosAdmin";
