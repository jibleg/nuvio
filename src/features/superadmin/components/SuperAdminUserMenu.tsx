"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { superAdminLogoutAction } from "../actions";
import type { SuperAdminUser } from "../types";

export function SuperAdminUserMenu({ superAdmin }: { superAdmin: SuperAdminUser }) {
  const [open, setOpen] = useState(false);
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-2 transition-colors hover:border-brand-300"
      >
        <Avatar nombre={superAdmin.nombre} size="sm" />
        <span className="hidden max-w-[9rem] truncate text-sm font-semibold text-ink sm:block">
          {superAdmin.nombre.split(" ")[0]}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-surface shadow-glow"
          >
            <div className="flex items-center gap-3 bg-gradient-to-br from-brand-500/10 to-aurora-500/10 px-4 py-4">
              <Avatar nombre={superAdmin.nombre} size="lg" className="!h-12 !w-12 !text-base" />
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-ink">
                  {superAdmin.nombre}
                </p>
                <p className="truncate text-xs text-muted">{superAdmin.email}</p>
              </div>
            </div>

            <div className="h-px bg-line" />

            <div className="p-1.5">
              <form action={superAdminLogoutAction}>
                <button
                  type="submit"
                  role="menuitem"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/10">
                    <LogOut className="h-4 w-4" />
                  </span>
                  Cerrar sesión
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
