"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { StaffActivoToggle } from "./StaffActivoToggle";
import { StaffForm } from "./StaffForm";
import { deleteStaffAction, getStaffDetalleAction } from "../actions";
import type { StaffDetalle, StaffListItem } from "../types";

function formatFecha(date: Date): string {
  const dia = String(date.getDate()).padStart(2, "0");
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${date.getFullYear()}`;
}

/** `staff` viene ya ordenado por fecha de alta; `currentId` es la cuenta con la que se inició sesión (para bloquear auto-desactivación/auto-eliminación). */
export function StaffAdmin({ staff, currentId }: { staff: StaffListItem[]; currentId: number }) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modo, setModo] = useState<"create" | "edit">("create");
  const [editando, setEditando] = useState<StaffDetalle | null>(null);
  const [cargandoId, setCargandoId] = useState<number | null>(null);
  const [porEliminar, setPorEliminar] = useState<StaffListItem | null>(null);
  const [, startTransition] = useTransition();

  const filtrados = staff.filter((s) => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return true;
    return s.nombre.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  const abrirNuevo = () => {
    setModo("create");
    setEditando(null);
    setModalAbierto(true);
  };

  const abrirEdicion = (id: number) => {
    setCargandoId(id);
    startTransition(async () => {
      const detalle = await getStaffDetalleAction(id);
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
            placeholder="Buscar por nombre o correo"
            className="w-full rounded-full border border-line bg-surface py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-brand-400"
          />
        </div>
        <button
          type="button"
          onClick={abrirNuevo}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
        >
          <Plus className="h-4 w-4" />
          Nueva cuenta
        </button>
      </div>

      {filtrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface/60 p-10 text-center text-sm text-muted">
          {staff.length === 0 ? "Aún no hay cuentas de staff." : "Sin resultados para tu búsqueda."}
        </div>
      ) : (
        <>
          <div className="hidden overflow-visible rounded-2xl border border-line bg-surface shadow-soft md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-5 py-3">Cuenta</th>
                  <th className="px-5 py-3">Alta</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((s) => (
                  <tr key={s.id} className="border-b border-line/60 last:border-0 hover:bg-cloud/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <StaffAvatar nombre={s.nombre} />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 font-semibold text-ink">
                            {s.nombre}
                            {s.id === currentId && (
                              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                                Tú
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-muted">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft">{formatFecha(new Date(s.fechaAlta))}</td>
                    <td className="px-5 py-3.5">
                      <StaffActivoToggle id={s.id} activo={s.activo} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <StaffAccionesMenu
                        cargando={cargandoId === s.id}
                        esUnoMismo={s.id === currentId}
                        onEditar={() => abrirEdicion(s.id)}
                        onEliminar={() => setPorEliminar(s)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {filtrados.map((s) => (
              <div key={s.id} className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
                <div className="flex items-start gap-3">
                  <StaffAvatar nombre={s.nombre} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 font-semibold text-ink">
                      {s.nombre}
                      {s.id === currentId && (
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                          Tú
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted">{s.email}</p>
                  </div>
                  <StaffActivoToggle id={s.id} activo={s.activo} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted">Alta: {formatFecha(new Date(s.fechaAlta))}</p>
                  <StaffAccionesMenu
                    cargando={cargandoId === s.id}
                    esUnoMismo={s.id === currentId}
                    onEditar={() => abrirEdicion(s.id)}
                    onEliminar={() => setPorEliminar(s)}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={modo === "create" ? "Nueva cuenta de staff" : "Editar cuenta"}
        description={
          modo === "create" ? "Da de alta a alguien del equipo con acceso al panel interno." : editando?.nombre
        }
        size="lg"
        closeOnOverlayClick={false}
      >
        <StaffForm
          key={modo === "edit" ? `edit-${editando?.id}` : "create"}
          mode={modo}
          initial={editando ?? undefined}
          esUnoMismo={editando?.id === currentId}
          onSuccess={alGuardar}
          onCancel={() => setModalAbierto(false)}
        />
      </Modal>

      <EliminarStaffModal staff={porEliminar} onClose={() => setPorEliminar(null)} />
    </div>
  );
}

function StaffAvatar({ nombre }: { nombre: string }) {
  return (
    <span
      aria-hidden
      title={nombre}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-aurora-500 text-white"
    >
      <ShieldCheck className="h-4 w-4" />
    </span>
  );
}

function StaffAccionesMenu({
  cargando,
  esUnoMismo,
  onEditar,
  onEliminar,
}: {
  cargando: boolean;
  esUnoMismo: boolean;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
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
        {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
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
          {!esUnoMismo && (
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
          )}
        </div>
      )}
    </div>
  );
}

function EliminarStaffModal({ staff, onClose }: { staff: StaffListItem | null; onClose: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onConfirmar = () => {
    if (!staff) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteStaffAction(staff.id);
      if (result?.error) {
        setError(result.error);
        return;
      }
      onClose();
      router.refresh();
    });
  };

  return (
    <Modal open={Boolean(staff)} onClose={onClose} title="Eliminar cuenta de staff" description={staff?.nombre} size="sm">
      {staff && (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-sm text-ink">
              Esto elimina permanentemente el acceso de <strong>{staff.nombre}</strong> ({staff.email}) al panel
              interno. Esta acción no se puede deshacer.
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
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Sí, eliminar cuenta
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
