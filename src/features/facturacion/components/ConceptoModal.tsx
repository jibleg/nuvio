"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { buscarClaveProdServAction, buscarClaveUnidadAction } from "../actions";
import type { ConceptoInput } from "../types";
import { ClaveSearchInput } from "./ClaveSearchInput";

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-muted focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20";
const labelClass = "mb-1.5 block text-sm font-semibold text-ink-soft";

const formatoMoneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

function vacio(): ConceptoInput {
  return {
    idServicio: 0,
    claveProdServ: "",
    idUnidad: 0,
    claveUnidad: "",
    descripcion: "",
    cantidad: 1,
    valorUnitario: 0,
    gravado: true,
  };
}

/** Alta/edición de un concepto de factura, en modal — coherente con el resto de Nuvio (Sucursales, Clientes). */
export function ConceptoModal({
  open,
  initial,
  onClose,
  onGuardar,
}: {
  open: boolean;
  initial: ConceptoInput | null;
  onClose: () => void;
  onGuardar: (concepto: ConceptoInput) => void;
}) {
  const [valores, setValores] = useState<ConceptoInput>(initial ?? vacio());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValores(initial ?? vacio());
      setError(null);
    }
  }, [open, initial]);

  function actualizar(cambios: Partial<ConceptoInput>) {
    setValores((prev) => ({ ...prev, ...cambios }));
  }

  function guardar() {
    if (!valores.idServicio) return setError("Selecciona una clave de producto/servicio.");
    if (!valores.idUnidad) return setError("Selecciona una clave de unidad.");
    if (!valores.descripcion.trim()) return setError("Captura una descripción.");
    if (!Number.isInteger(valores.cantidad) || valores.cantidad <= 0) {
      return setError("La cantidad debe ser un número entero mayor a 0.");
    }
    if (!(valores.valorUnitario > 0)) return setError("El precio unitario debe ser mayor a 0.");
    onGuardar(valores);
  }

  const importe = valores.cantidad * valores.valorUnitario;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Editar concepto" : "Agregar concepto"}
      description="Producto o servicio incluido en la factura."
      size="lg"
      closeOnOverlayClick={false}
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className={labelClass}>Clave producto/servicio (SAT)</span>
            <ClaveSearchInput
              placeholder="Buscar clave o descripción…"
              valorMostrado={valores.claveProdServ}
              buscar={buscarClaveProdServAction}
              onSeleccionar={(item) => actualizar({ idServicio: item.id, claveProdServ: item.clave })}
            />
          </div>
          <div>
            <span className={labelClass}>Clave unidad (SAT)</span>
            <ClaveSearchInput
              placeholder="Buscar unidad…"
              valorMostrado={valores.claveUnidad}
              buscar={buscarClaveUnidadAction}
              onSeleccionar={(item) => actualizar({ idUnidad: item.id, claveUnidad: item.clave })}
            />
          </div>
        </div>

        <div>
          <span className={labelClass}>Descripción</span>
          <input
            className={inputClass}
            value={valores.descripcion}
            onChange={(e) => actualizar({ descripcion: e.target.value })}
            placeholder="Lo que verá el cliente en el CFDI"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <span className={labelClass}>Cantidad</span>
            <input
              type="number"
              min={1}
              step={1}
              className={inputClass}
              value={valores.cantidad}
              onChange={(e) => actualizar({ cantidad: Number(e.target.value) })}
            />
          </div>
          <div>
            <span className={labelClass}>Precio unitario</span>
            <input
              type="number"
              min={0}
              step="0.01"
              className={inputClass}
              value={valores.valorUnitario}
              onChange={(e) => actualizar({ valorUnitario: Number(e.target.value) })}
            />
          </div>
          <div>
            <span className={labelClass}>Importe</span>
            <input className={inputClass} disabled value={formatoMoneda.format(importe)} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-line bg-cloud/40 px-3.5 py-3">
          <div>
            <p className="text-sm font-semibold text-ink">IVA 16%</p>
            <p className="text-xs text-muted">Desactívalo solo si el concepto no es objeto de impuesto.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={valores.gravado}
            aria-label="Aplica IVA 16%"
            onClick={() => actualizar({ gravado: !valores.gravado })}
          >
            <span
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${valores.gravado ? "bg-brand-500" : "bg-line"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${valores.gravado ? "translate-x-6" : "translate-x-1"}`}
              />
            </span>
          </button>
        </div>

        {error && (
          <p className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 border-t border-line pt-4">
          <button
            type="button"
            onClick={guardar}
            className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
          >
            {initial ? "Guardar cambios" : "Agregar a la factura"}
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
    </Modal>
  );
}
