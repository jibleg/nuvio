import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, Plus, Users, XCircle } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { getClientesList, getSuperAdminStats } from "@/features/superadmin";

export const metadata = {
  title: "Panel interno — Resumen",
};

export default async function SuperAdminResumenPage() {
  const [stats, clientes] = await Promise.all([getSuperAdminStats(), getClientesList()]);
  const recientes = [...clientes].reverse().slice(0, 5);

  const tiles = [
    {
      label: "Clientes",
      value: stats.clientesTotal,
      icon: Building2,
      accent: "from-brand-400 to-aurora-500",
    },
    {
      label: "Activos",
      value: stats.clientesActivos,
      icon: CheckCircle2,
      accent: "from-emerald-400 to-brand-500",
    },
    {
      label: "Inactivos",
      value: stats.clientesTotal - stats.clientesActivos,
      icon: XCircle,
      accent: "from-slate-400 to-slate-500",
    },
    {
      label: "Usuarios totales",
      value: stats.usuariosTotal,
      icon: Users,
      accent: "from-sky-soft to-brand-400",
    },
  ];

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
            Resumen
          </h1>
          <p className="mt-1 text-sm text-muted">
            El estado de la plataforma, de un vistazo.
          </p>
        </div>
        <Link
          href={ROUTES.superadminClientes}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
        >
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-2xl border border-line bg-surface p-5 shadow-soft"
          >
            <span
              className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${tile.accent} text-white shadow-sm`}
            >
              <tile.icon className="h-5 w-5" />
            </span>
            <p className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink">
              {tile.value}
            </p>
            <p className="text-sm text-muted">{tile.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-surface shadow-soft">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-base font-bold text-ink">Clientes recientes</h2>
          <Link
            href={ROUTES.superadminClientes}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200"
          >
            Ver todos
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recientes.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            Aún no hay clientes dados de alta.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {recientes.map((cliente) => (
              <li key={cliente.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-aurora-500 text-white">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{cliente.nombre}</p>
                    <p className="truncate text-xs text-muted">{cliente.slug}.nuvio.app</p>
                  </div>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    cliente.activo
                      ? "bg-brand-50 text-brand-700 dark:text-brand-200"
                      : "bg-cloud text-muted"
                  }`}
                >
                  {cliente.activo ? "Activo" : "Inactivo"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
