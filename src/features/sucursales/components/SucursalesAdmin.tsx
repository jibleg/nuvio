"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Pencil, Plus, Store } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { getPlan, type PlanKey } from "@/config/plans";
import { SucursalActivoToggle } from "./SucursalActivoToggle";
import { SucursalForm } from "./SucursalForm";
import { getSucursalDetalleAction } from "../actions";
import type { SucursalDetalle, SucursalListItem } from "../types";

export function SucursalesAdmin({
  sucursales,
  plan: planKey,
  puedeGestionar,
  ambienteCuenta,
}: {
  sucursales: SucursalListItem[];
  plan: PlanKey;
  puedeGestionar: boolean;
  /** Ambiente de Finkok aprobado por Nuvio para la cuenta — gate del toggle de ambiente por sucursal. */
  ambienteCuenta: "sandbox" | "produccion";
}) {
  const router = useRouter();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modo, setModo] = useState<"create" | "edit">("create");
  const [editando, setEditando] = useState<SucursalDetalle | null>(null);
  const [cargandoId, setCargandoId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const plan = getPlan(planKey);
  const total = sucursales.length;
  const alTope = plan?.maxEmpresas !== null && plan !== undefined && total >= plan.maxEmpresas;

  const abrirNuevo = () => {
    setModo("create");
    setEditando(null);
    setModalAbierto(true);
  };

  const abrirEdicion = (id: number) => {
    setCargandoId(id);
    startTransition(async () => {
      const detalle = await getSucursalDetalleAction(id);
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
        <p className="text-sm text-muted">
          {plan ? (
            <>
              Plan <span className="font-semibold text-ink-soft">{plan.nombre}</span>:{" "}
              {plan.maxEmpresas === null
                ? `${total} empresa(s) (matriz + sucursales), sin límite.`
                : `${total}/${plan.maxEmpresas} empresa(s) usadas (matriz + sucursales).`}
            </>
          ) : null}
        </p>
        {puedeGestionar && (
          <button
            type="button"
            onClick={abrirNuevo}
            disabled={alTope}
            title={alTope ? `Tu plan ${plan?.nombre} no permite más empresas.` : undefined}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
          >
            <Plus className="h-4 w-4" />
            Nueva sucursal
          </button>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface shadow-soft md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-5 py-3">Sucursal</th>
              <th className="px-5 py-3">Dirección</th>
              <th className="px-5 py-3">Contacto</th>
              <th className="px-5 py-3">Estado</th>
              {puedeGestionar && <th className="px-5 py-3 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {sucursales.map((sucursal) => (
              <tr key={sucursal.id} className="border-b border-line/60 last:border-0 hover:bg-cloud/50">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-white ${
                        sucursal.esMatriz
                          ? "bg-gradient-to-br from-brand-400 to-aurora-500"
                          : "bg-gradient-to-br from-sky-400 to-sky-600"
                      }`}
                    >
                      <Store className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">
                        {sucursal.nombreCorto ?? sucursal.nombreComercial}
                      </p>
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {sucursal.esMatriz && (
                          <span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:text-brand-200">
                            Matriz
                          </span>
                        )}
                        {!sucursal.esMatriz && sucursal.esFiscalPropio && (
                          <span
                            className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                            title="Factura con razón social propia, distinta de la matriz"
                          >
                            Razón social propia
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-ink-soft">
                  {sucursal.calle || sucursal.ciudad ? (
                    <span className="inline-flex items-start gap-1.5">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
                      <span className="truncate">
                        {[sucursal.calle, sucursal.colonia, sucursal.ciudad].filter(Boolean).join(", ")}
                        {sucursal.codigoPostal ? ` C.P. ${sucursal.codigoPostal}` : ""}
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs text-muted">Sin dirección</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-ink-soft">
                  {sucursal.telefono || sucursal.email ? (
                    <div className="text-xs">
                      {sucursal.telefono && <p>{sucursal.telefono}</p>}
                      {sucursal.email && <p className="truncate">{sucursal.email}</p>}
                    </div>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  {sucursal.esMatriz ? (
                    <span className="text-xs text-muted">Siempre activa</span>
                  ) : puedeGestionar ? (
                    <SucursalActivoToggle id={sucursal.id} activo={sucursal.activo} />
                  ) : (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        sucursal.activo ? "bg-brand-50 text-brand-700 dark:text-brand-200" : "bg-cloud text-muted"
                      }`}
                    >
                      {sucursal.activo ? "Activa" : "Inactiva"}
                    </span>
                  )}
                </td>
                {puedeGestionar && (
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => abrirEdicion(sucursal.id)}
                      disabled={cargandoId === sucursal.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-60 dark:hover:text-brand-300"
                    >
                      {cargandoId === sucursal.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Pencil className="h-3.5 w-3.5" />
                      )}
                      Editar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={modo === "create" ? "Nueva sucursal" : "Editar sucursal"}
        description={modo === "create" ? "Agrega una sucursal a tu ecosistema." : editando?.nombreComercial}
        size="lg"
        closeOnOverlayClick={false}
      >
        <SucursalForm
          key={modo === "edit" ? `edit-${editando?.id}` : "create"}
          mode={modo}
          initial={editando ?? undefined}
          ambienteCuenta={ambienteCuenta}
          onSuccess={alGuardar}
          onCancel={() => setModalAbierto(false)}
        />
      </Modal>
    </div>
  );
}
