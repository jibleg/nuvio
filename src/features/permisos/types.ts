/** Fila del catálogo de permisos. */
export type PermisoListItem = {
  id: number;
  nombre: string;
  codigo: string | null;
  activo: boolean;
  moduloId: number;
  moduloNombre: string;
};

/** Permiso como opción asignable a un perfil. */
export type PermisoOption = {
  id: number;
  nombre: string;
  codigo: string | null;
};

/** Permisos agrupados por módulo (para asignación en perfiles). */
export type PermisosPorModulo = {
  moduloId: number;
  moduloNombre: string;
  permisos: PermisoOption[];
};
