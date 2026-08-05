"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, KeyRound, Loader2, Upload } from "lucide-react";
import { getCsdDetalleAction, subirCsdAction } from "../actions";
import type { CsdDetalle } from "../types";

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-muted focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20";
const labelClass = "mb-1.5 block text-sm font-semibold text-ink-soft";

function formatearFecha(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "2-digit" });
}

/**
 * Certificado de Sello Digital (CSD) de una empresa/sucursal, necesario para
 * timbrar CFDI a su nombre. Se sube aparte de los datos fiscales: cambiar de
 * CSD (vencimiento, renovación) no debe obligar a re-capturar razón social/RFC.
 */
export function CsdUploader({ idEmpresa, rfcEmpresa }: { idEmpresa: number; rfcEmpresa: string }) {
  const [detalle, setDetalle] = useState<CsdDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    getCsdDetalleAction(idEmpresa).then((d) => {
      if (vivo) {
        setDetalle(d);
        setCargando(false);
      }
    });
    return () => {
      vivo = false;
    };
  }, [idEmpresa]);

  const onSubmit = (formData: FormData) => {
    setError(null);
    setExito(false);
    startTransition(async () => {
      const result = await subirCsdAction(idEmpresa, rfcEmpresa, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setExito(true);
      formRef.current?.reset();
      const actualizado = await getCsdDetalleAction(idEmpresa);
      setDetalle(actualizado);
    });
  };

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
      <div className="flex items-start gap-2">
        <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
        <div>
          <span className={labelClass}>Certificado (CSD)</span>
          <p className="text-xs text-muted">
            El Certificado de Sello Digital tramitado ante el SAT para este RFC — necesario para timbrar CFDI.
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-line pt-4">
        {cargando ? (
          <p className="text-sm text-muted">Consultando…</p>
        ) : detalle?.tieneCsd ? (
          <p className="flex items-center gap-2 text-sm text-ink">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            Certificado No. {detalle.numeroCertificado}
            {detalle.validoHasta ? ` · vigente hasta ${formatearFecha(detalle.validoHasta)}` : ""}
          </p>
        ) : (
          <p className="text-sm text-muted">Esta empresa aún no tiene un CSD cargado.</p>
        )}

        <form ref={formRef} action={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <span className={labelClass}>Certificado (.cer)</span>
            <input className={inputClass} type="file" name="cer" accept=".cer" required />
          </div>
          <div>
            <span className={labelClass}>Llave privada (.key)</span>
            <input className={inputClass} type="file" name="key" accept=".key" required />
          </div>
          <div>
            <span className={labelClass}>Contraseña de la llave</span>
            <input className={inputClass} type="password" name="password" required />
          </div>

          {error && (
            <p className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-500 sm:col-span-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}
          {exito && (
            <p className="text-sm font-medium text-emerald-600 sm:col-span-3">Certificado guardado correctamente.</p>
          )}

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 disabled:opacity-70 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {detalle?.tieneCsd ? "Reemplazar certificado" : "Subir certificado"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
