import type { PermisosPorModulo } from "@/features/permisos";

/** Fila de la tabla de perfiles (roles). */
export type PerfilListItem = {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  permisosCount: number;
  usuariosCount: number;
};

/** Detalle de un perfil para edición. */
export type PerfilDetalle = {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  permisoIds: number[];
};

/** Opciones para el formulario: permisos disponibles agrupados por módulo. */
export type PerfilFormOptions = {
  permisos: PermisosPorModulo[];
};

export type PerfilMutationResult =
  | { ok: true; id?: number }
  | { ok: false; error: string };
