"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { viewportOnce, easeOutSoft } from "@/lib/motion";

const lines: ReactNode[] = [
  <>La tecnología debe <em className="not-italic text-gradient font-extrabold">acercar a las personas</em>, no complicar su trabajo.</>,
  <>Emprender requiere valentía. Cada negocio es el esfuerzo, la ilusión y el futuro de quienes lo construyen.</>,
  <>Por eso diseñamos herramientas <em className="not-italic font-extrabold text-brand-600">simples, inteligentes y humanas</em>.</>,
  <>Queremos que dediques menos tiempo a administrar y más a vender, innovar y disfrutar lo que has construido.</>,
];

export function Manifesto() {
  return (
    <section id="filosofia" className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 -z-10 bg-mesh opacity-50" />
      <div className="mx-auto max-w-4xl px-5 text-center">
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.7, ease: easeOutSoft }}
          className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/70 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-brand-600 shadow-soft backdrop-blur"
        >
          Nuestro manifiesto
        </motion.span>

        <div className="mt-10 space-y-6">
          {lines.map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ delay: i * 0.15, duration: 0.8, ease: easeOutSoft }}
              className="text-balance font-display text-2xl font-bold leading-snug text-ink sm:text-3xl md:text-[2.1rem]"
            >
              {line}
            </motion.p>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ delay: 0.65, duration: 0.8, ease: easeOutSoft }}
          className="mx-auto mt-12 max-w-xl text-pretty text-lg leading-relaxed text-muted"
        >
          Nuvio no solo organiza tu empresa.
          <span className="font-bold text-ink"> Te acompaña en su crecimiento.</span>
        </motion.p>
      </div>
    </section>
  );
}
