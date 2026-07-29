"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { easeOutSoft } from "@/lib/motion";
import { AuthBrandPanel } from "./AuthBrandPanel";
import { LoginForm } from "./LoginForm";

/** Pantalla de acceso completa: showcase de marca + tarjeta de formulario. */
export function LoginScreen() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <AuthBrandPanel />

      <div className="relative flex flex-col px-6 py-7 sm:px-10">
        {/* Glow suave detrás de la tarjeta (visible sobre todo en móvil) */}
        <div className="bg-mesh pointer-events-none absolute inset-x-0 top-0 h-64 opacity-40 lg:hidden" />

        {/* Barra superior: volver al sitio + tema */}
        <div className="relative z-10 flex items-center justify-between">
          <a
            href="/"
            className="group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-brand-600 dark:hover:text-brand-300"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            Volver al sitio
          </a>
          <ThemeToggle />
        </div>

        {/* Tarjeta central */}
        <div className="relative z-10 flex flex-1 items-center justify-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeOutSoft }}
            className="w-full max-w-sm"
          >
            {/* Logo (visible en móvil, donde el panel está oculto) */}
            <div className="mb-8 flex justify-center lg:hidden">
              <Logo href="/" />
            </div>

            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
              Bienvenido de nuevo
            </h1>
            <p className="mt-2 text-sm text-muted">
              Ingresa a tu cuenta para continuar.
            </p>

            <div className="mt-8">
              <LoginForm />
            </div>

            <p className="mt-8 text-center text-sm text-muted">
              ¿Aún no tienes cuenta?{" "}
              <a
                href="/#cta"
                className="font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200"
              >
                Comenzar gratis
              </a>
            </p>
          </motion.div>
        </div>

        {/* Pie legal */}
        <p className="relative z-10 text-center text-xs text-muted">
          © {new Date().getFullYear()} Nuvio · Acceso seguro
        </p>
      </div>
    </div>
  );
}
