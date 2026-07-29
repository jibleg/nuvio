"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Search, UserPlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { UsuarioActivoToggle } from "./UsuarioActivoToggle";
import { UsuarioForm } from "./UsuarioForm";
import { getUsuarioDetalleAction } from "../actions";
import type {
  UsuarioDetalle,
  UsuarioFormOptions,
  UsuarioListItem,
} from "../types";

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  return (partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "");
}

export function UsuariosAdmin({
  usuarios,
  options,
  puedeGestionar,
}: {
  usuarios: UsuarioListItem[];
  options: UsuarioFormOptions;
  puedeGestionar: boolean;
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modo, setModo] = useState<"create" | "edit">("create");
  const [editando, setEditando] = useState<UsuarioDetalle | null>(null);
  const [cargandoId, setCargandoId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const filtrados = usuarios.filter((u) => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return true;
    return (
      u.nombre.toLowerCase().includes(q) ||
      u.login.toLowerCase().includes(q) ||
      (u.email?.toLowerCase().includes(q) ?? false)
    );
  });

  const abrirNuevo = () => {
    setModo("create");
    setEditando(null);
    setModalAbierto(true);
  };

  const abrirEdicion = (id: number) => {
    setCargandoId(id);
    startTransition(async () => {
      const detalle = await getUsuarioDetalleAction(id);
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
      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, usuario o correo"
            className="w-full rounded-full border border-line bg-surface py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-brand-400"
          />
        </div>
        {puedeGestionar && (
          <button
            type="button"
            onClick={abrirNuevo}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
          >
            <UserPlus className="h-4 w-4" />
            Nuevo usuario
          </button>
        )}
      </div>

      {filtrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface/60 p-10 text-center text-sm text-muted">
          {usuarios.length === 0
            ? "No hay usuarios para mostrar."
            : "Sin resultados para tu búsqueda."}
        </div>
      ) : (
        <>
          {/* Escritorio: tabla */}
          <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface shadow-soft md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-5 py-3">Usuario</th>
                  <th className="px-5 py-3">Perfiles</th>
                  <th className="px-5 py-3">Empresas</th>
                  <th className="px-5 py-3">Estado</th>
                  {puedeGestionar && <th className="px-5 py-3 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((usuario) => (
                  <tr
                    key={usuario.id}
                    className="border-b border-line/60 last:border-0 hover:bg-cloud/50"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar nombre={usuario.nombre} />
                        <div className="min-w-0">
                          <p className="font-semibold text-ink">{usuario.nombre}</p>
                          <p className="truncate text-xs text-muted">
                            @{usuario.login}
                            {usuario.email ? ` · ${usuario.email}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <ChipsPerfiles perfiles={usuario.perfiles} />
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft">
                      {usuario.empresasCount}
                    </td>
                    <td className="px-5 py-3.5">
                      {puedeGestionar ? (
                        <UsuarioActivoToggle id={usuario.id} activo={usuario.activo} />
                      ) : (
                        <EstadoBadge activo={usuario.activo} />
                      )}
                    </td>
                    {puedeGestionar && (
                      <td className="px-5 py-3.5 text-right">
                        <BotonEditar
                          onClick={() => abrirEdicion(usuario.id)}
                          cargando={cargandoId === usuario.id}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Móvil: tarjetas */}
          <div className="space-y-3 md:hidden">
            {filtrados.map((usuario) => (
              <div
                key={usuario.id}
                className="rounded-2xl border border-line bg-surface p-4 shadow-soft"
              >
                <div className="flex items-start gap-3">
                  <Avatar nombre={usuario.nombre} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{usuario.nombre}</p>
                    <p className="truncate text-xs text-muted">
                      @{usuario.login}
                      {usuario.email ? ` · ${usuario.email}` : ""}
                    </p>
                  </div>
                  {puedeGestionar ? (
                    <UsuarioActivoToggle id={usuario.id} activo={usuario.activo} />
                  ) : (
                    <EstadoBadge activo={usuario.activo} />
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <ChipsPerfiles perfiles={usuario.perfiles} />
                  {puedeGestionar && (
                    <BotonEditar
                      onClick={() => abrirEdicion(usuario.id)}
                      cargando={cargandoId === usuario.id}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={modo === "create" ? "Nuevo usuario" : "Editar usuario"}
        description={
          modo === "create"
            ? "Crea una cuenta y asígnale perfiles, empresas y módulos."
            : editando?.nombre
        }
        size="xl"
      >
        <UsuarioForm
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

function Avatar({ nombre }: { nombre: string }) {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-aurora-500 text-xs font-bold uppercase text-white">
      {iniciales(nombre)}
    </span>
  );
}

function ChipsPerfiles({ perfiles }: { perfiles: string[] }) {
  if (perfiles.length === 0) {
    return <span className="text-xs text-muted">Sin perfil</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {perfiles.map((perfil) => (
        <span
          key={perfil}
          className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:text-brand-200"
        >
          {perfil}
        </span>
      ))}
    </div>
  );
}

function EstadoBadge({ activo }: { activo: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        activo
          ? "bg-brand-50 text-brand-700 dark:text-brand-200"
          : "bg-cloud text-muted"
      }`}
    >
      {activo ? "Activo" : "Inactivo"}
    </span>
  );
}

function BotonEditar({
  onClick,
  cargando,
}: {
  onClick: () => void;
  cargando: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={cargando}
      className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-60 dark:hover:text-brand-300"
    >
      {cargando ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Pencil className="h-3.5 w-3.5" />
      )}
      Editar
    </button>
  );
}
