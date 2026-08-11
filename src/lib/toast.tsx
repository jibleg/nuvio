"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { toast, type Id } from "react-toastify";

/**
 * Única puerta de entrada a notificaciones y confirmaciones de usuario:
 * nunca `alert`/`confirm`/`prompt` nativos del navegador (bloquean el hilo,
 * no respetan el tema de la app, y no combinan con overlays como el Modal).
 * Todo pasa por react-toastify.
 */
export function notifySuccess(message: string): void {
  toast.success(message);
}

export function notifyError(message: string): void {
  toast.error(message);
}

/**
 * Reemplazo de `window.confirm`: un diálogo modal (centrado, con overlay que
 * bloquea el resto de la UI mientras está abierto) en vez de una toast de
 * esquina. Sigue viviendo en el ciclo de vida de react-toastify (`toast()` +
 * `toast.dismiss`) para no salirnos del sistema de notificaciones, pero su
 * contenido se porta a `document.body` con `z-[10000]` — por encima del
 * `Modal` (`z-[100]`) y del propio `ToastContainer` (`z-index: 9999` por
 * defecto) — así que también bloquea formularios abiertos detrás.
 */
export function confirmToast(
  message: string,
  opts?: { confirmLabel?: string; cancelLabel?: string },
): Promise<boolean> {
  return new Promise((resolve) => {
    let toastId: Id;
    const cerrar = (resultado: boolean) => {
      toast.dismiss(toastId);
      resolve(resultado);
    };

    toastId = toast(
      <ConfirmDialog
        message={message}
        confirmLabel={opts?.confirmLabel}
        cancelLabel={opts?.cancelLabel}
        onCancel={() => cerrar(false)}
        onConfirm={() => cerrar(true)}
      />,
      {
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        draggable: false,
        className: "!m-0 !min-h-0 !w-auto !max-w-none !bg-transparent !p-0 !shadow-none",
      },
    );
  });
}

function ConfirmDialog({
  message,
  confirmLabel,
  cancelLabel,
  onCancel,
  onConfirm,
}: {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    // Guarda el valor previo (puede ya ser "hidden" si hay un Modal abierto
    // detrás) en vez de limpiarlo a ciegas al cerrar — si no, esta
    // confirmación desbloquearía el scroll del body aunque el Modal siga abierto.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      role="presentation"
    >
      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-label={message}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm rounded-3xl border border-line bg-surface p-6 shadow-glow"
      >
        <p className="text-sm text-ink">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-3.5 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-brand-600"
          >
            {cancelLabel ?? "Cancelar"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-brand-700 px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
          >
            {confirmLabel ?? "Confirmar"}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
