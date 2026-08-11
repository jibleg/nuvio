"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Loader2, Mail, Send } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { enviarFacturaCorreoAction, getEmailReceptorAction } from "../actions";

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-muted focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Un `input` de correos separados por coma no valida cada uno por su cuenta — se hace a mano para poder habilitar/deshabilitar "Enviar" con precisión. */
function parsearCorreos(valor: string): { partes: string[]; validos: string[]; hayInvalidos: boolean } {
  const partes = valor
    .split(",")
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
  const validos = partes.filter((c) => EMAIL_REGEX.test(c));
  return { partes, validos, hayInvalidos: partes.length > 0 && validos.length !== partes.length };
}

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

  const { partes, validos, hayInvalidos } = useMemo(() => parsearCorreos(correo), [correo]);
  const puedeEnviar = partes.length > 0 && !hayInvalidos;

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
    if (!puedeEnviar) return;
    setError(null);
    startTransition(async () => {
      const result = await enviarFacturaCorreoAction(idFactura, validos);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEnviado(true);
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Enviar factura por correo"
      size="sm"
      hero={
        <div className="bg-linear-to-br from-brand-600 to-brand-800 px-6 py-7">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              <Mail className="h-5 w-5 text-white" />
            </span>
            <div className="min-w-0 pr-10">
              <p className="font-display text-lg font-bold text-white">Enviar factura por correo</p>
              <p className="mt-0.5 text-sm text-white/75">Se adjunta el PDF y el XML timbrados</p>
            </div>
          </div>
          <div className="mt-5 h-1 rounded-full bg-aurora-400/70" />
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <span className="mb-1.5 block text-sm font-semibold text-ink-soft">Correo del destinatario</span>
          <input
            type="text"
            className={inputClass}
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder={cargandoCorreo ? "Cargando…" : "correo@cliente.com, otro@cliente.com"}
            disabled={cargandoCorreo}
          />
          <p className="mt-1.5 text-xs text-muted">Puedes separar varios correos con coma.</p>
          {hayInvalidos && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-500">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Revisa los correos capturados — alguno no es válido.
            </p>
          )}
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
            disabled={isPending || cargandoCorreo || !puedeEnviar}
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
