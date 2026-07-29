"use client";

import { motion } from "framer-motion";
import { ShoppingCart, Package, FileText, Database, Rocket } from "lucide-react";
import { easeOutSoft, viewportOnce } from "@/lib/motion";

const steps = [
  { icon: ShoppingCart, title: "Realizas una venta", sub: "En el punto de venta o en línea." },
  { icon: Package, title: "El inventario se actualiza", sub: "Sin tocar nada. Automático." },
  { icon: FileText, title: "La factura queda lista", sub: "CFDI 4.0 timbrada al instante." },
  { icon: Database, title: "La información se organiza", sub: "Todo en un mismo lugar." },
  { icon: Rocket, title: "Tu negocio avanza", sub: "Con claridad y sin fricción." },
];

export function Connected() {
  return (
    <section id="conectado" className="relative overflow-hidden bg-brand-950 py-24 text-white sm:py-32">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-aurora absolute left-1/4 top-0 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="animate-aurora absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-aurora-500/20 blur-3xl [animation-delay:4s]" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-5">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.8, ease: easeOutSoft }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-aurora-300">
            Todo conectado
          </span>
          <h2 className="mt-4 text-balance font-display text-3xl font-extrabold leading-[1.1] sm:text-4xl md:text-[2.9rem]">
            Cada acción genera la siguiente.
          </h2>
          <p className="mt-5 text-pretty text-lg leading-relaxed text-white/60">
            Sin capturar la misma información dos veces. Sin procesos complicados.
            Nuvio conecta cada parte de tu operación para que todo fluya solo.
          </p>
        </motion.div>

        {/* Flow */}
        <div className="relative mt-16">
          {/* Connecting line (desktop) */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={viewportOnce}
            transition={{ duration: 1.4, ease: easeOutSoft, delay: 0.2 }}
            className="absolute left-0 right-0 top-9 hidden h-px origin-left bg-gradient-to-r from-transparent via-white/30 to-transparent lg:block"
          />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{ delay: 0.2 + i * 0.18, duration: 0.7, ease: easeOutSoft }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative mb-5">
                  <span className="animate-pulse-ring absolute inset-0 rounded-2xl bg-brand-400/40" />
                  <span className="relative grid h-[4.5rem] w-[4.5rem] place-items-center rounded-2xl glass-dark ring-1 ring-white/15">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-aurora-500 text-white shadow-glow">
                      <s.icon className="h-5 w-5" />
                    </span>
                  </span>
                  <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-white text-xs font-extrabold text-brand-600 shadow-soft">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-base font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-white/50">{s.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportOnce}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="mt-14 text-center text-sm font-medium text-white/40"
        >
          Una sola plataforma. Cero doble captura.
        </motion.p>
      </div>
    </section>
  );
}
