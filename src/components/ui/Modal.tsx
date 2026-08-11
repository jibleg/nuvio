"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

type ModalSize = "sm" | "md" | "lg" | "xl";

const SIZES: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

/**
 * Diálogo centrado, theme-aware y alineado al design system. Se usa para formas
 * con varios campos. Bloquea el scroll del fondo, cierra con Escape o clic fuera.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  size = "lg",
  closeOnOverlayClick = true,
  hero,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: ModalSize;
  /** Si es false, el clic en el fondo no cierra el modal (Escape y el botón X siguen funcionando). */
  closeOnOverlayClick?: boolean;
  /** Reemplaza el header plano por contenido a medida (p. ej. un hero de color) — `title` se sigue usando para `aria-label`. El botón de cerrar se dibuja encima, listo para fondos oscuros. */
  hero?: ReactNode;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeOnOverlayClick ? onClose : undefined}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className={`flex max-h-[92dvh] w-full ${SIZES[size]} flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-glow sm:rounded-3xl`}
          >
            {hero ? (
              <div className="relative shrink-0">
                {hero}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="absolute right-4 top-4 grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
                  {description && (
                    <p className="mt-0.5 text-sm text-muted">{description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-cloud hover:text-ink"
                >
                  <X className="h-5 w-5" />
                </button>
              </header>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
