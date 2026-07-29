"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Search, UserCog } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { PerfilActivoToggle } from "./PerfilActivoToggle";
import { PerfilForm } from "./PerfilForm";
import { getPerfilDetalleAction } from "../actions";
import type { PerfilDetalle, PerfilFormOptions, PerfilListItem } from "../types";

export function PerfilesAdmin({
  perfiles,
  options,
  puedeGestionar,
}: {
  perfiles: PerfilListItem[];
  options: PerfilFormOptions;
  puedeGestionar: boolean;
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modo, setModo] = useState<"create" | "edit">("create");
  const [editando, setEditando] = useState<PerfilDetalle | null>(null);
  const [cargandoId, setCargandoId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const filtrados = perfiles.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()),
  );

  const abrirNuevo = () => {
    setModo("create");
    setEditando(null);
    setModalAbierto(true);
  };

  const abrirEdicion = (id: number) => {
    setCargandoId(id);
    startTransition(async () => {
      const detalle = await getPerfilDetalleAction(id);
      setCargandoId(null);
      if (!detalle) return;
      setEditando(detalle);
      setModo("edit");
      setModalAbierto(true);
    });
  };

  const alGuardar = () => {
    setModalAbierto(false);
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
            placeholder="Buscar perfil"
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
            Nuevo perfil
          </button>
        )}
      </div>

      {filtrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface/60 p-10 text-center text-sm text-muted">
          {perfiles.length === 0 ? "No hay perfiles." : "Sin resultados."}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtrados.map((perfil) => (
            <div
              key={perfil.id}
              className="flex flex-col rounded-2xl border border-line bg-surface p-4 shadow-soft"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:text-brand-300">
                  <UserCog className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{perfil.nombre}</p>
                  {perfil.descripcion && (
                    <p className="truncate text-xs text-muted">
                      {perfil.descripcion}
                    </p>
                  )}
                </div>
                {puedeGestionar && (
                  <PerfilActivoToggle id={perfil.id} activo={perfil.activo} />
                )}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-muted">
                  {perfil.permisosCount} permisos · {perfil.usuariosCount}{" "}
                  usuarios
                </p>
                {puedeGestionar && (
                  <button
                    type="button"
                    onClick={() => abrirEdicion(perfil.id)}
                    disabled={cargandoId === perfil.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-60 dark:hover:text-brand-300"
                  >
                    {cargandoId === perfil.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Pencil className="h-3.5 w-3.5" />
                    )}
                    Editar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={modo === "create" ? "Nuevo perfil" : "Editar perfil"}
        description={
          modo === "create"
            ? "Define un rol y los permisos que otorga."
            : editando?.nombre
        }
        size="xl"
      >
        <PerfilForm
          key={modo === "edit" ? `edit-${editando?.id}` : "create"}
          mode={modo}
          options={options}
          initial={editando ?? undefined}
          onSuccess={alGuardar}
          onCancel={() => setModalAbierto(false)}
        />
      </Modal>
    </div>
  );
}
