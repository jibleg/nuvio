import { listPermisos } from "./repositories/permisos-repository";
import type { PermisoListItem, PermisosPorModulo } from "./types";

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

/** Permisos activos agrupados por módulo — para asignarlos a un perfil. */
export async function getPermisoOptionsAgrupados(): Promise<PermisosPorModulo[]> {
  const activos = (await listPermisos()).filter((permiso) => permiso.activo);
  return agrupar(activos);
}
