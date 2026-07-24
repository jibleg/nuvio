"use client";

import { motion } from "framer-motion";
import { Sparkles, Clock, ShieldCheck } from "lucide-react";
import { Button } from "./ui/Button";
import { viewportOnce, easeOutSoft } from "@/lib/motion";

const perks = [
  { icon: Clock, label: "Listo en minutos" },
  { icon: ShieldCheck, label: "CFDI 4.0 con el SAT" },
  { icon: Sparkles, label: "Sin tarjeta para empezar" },
];

export function FinalCTA() {
  return (
    <section id="cta" className="relative px-5 py-20 sm:py-28">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewportOnce}
        transition={{ duration: 0.9, ease: easeOutSoft }}
        className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-brand-950 px-6 py-16 text-center text-white shadow-glow sm:px-12 sm:py-20"
      >
        {/* Ambient */}
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-aurora absolute -left-10 top-0 h-72 w-72 rounded-full bg-brand-500/40 blur-3xl" />
          <div className="animate-aurora absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-aurora-500/30 blur-3xl [animation-delay:3s]" />
        </div>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(white 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ delay: 0.1, duration: 0.7, ease: easeOutSoft }}
            className="mx-auto max-w-3xl text-balance font-display text-3xl font-extrabold leading-[1.1] sm:text-4xl md:text-5xl"
          >
            Tu negocio ya hace un gran trabajo.
            <br />
            <span className="bg-gradient-to-r from-brand-300 via-sky-soft to-aurora-300 bg-clip-text text-transparent">
              Dale una herramienta que trabaje igual de bien para ti.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ delay: 0.2, duration: 0.7, ease: easeOutSoft }}
            className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-white/65"
          >
            Empieza hoy con Nuvio y descubre una forma más simple, humana e inteligente
            de administrar tu empresa.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ delay: 0.3, duration: 0.7, ease: easeOutSoft }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button href="#" variant="primary" withArrow>
              Crear mi cuenta gratuita
            </Button>
            <Button href="#" variant="secondary" onDark>
              Solicitar una demostración
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportOnce}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm text-white/55"
          >
            {perks.map((p) => (
              <span key={p.label} className="inline-flex items-center gap-2">
                <p.icon className="h-4 w-4 text-aurora-300" />
                {p.label}
              </span>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
