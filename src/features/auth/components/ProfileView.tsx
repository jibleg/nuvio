import { Building2, ShieldCheck } from "lucide-react";
import { requireSession } from "@/features/auth";
import { Avatar } from "@/components/ui/Avatar";
import { ModuleIcon } from "@/features/modulos/components/module-icons";
import { resolveModulos } from "@/config/modules";

/**
 * Vista de perfil del operador. Ancho completo: se adapta al contenedor donde
 * se monte (el shell del módulo activo o la página de perfil del portal).
 */
export async function ProfileView() {
  const session = await requireSession();
  const { usuario, empresas, permisos } = session;
  const modulos = resolveModulos(session.modulos);

  return (
    <div className="w-full">
      {/* Tarjeta principal */}
      <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-soft">
        <div className="bg-mesh h-24 sm:h-28" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-col items-start gap-4 sm:-mt-12 sm:flex-row sm:items-end">
            <Avatar
              nombre={usuario.nombre}
              src={usuario.avatar}
              size="lg"
              className="!h-20 !w-20 !text-2xl ring-4 ring-surface"
            />
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
                {usuario.nombre}
              </h1>
              <p className="text-sm text-muted">
                @{usuario.login}
                {usuario.email ? ` · ${usuario.email}` : ""}
              </p>
              {usuario.perfil && (
                <span className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-700 dark:border-brand-500/25 dark:bg-brand-500/10 dark:text-brand-300">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{usuario.perfil}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detalles */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
            <Building2 className="h-4 w-4 text-brand-500" />
            Empresas con acceso
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {empresas.length > 0 ? (
              empresas.map((empresa) => (
                <span
                  key={empresa.id}
                  className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:text-brand-200"
                >
                  {empresa.nombreCorto ?? empresa.nombreComercial}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted">Sin empresas asignadas</span>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
            <ShieldCheck className="h-4 w-4 text-brand-500" />
            Accesos
          </h2>
          <p className="mt-3 text-sm text-ink-soft">
            {permisos.length} permisos · {modulos.length} módulos
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {modulos.map((modulo) => (
              <span
                key={modulo.key}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft"
              >
                <ModuleIcon name={modulo.icon} className="h-3.5 w-3.5 text-brand-500" />
                {modulo.nombre}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
