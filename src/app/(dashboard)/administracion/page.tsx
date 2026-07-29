import Link from "next/link";
import { ArrowRight, Users, UserCog, KeyRound } from "lucide-react";
import { requireModulo } from "@/features/auth";
import { hasPermission } from "@/features/rbac";
import { ROUTES } from "@/config/routes";

export const metadata = {
  title: "Administración",
};

const secciones = [
  {
    permiso: "usuarios.acceso",
    href: ROUTES.usuarios,
    icon: Users,
    titulo: "Usuarios",
    descripcion: "Operadores, sus roles y empresas.",
  },
  {
    permiso: "perfiles.acceso",
    href: ROUTES.perfiles,
    icon: UserCog,
    titulo: "Perfiles",
    descripcion: "Roles y los permisos que otorgan.",
  },
  {
    permiso: "perfiles.acceso",
    href: ROUTES.permisos,
    icon: KeyRound,
    titulo: "Permisos",
    descripcion: "Acciones concedibles, por módulo.",
  },
];

export default async function AdministracionHome() {
  const session = await requireModulo("administracion");
  const disponibles = secciones.filter((seccion) =>
    hasPermission(session.permisos, seccion.permiso),
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
        Administración
      </h1>
      <p className="mt-1 text-sm text-muted">
        Gestiona el acceso al sistema: usuarios, roles y permisos.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {disponibles.map((seccion) => (
          <Link
            key={seccion.titulo}
            href={seccion.href}
            className="group card-hover flex items-start gap-4 rounded-2xl border border-line bg-surface p-5 shadow-soft hover:-translate-y-0.5 hover:border-brand-300"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:text-brand-300">
              <seccion.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="flex items-center gap-1.5 font-display text-base font-bold text-ink">
                {seccion.titulo}
                <ArrowRight className="h-4 w-4 text-brand-500 transition-transform group-hover:translate-x-1" />
              </h2>
              <p className="mt-0.5 text-sm text-muted">{seccion.descripcion}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
