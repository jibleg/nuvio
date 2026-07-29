"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

/**
 * Panel lateral deslizante, theme-aware y alineado al design system. Se usa para
 * formas con pocos campos. Bloquea el scroll del fondo; cierra con Escape o clic
 * fuera. En móvil ocupa casi todo el ancho.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  side = "right",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  side?: "right" | "left";
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

  const desde = side === "right" ? "100%" : "-100%";
  const anclaje = side === "right" ? "ml-auto" : "mr-auto";

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex bg-ink/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            initial={{ x: desde }}
            animate={{ x: 0 }}
            exit={{ x: desde }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={`${anclaje} flex h-full w-full max-w-md flex-col border-line bg-surface shadow-glow ${side === "right" ? "border-l" : "border-r"}`}
          >
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
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
