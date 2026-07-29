"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, Check, ChevronDown, Loader2 } from "lucide-react";
import type { Empresa } from "@/features/empresas";
import { useSession } from "./SessionProvider";
import { switchEmpresaAction } from "../actions";

function iniciales(empresa: Empresa): string {
  const base = empresa.nombreCorto ?? empresa.nombreComercial;
  return base.trim().slice(0, 2).toUpperCase();
}

export function EmpresaSwitcher() {
  const { empresaActiva, empresas } = useSession();
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const seleccionar = (empresa: Empresa) => {
    if (empresa.id === empresaActiva?.id) {
      setOpen(false);
      return;
    }
    setPendingId(empresa.id);
    startTransition(() => switchEmpresaAction(empresa.id));
    setOpen(false);
  };

  // Una sola empresa: indicador estático, sin dropdown.
  if (empresas.length <= 1) {
    return (
      <span className="hidden items-center gap-2 rounded-full border border-line bg-surface py-1.5 pl-2 pr-3.5 text-sm font-medium text-ink-soft sm:inline-flex">
        <EmpresaAvatar empresa={empresaActiva} />
        <span className="max-w-[10rem] truncate">
          {empresaActiva?.nombreComercial ?? "Sin empresa"}
        </span>
      </span>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 pl-2 pr-2.5 text-sm font-medium text-ink transition-colors hover:border-brand-300"
      >
        <EmpresaAvatar empresa={empresaActiva} pending={isPending} />
        <span className="hidden max-w-[9rem] truncate sm:inline">
          {empresaActiva?.nombreCorto ?? empresaActiva?.nombreComercial ?? "Empresa"}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 z-50 mt-2 max-h-80 w-64 overflow-auto rounded-2xl border border-line bg-surface p-1.5 shadow-soft"
          >
            <li className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              Cambiar de empresa
            </li>
            {empresas.map((empresa) => {
              const activa = empresa.id === empresaActiva?.id;
              return (
                <li key={empresa.id} role="option" aria-selected={activa}>
                  <button
                    type="button"
                    onClick={() => seleccionar(empresa)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors ${
                      activa
                        ? "bg-brand-50 text-brand-700 dark:text-brand-200"
                        : "text-ink hover:bg-cloud"
                    }`}
                  >
                    <EmpresaAvatar empresa={empresa} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {empresa.nombreComercial}
                      </span>
                      {empresa.rfc && (
                        <span className="block truncate text-xs text-muted">
                          {empresa.rfc}
                        </span>
                      )}
                    </span>
                    {pendingId === empresa.id && isPending ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand-500" />
                    ) : activa ? (
                      <Check className="h-4 w-4 shrink-0 text-brand-500" strokeWidth={3} />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmpresaAvatar({
  empresa,
  pending = false,
}: {
  empresa: Empresa | null;
  pending?: boolean;
}) {
  return (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-aurora-500 text-[11px] font-bold text-white">
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : empresa ? (
        iniciales(empresa)
      ) : (
        <Building2 className="h-3.5 w-3.5" />
      )}
    </span>
  );
}
