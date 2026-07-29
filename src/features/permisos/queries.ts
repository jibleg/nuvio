import { listModulos } from "./repositories/modulos-repository";
import {
  getPermisoById,
  listPermisos,
} from "./repositories/permisos-admin-repository";
import type {
  ModuloOption,
  PermisoDetalle,
  PermisoListItem,
  PermisosPorModulo,
} from "./types";

export function getPermisosList(): Promise<PermisoListItem[]> {
  return listPermisos();
}

export function getPermisoDetalle(id: number): Promise<PermisoDetalle | null> {
  return getPermisoById(id);
}

export function getModuloOptions(): Promise<ModuloOption[]> {
  return listModulos();
}

/** Agrupa una lista de permisos por módulo, con "Sin módulo" al final. */
function agrupar(permisos: PermisoListItem[]): PermisosPorModulo[] {
  const grupos = new Map<number, PermisosPorModulo>();
  for (const permiso of permisos) {
    const grupo = grupos.get(permiso.moduloId) ?? {
      moduloId: permiso.moduloId,
      moduloNombre: permiso.moduloNombre,
      permisos: [],
    };
    grupo.permisos.push({
      id: permiso.id,
      nombre: permiso.nombre,
      codigo: permiso.codigo,
    });
    grupos.set(permiso.moduloId, grupo);
  }
  return [...grupos.values()].sort((a, b) => {
    if (a.moduloNombre === "Sin módulo") return 1;
    if (b.moduloNombre === "Sin módulo") return -1;
    return a.moduloNombre.localeCompare(b.moduloNombre);
  });
}

/** Todos los permisos agrupados por módulo (tabla de gestión). */
export async function getPermisosAgrupados(): Promise<PermisosPorModulo[]> {
  return agrupar(await listPermisos());
}

/** Solo permisos activos, agrupados — para asignar a un perfil. */
export async function getPermisoOptionsAgrupados(): Promise<PermisosPorModulo[]> {
  const activos = (await listPermisos()).filter((permiso) => permiso.activo);
  return agrupar(activos);
}
