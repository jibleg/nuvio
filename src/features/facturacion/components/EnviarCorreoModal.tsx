"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { enviarFacturaCorreoAction, getEmailReceptorAction } from "../actions";

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-muted focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20";

export function EnviarCorreoModal({
  open,
  idFactura,
  onClose,
}: {
  open: boolean;
  idFactura: number;
  onClose: () => void;
}) {
  const [correo, setCorreo] = useState("");
  const [cargandoCorreo, setCargandoCorreo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setError(null);
    setEnviado(false);
    setCargandoCorreo(true);
    getEmailReceptorAction(idFactura).then((email) => {
      setCorreo(email ?? "");
      setCargandoCorreo(false);
    });
  }, [open, idFactura]);

  function enviar() {
    setError(null);
    startTransition(async () => {
      const result = await enviarFacturaCorreoAction(idFactura, correo.trim());
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEnviado(true);
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Enviar factura por correo" description="Se adjunta el PDF y el XML timbrados." size="sm">
      <div className="space-y-4">
        <div>
          <span className="mb-1.5 block text-sm font-semibold text-ink-soft">Correo del destinatario</span>
          <input
            type="email"
            className={inputClass}
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder={cargandoCorreo ? "Cargando…" : "correo@cliente.com"}
            disabled={cargandoCorreo}
          />
        </div>

        {error && (
          <p className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}
        {enviado && (
          <p className="flex items-center gap-2 rounded-xl border border-brand-400/30 bg-brand-50 px-3.5 py-2.5 text-sm font-medium text-brand-700 dark:bg-brand-400/10 dark:text-brand-200">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Factura enviada correctamente.
          </p>
        )}

        <div className="flex items-center gap-3 border-t border-line pt-4">
          <button
            type="button"
            disabled={isPending || cargandoCorreo || !correo.trim()}
            onClick={enviar}
            className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 disabled:opacity-70 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar
          </button>
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:text-brand-600">
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
