"use client";

import { useState, useTransition } from "react";
import { FlaskConical, Loader2, Radio } from "lucide-react";
import { confirmToast, notifyError, notifySuccess } from "@/lib/toast";
import { toggleClienteAmbienteTimbradoAction } from "../actions";

/**
 * Aprueba (o revoca) al cliente para timbrar en producción — el gate de
 * Finkok que solo el panel interno puede mover. Pasar a producción es el
 * "sí" que desbloquea el toggle por sucursal que el propio tenant controla
 * (ver `@/features/sucursales/components/AmbienteFacturacionToggle`), así que
 * pide confirmación explícita en vez de ser un switch de un solo clic.
 */
export function ClienteAmbienteToggle({
  id,
  ambiente,
}: {
  id: number;
  ambiente: "sandbox" | "produccion";
}) {
  const [actual, setActual] = useState(ambiente);
  const [isPending, startTransition] = useTransition();

  const onToggle = async () => {
    const nuevo = actual === "produccion" ? "sandbox" : "produccion";
    if (nuevo === "produccion") {
      const confirmado = await confirmToast(
        "Vas a aprobar a este cliente para facturar en producción: podrá timbrar CFDI con validez fiscal real ante el SAT (en cualquier sucursal que active ese modo). ¿Confirmas la aprobación?",
        { confirmLabel: "Sí, aprobar" },
      );
      if (!confirmado) return;
    }

    startTransition(async () => {
      const result = await toggleClienteAmbienteTimbradoAction(id, nuevo);
      if (result?.error) {
        notifyError(result.error);
        return;
      }
      setActual(nuevo);
      notifySuccess(nuevo === "produccion" ? "Cliente aprobado para producción." : "Cliente regresado a sandbox.");
    });
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-60 ${
        actual === "produccion"
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
          : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
      }`}
    >
      {isPending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : actual === "produccion" ? (
        <Radio className="h-3 w-3" />
      ) : (
        <FlaskConical className="h-3 w-3" />
      )}
      {actual === "produccion" ? "Producción" : "Sandbox"}
    </button>
  );
}
