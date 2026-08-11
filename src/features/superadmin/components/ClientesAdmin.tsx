"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { resolveModulos } from "@/config/modules";
import { getPlan } from "@/config/plans";
import { ModuleIcon } from "@/features/modulos/components/module-icons";
import { ClienteActivoToggle } from "./ClienteActivoToggle";
import { ClienteAmbienteToggle } from "./ClienteAmbienteToggle";
import { ClienteForm } from "./ClienteForm";
import { deleteClienteAction, getClienteDetalleAction } from "../actions";
import type { ClienteDetalle, ClienteListItem } from "../types";

function formatFecha(date: Date): string {
  const dia = String(date.getDate()).padStart(2, "0");
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${date.getFullYear()}`;
}

const TAMANOS_PAGINA = [10, 20, 30] as const;

export function ClientesAdmin({ clientes }: { clientes: ClienteListItem[] }) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modo, setModo] = useState<"create" | "edit">("create");
  const [editando, setEditando] = useState<ClienteDetalle | null>(null);
  const [cargandoId, setCargandoId] = useState<number | null>(null);
  const [porEliminar, setPorEliminar] = useState<ClienteListItem | null>(null);
  const [pagina, setPagina] = useState(1);
  const [tamanoPagina, setTamanoPagina] = useState<number>(TAMANOS_PAGINA[0]);
  const [, startTransition] = useTransition();

  const filtrados = clientes.filter((c) => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return true;
    return c.nombre.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
  });

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / tamanoPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * tamanoPagina;
  const paginados = filtrados.slice(inicio, inicio + tamanoPagina);

  useEffect(() => {
    setPagina(1);
  }, [busqueda, tamanoPagina]);

  const abrirNuevo = () => {
    setModo("create");
    setEditando(null);
    setModalAbierto(true);
  };

  const abrirEdicion = (id: number) => {
    setCargandoId(id);
    startTransition(async () => {
      const detalle = await getClienteDetalleAction(id);
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
            placeholder="Buscar por nombre o slug"
            className="w-full rounded-full border border-line bg-surface py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-brand-400"
          />
        </div>
        <button
          type="button"
          onClick={abrirNuevo}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
        >
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </button>
      </div>

      {filtrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface/60 p-10 text-center text-sm text-muted">
          {clientes.length === 0
            ? "Aún no hay clientes dados de alta."
            : "Sin resultados para tu búsqueda."}
        </div>
      ) : (
        <>
          <div className="hidden overflow-visible rounded-2xl border border-line bg-surface shadow-soft md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Módulos</th>
                  <th className="px-5 py-3">Empresas</th>
                  <th className="px-5 py-3">Usuarios</th>
                  <th className="px-5 py-3">Alta</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Facturación</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginados.map((cliente) => (
                  <tr
                    key={cliente.id}
                    className="border-b border-line/60 last:border-0 hover:bg-cloud/50"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <ClienteAvatar nombre={cliente.nombre} />
                        <div className="min-w-0">
                          <p className="font-semibold text-ink">{cliente.nombre}</p>
                          <p className="truncate text-xs text-muted">
                            {cliente.slug}.nuvio.app
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <PlanBadge plan={cliente.plan} />
                    </td>
                    <td className="px-5 py-3.5">
                      <ModulosChips moduloKeys={cliente.moduloKeys} />
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft">
                      <EmpresasCount cliente={cliente} />
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft">{cliente.usuariosCount}</td>
                    <td className="px-5 py-3.5 text-ink-soft">
                      {formatFecha(new Date(cliente.fechaAlta))}
                    </td>
                    <td className="px-5 py-3.5">
                      <ClienteActivoToggle id={cliente.id} activo={cliente.activo} />
                    </td>
                    <td className="px-5 py-3.5">
                      <ClienteAmbienteToggle id={cliente.id} ambiente={cliente.ambienteTimbrado} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <ClienteAccionesMenu
                        cargando={cargandoId === cliente.id}
                        onEditar={() => abrirEdicion(cliente.id)}
                        onEliminar={() => setPorEliminar(cliente)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {paginados.map((cliente) => (
              <div
                key={cliente.id}
                className="rounded-2xl border border-line bg-surface p-4 shadow-soft"
              >
                <div className="flex items-start gap-3">
                  <ClienteAvatar nombre={cliente.nombre} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{cliente.nombre}</p>
                    <p className="truncate text-xs text-muted">{cliente.slug}.nuvio.app</p>
                  </div>
                  <ClienteActivoToggle id={cliente.id} activo={cliente.activo} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <PlanBadge plan={cliente.plan} />
                  <ClienteAmbienteToggle id={cliente.id} ambiente={cliente.ambienteTimbrado} />
                </div>
                <div className="mt-3">
                  <ModulosChips moduloKeys={cliente.moduloKeys} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      <EmpresasCount cliente={cliente} />
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {cliente.usuariosCount}
                    </span>
                  </div>
                  <ClienteAccionesMenu
                    cargando={cargandoId === cliente.id}
                    onEditar={() => abrirEdicion(cliente.id)}
                    onEliminar={() => setPorEliminar(cliente)}
                  />
                </div>
              </div>
            ))}
          </div>

          <Paginacion
            total={filtrados.length}
            pagina={paginaActual}
            totalPaginas={totalPaginas}
            tamanoPagina={tamanoPagina}
            onCambiarPagina={setPagina}
            onCambiarTamano={setTamanoPagina}
          />
        </>
      )}

      <Modal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={modo === "create" ? "Nuevo cliente" : "Editar cliente"}
        description={
          modo === "create"
            ? "Da de alta un cliente, su primera empresa y su administrador."
            : editando?.nombre
        }
        size="xl"
        closeOnOverlayClick={false}
      >
        <ClienteForm
          key={modo === "edit" ? `edit-${editando?.id}` : "create"}
          mode={modo}
          initial={editando ?? undefined}
          onSuccess={alGuardar}
          onCancel={() => setModalAbierto(false)}
        />
      </Modal>

      <EliminarClienteModal cliente={porEliminar} onClose={() => setPorEliminar(null)} />
    </div>
  );
}

function Paginacion({
  total,
  pagina,
  totalPaginas,
  tamanoPagina,
  onCambiarPagina,
  onCambiarTamano,
}: {
  total: number;
  pagina: number;
  totalPaginas: number;
  tamanoPagina: number;
  onCambiarPagina: (pagina: number) => void;
  onCambiarTamano: (tamano: number) => void;
}) {
  const inicio = total === 0 ? 0 : (pagina - 1) * tamanoPagina + 1;
  const fin = Math.min(pagina * tamanoPagina, total);

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-muted">
        Mostrando <span className="font-medium text-ink-soft">{inicio}–{fin}</span> de{" "}
        <span className="font-medium text-ink-soft">{total}</span>{" "}
        {total === 1 ? "cliente" : "clientes"}
      </p>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-muted">
          Por página
          <div className="relative">
            <select
              value={tamanoPagina}
              onChange={(e) => onCambiarTamano(Number(e.target.value))}
              className="appearance-none rounded-full border border-line bg-surface py-1.5 pl-3 pr-7 text-xs font-medium text-ink outline-none transition-colors focus:border-brand-400"
            >
              {TAMANOS_PAGINA.map((tamano) => (
                <option key={tamano} value={tamano}>
                  {tamano}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          </div>
        </label>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onCambiarPagina(pagina - 1)}
            disabled={pagina <= 1}
            aria-label="Página anterior"
            className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-soft dark:hover:text-brand-300"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-18 text-center text-xs font-medium text-ink-soft">
            Página {pagina} de {totalPaginas}
          </span>
          <button
            type="button"
            onClick={() => onCambiarPagina(pagina + 1)}
            disabled={pagina >= totalPaginas}
            aria-label="Página siguiente"
            className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-soft dark:hover:text-brand-300"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanBadge({ plan: planKey }: { plan: ClienteListItem["plan"] }) {
  const plan = getPlan(planKey);
  return (
    <span className="inline-flex items-center rounded-full bg-cloud px-2.5 py-0.5 text-xs font-semibold text-ink-soft">
      {plan?.nombre ?? planKey}
    </span>
  );
}

/** Empresas usadas vs. el límite del plan contratado (sin límite = solo el conteo). */
function EmpresasCount({ cliente }: { cliente: ClienteListItem }) {
  const plan = getPlan(cliente.plan);
  const max = plan?.maxEmpresas ?? null;
  return (
    <>
      {cliente.empresasCount}
      {max !== null && <span className="text-muted">/{max}</span>}
    </>
  );
}

function ModulosChips({ moduloKeys }: { moduloKeys: string[] }) {
  const modulos = resolveModulos(moduloKeys);
  return (
    <div className="flex flex-wrap gap-1">
      {modulos.map((modulo) => (
        <span
          key={modulo.key}
          title={modulo.nombre}
          className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:text-brand-200"
        >
          <ModuleIcon name={modulo.icon} className="h-3 w-3" />
          {modulo.nombre}
        </span>
      ))}
    </div>
  );
}

function ClienteAvatar({ nombre }: { nombre: string }) {
  return (
    <span
      aria-hidden
      title={nombre}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-aurora-500 text-white"
    >
      <Building2 className="h-4 w-4" />
    </span>
  );
}

function ClienteAccionesMenu({
  cargando,
  onEditar,
  onEliminar,
}: {
  cargando: boolean;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Espacio estimado del menú (2 ítems); si no cabe debajo del botón, se abre hacia arriba.
  const MENU_HEIGHT_PX = 96;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggleOpen = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const espacioAbajo = window.innerHeight - rect.bottom;
      setOpenUp(espacioAbajo < MENU_HEIGHT_PX);
    }
    setOpen((v) => !v);
  };

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={toggleOpen}
        disabled={cargando}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Acciones"
        className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-60 dark:hover:text-brand-300"
      >
        {cargando ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MoreVertical className="h-4 w-4" />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute right-0 z-20 w-40 overflow-hidden rounded-xl border border-line bg-surface shadow-glow ${
            openUp ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onEditar();
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-ink transition-colors hover:bg-cloud"
          >
            <Pencil className="h-4 w-4 text-muted" />
            Editar
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onEliminar();
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

function EliminarClienteModal({
  cliente,
  onClose,
}: {
  cliente: ClienteListItem | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onConfirmar = () => {
    if (!cliente) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteClienteAction(cliente.id);
      if (result?.error) {
        setError(result.error);
        return;
      }
      onClose();
      router.refresh();
    });
  };

  return (
    <Modal
      open={Boolean(cliente)}
      onClose={onClose}
      title="Eliminar cliente"
      description={cliente?.nombre}
      size="sm"
    >
      {cliente && (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-sm text-ink">
              Esto elimina permanentemente a <strong>{cliente.nombre}</strong>{" "}
              ({cliente.slug}.nuvio.app), sus {cliente.empresasCount}{" "}
              {cliente.empresasCount === 1 ? "empresa" : "empresas"} y sus{" "}
              {cliente.usuariosCount} {cliente.usuariosCount === 1 ? "usuario" : "usuarios"}.
              Esta acción no se puede deshacer.
            </p>
          </div>

          {error && (
            <p className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-500">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onConfirmar}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-red-700 disabled:opacity-70"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Sí, eliminar cliente
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:text-brand-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
