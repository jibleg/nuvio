/**
 * Administración de usuarios (Fase 4): listado, alta y edición, con asignación
 * de perfiles y empresas. Mutaciones protegidas por el permiso `users.manage`.
 */
export {
  getUsuariosList,
  getUsuarioById,
  getUsuarioFormOptions,
} from "./queries";
export { UsuariosAdmin } from "./components/UsuariosAdmin";
