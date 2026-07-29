"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Search } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { PermisoActivoToggle } from "./PermisoActivoToggle";
import { PermisoForm } from "./PermisoForm";
import { getPermisoDetalleAction } from "../actions";
import type { ModuloOption, PermisoDetalle, PermisoListItem } from "../types";

type Grupo = { modulo: string; permisos: PermisoListItem[] };

function agrupar(permisos: PermisoListItem[]): Grupo[] {
  const grupos = new Map<string, PermisoListItem[]>();
  for (const permiso of permisos) {
    const lista = grupos.get(permiso.moduloNombre) ?? [];
    lista.push(permiso);
    grupos.set(permiso.moduloNombre, lista);
  }
  return [...grupos.entries()]
    .map(([modulo, permisos]) => ({ modulo, permisos }))
    .sort((a, b) => {
      if (a.modulo === "Sin módulo") return 1;
      if (b.modulo === "Sin módulo") return -1;
      return a.modulo.localeCompare(b.modulo);
    });
}

export function PermisosAdmin({
  permisos,
  modulos,
  puedeGestionar,
}: {
  permisos: PermisoListItem[];
  modulos: ModuloOption[];
  puedeGestionar: boolean;
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [modo, setModo] = useState<"create" | "edit">("create");
  const [editando, setEditando] = useState<PermisoDetalle | null>(null);
  const [cargandoId, setCargandoId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const q = busqueda.trim().toLowerCase();
  const filtrados = permisos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(q) ||
      (p.codigo?.toLowerCase().includes(q) ?? false),
  );

  const abrirNuevo = () => {
    setModo("create");
    setEditando(null);
    setDrawerAbierto(true);
  };

  const abrirEdicion = (id: number) => {
    setCargandoId(id);
    startTransition(async () => {
      const detalle = await getPermisoDetalleAction(id);
      setCargandoId(null);
      if (!detalle) return;
      setEditando(detalle);
      setModo("edit");
      setDrawerAbierto(true);
    });
  };

  const alGuardar = () => {
    setDrawerAbierto(false);
    router.refresh();
  };

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o código"
            className="w-full rounded-full border border-line bg-surface py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-brand-400"
          />
        </div>
        {puedeGestionar && (
          <button
            type="button"
            onClick={abrirNuevo}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
          >
            <Plus className="h-4 w-4" />
            Nuevo permiso
          </button>
        )}
      </div>

      {filtrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface/60 p-10 text-center text-sm text-muted">
          {permisos.length === 0 ? "No hay permisos." : "Sin resultados."}
        </div>
      ) : (
        <div className="space-y-6">
          {agrupar(filtrados).map((grupo) => (
            <section
              key={grupo.modulo}
              className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft"
            >
              <h2 className="border-b border-line px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-brand-700 dark:text-brand-300">
                {grupo.modulo}
              </h2>
              <ul>
                {grupo.permisos.map((permiso) => (
                  <li
                    key={permiso.id}
                    className="flex items-center gap-4 border-b border-line/60 px-5 py-3 last:border-0 hover:bg-cloud/50"
                  >
                    {puedeGestionar && (
                      <PermisoActivoToggle
                        id={permiso.id}
                        activo={permiso.activo}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {permiso.nombre}
                      </p>
                      {permiso.codigo && (
                        <code className="text-xs text-muted">
                          {permiso.codigo}
                        </code>
                      )}
                    </div>
                    {puedeGestionar && (
                      <button
                        type="button"
                        onClick={() => abrirEdicion(permiso.id)}
                        disabled={cargandoId === permiso.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-60 dark:hover:text-brand-300"
                      >
                        {cargandoId === permiso.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Pencil className="h-3.5 w-3.5" />
                        )}
                        Editar
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Drawer
        open={drawerAbierto}
        onClose={() => setDrawerAbierto(false)}
        title={modo === "create" ? "Nuevo permiso" : "Editar permiso"}
        description={modo === "edit" ? editando?.nombre : undefined}
      >
        <PermisoForm
          key={modo === "edit" ? `edit-${editando?.id}` : "create"}
          mode={modo}
          modulos={modulos}
          initial={editando ?? undefined}
          onSuccess={alGuardar}
          onCancel={() => setDrawerAbierto(false)}
        />
      </Drawer>
    </div>
  );
}
