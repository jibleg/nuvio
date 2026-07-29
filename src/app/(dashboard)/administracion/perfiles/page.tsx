import { requirePermission } from "@/features/auth";
import {
  getPerfilesList,
  getPerfilFormOptions,
  PerfilesAdmin,
} from "@/features/perfiles";

export const metadata = {
  title: "Perfiles",
};

export default async function PerfilesPage() {
  const session = await requirePermission("perfiles.acceso");
  const puedeGestionar = session.permisos.includes("users.manage");
  const [perfiles, options] = await Promise.all([
    getPerfilesList(),
    getPerfilFormOptions(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
          Perfiles
        </h1>
        <p className="mt-1 text-sm text-muted">
          Roles y los permisos que otorga cada uno.
        </p>
      </div>

      <PerfilesAdmin
        perfiles={perfiles}
        options={options}
        puedeGestionar={puedeGestionar}
      />
    </div>
  );
}
