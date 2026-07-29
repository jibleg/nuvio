/**
 * Catálogo de permisos (solo lectura). Los permisos son datos sembrados por el
 * sistema y ligados a los guards por su código; no se crean/editan desde la UI.
 * Este feature expone las opciones agrupadas que consume `perfiles` para
 * asignar permisos a un perfil.
 */
export type { PermisoOption, PermisosPorModulo } from "./types";
export { getPermisoOptionsAgrupados } from "./queries";
