"use client";

import { motion } from "framer-motion";
import { Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "./ui/Button";
import { HeroVisual } from "./HeroVisual";
import { easeOutSoft, stagger, fadeUp } from "@/lib/motion";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pb-16 pt-28 sm:pt-32 lg:pb-24 lg:pt-36">
      {/* Backgrounds */}
      <div className="absolute inset-0 -z-20 bg-mesh opacity-70" />
      <div className="absolute inset-0 -z-10">
        <div className="animate-aurora absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-300/40 blur-3xl" />
        <div className="animate-aurora absolute right-0 top-40 h-80 w-80 rounded-full bg-aurora-300/40 blur-3xl [animation-delay:3s]" />
      </div>
      <div className="dotted-grid pointer-events-none absolute inset-0 -z-10 opacity-40" />

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        {/* Copy */}
        <motion.div
          variants={stagger(0.12, 0.1)}
          initial="hidden"
          animate="show"
          className="flex min-w-0 flex-col items-start"
        >
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-surface/70 px-4 py-1.5 text-xs font-semibold text-brand-700 shadow-soft backdrop-blur dark:text-brand-300">
              <Sparkles className="h-3.5 w-3.5 text-aurora-500" />
              Más que un sistema. Un aliado para crecer.
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-6 text-balance font-display text-4xl font-extrabold leading-[1.04] tracking-tight text-ink sm:text-5xl lg:text-6xl"
          >
            Dedícate a hacer{" "}
            <span className="relative inline-block">
              <span className="text-gradient">crecer</span>
              <motion.svg
                viewBox="0 0 200 12"
                className="absolute -bottom-1 left-0 w-full"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.9, duration: 1, ease: easeOutSoft }}
              >
                <motion.path
                  d="M3 8C40 3 160 3 197 6"
                  stroke="url(#underline)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="underline" x1="0" y1="0" x2="200" y2="0">
                    <stop stopColor="#1a9cab" />
                    <stop offset="1" stopColor="#76e6ea" />
                  </linearGradient>
                </defs>
              </motion.svg>
            </span>{" "}
            tu negocio.
            <span className="mt-3 block text-lg font-medium text-muted sm:text-xl lg:whitespace-nowrap lg:text-[1.6rem]">
              Nosotros te ayudamos con la operación.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted"
          >
            Nuvio reúne el punto de venta, el inventario, la facturación, las compras y la
            contabilidad en una sola plataforma inteligente, para que dediques menos
            tiempo a la administración y más tiempo a tus clientes.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="#cta" variant="primary" withArrow>
              Comenzar gratis
            </Button>
            <Button href="#modulos" variant="secondary">
              Solicitar una demostración
            </Button>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted"
          >
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-aurora-600" />
              CFDI 4.0 en regla con el SAT
            </span>
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-500" />
              Sin doble captura
            </span>
          </motion.div>
        </motion.div>

        {/* Visual */}
        <HeroVisual />
      </div>
    </section>
  );
}
