"use client";

import { Eye, EyeOff, ExternalLink } from "lucide-react";

const CLASE_PRIMARIO =
  "inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500";
const CLASE_SECUNDARIO =
  "inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700 dark:hover:text-brand-300";

/**
 * Botón que alterna la vista previa embebida (`PdfPreviewPanel`) — antes
 * abría el PDF en una pestaña nueva (`target="_blank"`); el usuario pidió
 * que el visor viva en la misma página. El estado (`abierto`) lo controla
 * el componente padre para poder colocar el panel donde corresponda en su
 * layout (dentro o fuera del `Card` de acciones, según la vista).
 */
export function PdfToggleButton({
  abierto,
  onToggle,
  label,
  variant = "secondary",
}: {
  abierto: boolean;
  onToggle: () => void;
  label: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <button type="button" onClick={onToggle} className={variant === "primary" ? CLASE_PRIMARIO : CLASE_SECUNDARIO}>
      {abierto ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      {abierto ? "Ocultar PDF" : label}
    </button>
  );
}

/** Panel con el PDF embebido (mismo endpoint que antes se abría aparte) — un `<iframe>` in-page, con acceso rápido a abrirlo en pestaña nueva para imprimir. */
export function PdfPreviewPanel({ src }: { src: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line shadow-soft">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-cloud/40 px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">Vista previa</span>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-brand-700 dark:hover:text-brand-300"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Abrir en pestaña nueva
        </a>
      </div>
      <iframe src={src} title="Vista previa del PDF" className="h-[75vh] w-full bg-cloud/20" />
    </div>
  );
}
