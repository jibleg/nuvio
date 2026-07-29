/**
 * Gestión de perfiles (roles): CRUD y asignación de permisos por módulo.
 * Mutaciones protegidas por `users.manage`.
 */
export {
  getPerfilesList,
  getPerfilById,
  getPerfilFormOptions,
} from "./queries";
export { PerfilesAdmin } from "./components/PerfilesAdmin";
