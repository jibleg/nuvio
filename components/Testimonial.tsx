"use client";

import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { viewportOnce, easeOutSoft } from "@/lib/motion";

export function Testimonial() {
  return (
    <section className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-4xl px-5">
        <motion.figure
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.8, ease: easeOutSoft }}
          className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-gradient-to-br from-brand-500 to-brand-700 p-10 text-white shadow-glow sm:p-14"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-aurora-400/20 blur-3xl" />

          <Quote className="h-12 w-12 text-white/25" fill="currentColor" />

          <blockquote className="relative mt-6 text-balance font-display text-2xl font-bold leading-snug sm:text-3xl">
            “Con Nuvio dejamos de preocuparnos por la operación diaria y comenzamos a
            enfocarnos en vender. Hoy tenemos más control y mucho más tiempo para hacer
            crecer nuestro negocio.”
          </blockquote>

          <figcaption className="relative mt-8 flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white/15 font-display text-lg font-extrabold ring-1 ring-white/25">
              M
            </span>
            <div>
              <p className="font-bold">Dueña de negocio</p>
              <p className="text-sm text-white/60">Comercio y servicios</p>
            </div>
            <div className="ml-auto hidden items-center gap-1 sm:flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 text-aurora-300" fill="currentColor" />
              ))}
            </div>
          </figcaption>
        </motion.figure>
      </div>
    </section>
  );
}
