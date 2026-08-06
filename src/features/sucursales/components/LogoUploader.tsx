"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, ImageIcon, Loader2, Upload } from "lucide-react";
import { getLogoDetalleAction, subirLogoAction } from "../actions";
import type { LogoDetalle } from "../types";

const labelClass = "mb-1.5 block text-sm font-semibold text-ink-soft";

/**
 * Logo del emisor para el hero de la representación impresa (PDF) de
 * facturas y complementos de pago. Igual que el CSD, se sube aparte de los
 * datos fiscales: cambiar el logo no debe obligar a re-capturar nada más.
 */
export function LogoUploader({ idEmpresa }: { idEmpresa: number }) {
  const [detalle, setDetalle] = useState<LogoDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    getLogoDetalleAction(idEmpresa).then((d) => {
      if (vivo) {
        setDetalle(d);
        setCargando(false);
      }
    });
    return () => {
      vivo = false;
    };
  }, [idEmpresa]);

  const cacheBuster = useRef(0);

  const onSubmit = (formData: FormData) => {
    setError(null);
    setExito(false);
    startTransition(async () => {
      const result = await subirLogoAction(idEmpresa, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setExito(true);
      formRef.current?.reset();
      setPreviewUrl(null);
      cacheBuster.current += 1;
      const actualizado = await getLogoDetalleAction(idEmpresa);
      setDetalle(actualizado);
    });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const urlLogoActual = detalle?.tieneLogo
    ? `/administracion/sucursales/${idEmpresa}/logo?v=${cacheBuster.current}`
    : null;

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
      <div className="flex items-start gap-2">
        <ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
        <div>
          <span className={labelClass}>Logo</span>
          <p className="text-xs text-muted">
            Aparece en el encabezado de las facturas y complementos de pago que emita esta empresa.
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-4 border-t border-line pt-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-cloud/50">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Vista previa del logo" className="h-full w-full object-contain" />
          ) : cargando ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted" />
          ) : urlLogoActual ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={urlLogoActual} alt="Logo actual" className="h-full w-full object-contain" />
          ) : (
            <ImageIcon className="h-5 w-5 text-muted" />
          )}
        </div>

        <form ref={formRef} action={onSubmit} className="flex-1 space-y-3">
          <input
            className="block w-full text-sm text-ink file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-3.5 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100 dark:file:text-brand-200"
            type="file"
            name="logo"
            accept="image/png,image/jpeg"
            onChange={onFileChange}
            required
          />

          {error && (
            <p className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-500">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}
          {exito && (
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-600">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Logo guardado correctamente.
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 disabled:opacity-70 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {detalle?.tieneLogo ? "Reemplazar logo" : "Subir logo"}
          </button>
        </form>
      </div>
    </div>
  );
}
