"use client";

import { useState, useTransition } from "react";
import { AlertCircle, FlaskConical, Loader2, Radio } from "lucide-react";
import { confirmToast, notifyError, notifySuccess } from "@/lib/toast";
import { setSucursalAmbienteFacturacionAction } from "../actions";
import type { AmbienteFacturacion } from "../types";

const labelClass = "mb-1.5 block text-sm font-semibold text-ink-soft";

/**
 * Alterna el ambiente de Finkok con el que factura esta empresa: 'sandbox'
 * (demo, sin validez fiscal — para validar la configuración) o 'produccion'
 * (SAT real). Pasar a producción sigue exigiendo que Nuvio ya haya aprobado
 * la cuenta (`ambienteCuenta`, ver la acción); si no, el botón queda
 * deshabilitado con el motivo a la vista, en vez de fallar en silencio.
 */
export function AmbienteFacturacionToggle({
  idEmpresa,
  ambiente,
  ambienteCuenta,
}: {
  idEmpresa: number;
  ambiente: AmbienteFacturacion;
  ambienteCuenta: AmbienteFacturacion;
}) {
  const [actual, setActual] = useState(ambiente);
  const [isPending, startTransition] = useTransition();

  const cuentaAprobada = ambienteCuenta === "produccion";

  const cambiar = async (nuevo: AmbienteFacturacion) => {
    if (nuevo === actual || isPending) return;
    if (nuevo === "produccion") {
      const confirmado = await confirmToast(
        "Vas a activar el modo Producción: a partir de ahora esta sucursal timbrará CFDI con validez fiscal real ante el SAT. ¿Confirmas que ya validaste la configuración en Demo?",
        { confirmLabel: "Sí, activar producción" },
      );
      if (!confirmado) return;
    }

    startTransition(async () => {
      const result = await setSucursalAmbienteFacturacionAction(idEmpresa, nuevo);
      if (result?.error) {
        notifyError(result.error);
        return;
      }
      setActual(nuevo);
      notifySuccess(nuevo === "produccion" ? "Producción activada." : "Demo activado.");
    });
  };

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
      <div className="flex items-start gap-2">
        {actual === "produccion" ? (
          <Radio className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
        ) : (
          <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
        )}
        <div>
          <span className={labelClass}>Ambiente de facturación</span>
          <p className="text-xs text-muted">
            En <strong>Demo</strong> los CFDI se timbran contra el ambiente de pruebas de Finkok, sin validez
            fiscal — úsalo para validar que todo esté bien configurado. En <strong>Producción</strong> el
            timbrado es real ante el SAT.
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
        <button
          type="button"
          onClick={() => cambiar("sandbox")}
          disabled={isPending}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
            actual === "sandbox"
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
              : "text-ink-soft hover:bg-cloud"
          }`}
        >
          <FlaskConical className="h-3.5 w-3.5" />
          Demo
        </button>
        <button
          type="button"
          onClick={() => cambiar("produccion")}
          disabled={isPending || (!cuentaAprobada && actual !== "produccion")}
          title={!cuentaAprobada && actual !== "produccion" ? "Tu cuenta aún no está aprobada por Nuvio para producción." : undefined}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            actual === "produccion"
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : "text-ink-soft hover:bg-cloud"
          }`}
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radio className="h-3.5 w-3.5" />}
          Producción
        </button>
      </div>

      {!cuentaAprobada && actual !== "produccion" && (
        <p className="mt-3 flex items-center gap-2 text-xs text-muted">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Tu cuenta aún no está aprobada por Nuvio para facturar en producción. Contáctanos para activarla.
        </p>
      )}
    </div>
  );
}
