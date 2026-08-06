"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, AlertTriangle, Ban, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { CatalogoItem } from "@/lib/cfdi/catalogos";
import type { CodigoMotivo } from "@/lib/finkok/cancel-soap";
import { cancelarPagoAction, listMotivosCancelacionAction } from "../actions";

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-muted focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20";
const labelClass = "mb-1.5 block text-sm font-semibold text-ink-soft";

export function CancelarPagoModal({ open, idPago, onClose }: { open: boolean; idPago: number; onClose: () => void }) {
  const router = useRouter();
  const [motivos, setMotivos] = useState<CatalogoItem[]>([]);
  const [motivo, setMotivo] = useState<CodigoMotivo>("02");
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      // Un complemento de pago no tiene sustitución: se excluye el motivo "01".
      listMotivosCancelacionAction().then((lista) => setMotivos(lista.filter((m) => m.clave !== "01")));
      setError(null);
      setMensaje(null);
      setMotivo("02");
    }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Cancelar complemento de pago" description="Solicitud de cancelación ante el SAT" size="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-ink">
            Al cancelarse, el saldo de las facturas que este pago liquidaba vuelve a aparecer como pendiente de cobro.
          </p>
        </div>

        <div>
          <span className={labelClass}>Motivo</span>
          <select className={inputClass} value={motivo} onChange={(e) => setMotivo(e.target.value as CodigoMotivo)}>
            {motivos.map((m) => (
              <option key={m.id} value={m.clave}>
                {m.clave} — {m.descripcion ?? m.clave}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}
        {mensaje && <p className="rounded-xl border border-line bg-cloud/40 px-3.5 py-2.5 text-sm font-medium text-ink">{mensaje}</p>}

        <div className="flex items-center gap-3 border-t border-line pt-4">
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setError(null);
              setMensaje(null);
              startTransition(async () => {
                const result = await cancelarPagoAction(idPago, motivo);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                setMensaje(result.mensaje);
                router.refresh();
              });
            }}
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-red-700 disabled:opacity-70"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
            Solicitar cancelación
          </button>
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:text-brand-600">
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
