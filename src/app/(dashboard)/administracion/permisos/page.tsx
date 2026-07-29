import { requirePermission } from "@/features/auth";
import {
  getPermisosList,
  getModuloOptions,
  PermisosAdmin,
} from "@/features/permisos";

export const metadata = {
  title: "Permisos",
};

export default async function PermisosPage() {
  const session = await requirePermission("perfiles.acceso");
  const puedeGestionar = session.permisos.includes("users.manage");
  const [permisos, modulos] = await Promise.all([
    getPermisosList(),
    getModuloOptions(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
          Permisos
        </h1>
        <p className="mt-1 text-sm text-muted">
          Acciones que se pueden conceder a los perfiles, agrupadas por módulo.
        </p>
      </div>

      <PermisosAdmin
        permisos={permisos}
        modulos={modulos}
        puedeGestionar={puedeGestionar}
      />
    </div>
  );
}
