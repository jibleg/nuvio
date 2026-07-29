import { requirePermission } from "@/features/auth";
import {
  getUsuariosList,
  getUsuarioFormOptions,
  UsuariosAdmin,
} from "@/features/usuarios";

export const metadata = {
  title: "Usuarios",
};

export default async function UsuariosPage() {
  const session = await requirePermission("usuarios.acceso");
  const puedeGestionar = session.permisos.includes("users.manage");
  const [usuarios, options] = await Promise.all([
    getUsuariosList(),
    getUsuarioFormOptions(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
          Usuarios
        </h1>
        <p className="mt-1 text-sm text-muted">
          Administra el acceso, los roles y las empresas de cada persona.
        </p>
      </div>

      <UsuariosAdmin
        usuarios={usuarios}
        options={options}
        puedeGestionar={puedeGestionar}
      />
    </div>
  );
}
