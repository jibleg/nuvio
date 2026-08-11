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
 *
 * No usa `<form>` propio: este componente vive dentro del `<form>` de
 * SucursalForm, y un `<form>` anidado es HTML inválido — el parser del
 * navegador cierra el formulario exterior en cuanto encuentra el `</form>`
 * interno, dejando "Guardar cambios" fuera del formulario real. La subida se
 * dispara a mano leyendo los inputs por ref.
 */
export function CsdUploader({
  idEmpresa,
  rfcEmpresa,
  onDirtyChange,
}: {
  idEmpresa: number;
  rfcEmpresa: string;
  /** Avisa al formulario padre si hay archivos elegidos que aún no se han subido, para bloquear su guardado. */
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [detalle, setDetalle] = useState<CsdDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [isPending, startTransition] = useTransition();
  const cerRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

  const notificarSeleccion = () => {
    const hayArchivos = !!(cerRef.current?.files?.length || keyRef.current?.files?.length);
    onDirtyChange?.(hayArchivos);
  };

  const limpiarSeleccion = () => {
    if (cerRef.current) cerRef.current.value = "";
    if (keyRef.current) keyRef.current.value = "";
    if (passwordRef.current) passwordRef.current.value = "";
    onDirtyChange?.(false);
  };

  const onSubir = () => {
    setError(null);
    setExito(false);

    const cer = cerRef.current?.files?.[0];
    const key = keyRef.current?.files?.[0];
    const password = passwordRef.current?.value ?? "";
    if (!cer || !key || !password) {
      setError("Adjunta el certificado (.cer), la llave (.key) y captura la contraseña de la llave.");
      return;
    }

    const formData = new FormData();
    formData.set("cer", cer);
    formData.set("key", key);
    formData.set("password", password);

    startTransition(async () => {
      const result = await subirCsdAction(idEmpresa, rfcEmpresa, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setExito(true);
      limpiarSeleccion();
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

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <span className={labelClass}>Certificado (.cer)</span>
            <input
              className={inputClass}
              type="file"
              accept=".cer"
              ref={cerRef}
              disabled={isPending}
              onChange={notificarSeleccion}
            />
          </div>
          <div>
            <span className={labelClass}>Llave privada (.key)</span>
            <input
              className={inputClass}
              type="file"
              accept=".key"
              ref={keyRef}
              disabled={isPending}
              onChange={notificarSeleccion}
            />
          </div>
          <div>
            <span className={labelClass}>Contraseña de la llave</span>
            <input className={inputClass} type="password" ref={passwordRef} disabled={isPending} />
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
              type="button"
              onClick={onSubir}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 disabled:opacity-70 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isPending ? "Subiendo certificado…" : detalle?.tieneCsd ? "Reemplazar certificado" : "Subir certificado"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
