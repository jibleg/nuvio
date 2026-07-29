"use client";

import { motion } from "framer-motion";
import { Check, ShieldCheck, Building2, TrendingUp } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { easeOutSoft } from "@/lib/motion";

const trust = [
  { icon: Check, text: "Todo conectado, sin doble captura" },
  { icon: Building2, text: "Multiempresa desde un solo acceso" },
  { icon: ShieldCheck, text: "Tus datos, protegidos y siempre disponibles" },
];

/**
 * Panel de marca del acceso: lienzo siempre oscuro (como las secciones premium
 * del landing) con malla de color, auroras animadas y una tarjeta glass viva.
 * El envoltorio `dark` fuerza el tratamiento claro del logo y del texto.
 */
export function AuthBrandPanel() {
  return (
    <aside className="dark relative hidden overflow-hidden bg-brand-950 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      {/* Fondo: malla + auroras + retícula */}
      <div className="bg-mesh pointer-events-none absolute inset-0 opacity-70" />
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-aurora-500/25 blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-brand-500/30 blur-3xl"
        animate={{ x: [0, -24, 0], y: [0, 18, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="dotted-grid pointer-events-none absolute inset-0 opacity-40" />

      {/* Logo → vuelve al landing */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: easeOutSoft }}
        className="relative z-10"
      >
        <Logo href="/" />
      </motion.div>

      {/* Mensaje de marca */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: easeOutSoft, delay: 0.15 }}
        className="relative z-10 max-w-md"
      >
        <span className="inline-flex items-center gap-2 rounded-full glass-dark px-3 py-1 text-xs font-semibold text-brand-100">
          <TrendingUp className="h-3.5 w-3.5" />
          Plataforma de gestión
        </span>
        <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-ink xl:text-5xl">
          Devolvemos <span className="text-gradient">tiempo</span> para crecer.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-ink-soft">
          Punto de venta, inventario, facturación CFDI 4.0 y más, en una sola
          plataforma. Entra y toma el control de tu negocio.
        </p>

        <ul className="mt-8 space-y-3">
          {trust.map((item, i) => (
            <motion.li
              key={item.text}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: easeOutSoft, delay: 0.4 + i * 0.12 }}
              className="flex items-center gap-3 text-sm font-medium text-ink-soft"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-aurora-500 text-white">
                <item.icon className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
              {item.text}
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Firma inferior */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="relative z-10 text-xs font-medium text-muted"
      >
        Nuvio · Un aliado para tu negocio, no un proveedor.
      </motion.p>
    </aside>
  );
}
