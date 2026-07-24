"use client";

import { motion } from "framer-motion";
import { X, Check } from "lucide-react";
import { Reveal } from "./ui/Reveal";
import { stagger, fadeUp, viewportOnce } from "@/lib/motion";

const notNeeded = ["Ser contador", "Ser ingeniero", "Semanas de capacitación"];

export function ForPeople() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-28">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-cloud/60 to-transparent" />
      <div className="mx-auto max-w-4xl px-5 text-center">
        <Reveal>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-500">
            Simple desde el primer día
          </span>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-4 text-balance font-display text-3xl font-extrabold leading-[1.1] text-ink sm:text-4xl md:text-[3rem]">
            Diseñado para <span className="text-gradient">personas</span>,
            <br className="hidden sm:block" /> no para expertos.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted">
            Creamos una plataforma intuitiva para que cualquier persona pueda comenzar a
            trabajar desde el primer día.
          </p>
        </Reveal>

        <motion.div
          variants={stagger(0.1, 0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          {notNeeded.map((n) => (
            <motion.span
              key={n}
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-muted shadow-soft"
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-cloud text-muted">
                <X className="h-3 w-3" strokeWidth={3} />
              </span>
              <span className="line-through decoration-line decoration-2">{n}</span>
            </motion.span>
          ))}
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-aurora-500 px-5 py-2.5 text-sm font-bold text-white shadow-glow"
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-surface/25">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            Solo empezar
          </motion.span>
        </motion.div>
      </div>
    </section>
  );
}
