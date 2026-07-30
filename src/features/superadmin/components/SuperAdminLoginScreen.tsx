"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { easeOutSoft } from "@/lib/motion";
import { SuperAdminBrandPanel } from "./SuperAdminBrandPanel";
import { SuperAdminLoginForm } from "./SuperAdminLoginForm";

/** Pantalla de acceso del panel interno: mismo lenguaje visual, tono staff. */
export function SuperAdminLoginScreen() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <SuperAdminBrandPanel />

      <div className="relative flex flex-col px-6 py-7 sm:px-10">
        <div className="bg-mesh pointer-events-none absolute inset-x-0 top-0 h-64 opacity-40 lg:hidden" />

        <div className="relative z-10 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-ink-soft">
            <ShieldCheck className="h-4 w-4" />
            Acceso restringido
          </span>
          <ThemeToggle />
        </div>

        <div className="relative z-10 flex flex-1 items-center justify-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeOutSoft }}
            className="w-full max-w-sm"
          >
            <div className="mb-8 flex justify-center lg:hidden">
              <Logo href={null} />
            </div>

            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
              Panel interno
            </h1>
            <p className="mt-2 text-sm text-muted">
              Ingresa con tu cuenta de staff de Nuvio.
            </p>

            <div className="mt-8">
              <SuperAdminLoginForm />
            </div>

            <p className="mt-8 text-center text-sm text-muted">
              Acceso exclusivo para el equipo Nuvio.
            </p>
          </motion.div>
        </div>

        <p className="relative z-10 text-center text-xs text-muted">
          © {new Date().getFullYear()} Nuvio · Panel interno
        </p>
      </div>
    </div>
  );
}
