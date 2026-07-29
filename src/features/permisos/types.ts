/** Módulo agrupador (para el selector y el agrupado de permisos). */
export type ModuloOption = {
  id: number;
  nombre: string;
};

/** Fila de la tabla de permisos. */
export type PermisoListItem = {
  id: number;
  nombre: string;
  codigo: string | null;
  activo: boolean;
  moduloId: number;
  moduloNombre: string;
};

/** Detalle de un permiso para edición. */
export type PermisoDetalle = {
  id: number;
  nombre: string;
  codigo: string | null;
  idModulo: number;
  activo: boolean;
};

/** Permiso como opción asignable a un perfil. */
export type PermisoOption = {
  id: number;
  nombre: string;
  codigo: string | null;
};

/** Permisos agrupados por módulo (para asignación en perfiles y para la tabla). */
export type PermisosPorModulo = {
  moduloId: number;
  moduloNombre: string;
  permisos: PermisoOption[];
};

export type PermisoMutationResult =
  | { ok: true; id?: number }
  | { ok: false; error: string };
