import { getModulo } from "@/config/modules";
import { ModuleIcon } from "./module-icons";

/** Pantalla de módulo aún no construido. */
export function ModuloProximamente({ moduloKey }: { moduloKey: string }) {
  const modulo = getModulo(moduloKey);

  return (
    <div className="flex flex-col items-center py-20 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-aurora-500 text-white">
        <ModuleIcon name={modulo?.icon ?? "grid"} className="h-8 w-8" />
      </span>
      <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-ink">
        {modulo?.nombre ?? "Módulo"}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        {modulo?.descripcion} Este módulo está en construcción y estará
        disponible muy pronto.
      </p>
      <span className="mt-6 inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:text-brand-200">
        En construcción
      </span>
    </div>
  );
}
