import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { requireSession } from "@/features/auth";
import { resolveModulos } from "@/config/modules";
import { ModuleIcon } from "@/features/modulos/components/module-icons";

export const metadata = {
  title: "Módulos",
};

export default async function LauncherPage() {
  const session = await requireSession();
  const modulos = resolveModulos(session.modulos);

  // Un solo módulo disponible → acceso directo.
  if (modulos.length === 1 && modulos[0].disponible) {
    redirect(modulos[0].homeHref);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-sm font-medium text-brand-600 dark:text-brand-300">
        {session.empresaActiva?.nombreComercial ?? "Nuvio"}
      </p>
      <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink">
        Hola, {session.usuario.nombre.split(" ")[0]}
      </h1>
      <p className="mt-2 text-muted">
        {modulos.length === 0
          ? "Aún no tienes módulos asignados. Contacta al administrador."
          : "Elige un módulo para comenzar."}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modulos.map((modulo) =>
          modulo.disponible ? (
            <Link
              key={modulo.key}
              href={modulo.homeHref}
              className="group card-hover relative flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-soft hover:-translate-y-1 hover:border-brand-300 hover:shadow-glow"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-aurora-500 text-white">
                <ModuleIcon name={modulo.icon} className="h-6 w-6" />
              </span>
              <h2 className="mt-4 font-display text-lg font-bold text-ink">
                {modulo.nombre}
              </h2>
              <p className="mt-1 flex-1 text-sm text-muted">{modulo.descripcion}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-300">
                Entrar
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ) : (
            <div
              key={modulo.key}
              className="relative flex flex-col rounded-2xl border border-dashed border-line bg-surface/50 p-5"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-cloud text-muted">
                <ModuleIcon name={modulo.icon} className="h-6 w-6" />
              </span>
              <h2 className="mt-4 font-display text-lg font-bold text-ink-soft">
                {modulo.nombre}
              </h2>
              <p className="mt-1 flex-1 text-sm text-muted">{modulo.descripcion}</p>
              <span className="mt-4 inline-flex w-fit items-center rounded-full bg-cloud px-2.5 py-0.5 text-xs font-semibold text-muted">
                Próximamente
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
