"use client";

import { motion } from "framer-motion";
import { HeartHandshake, Lightbulb, Store, Home } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { stagger, fadeUp, viewportOnce } from "@/lib/motion";

const outcomes = [
  { icon: HeartHandshake, label: "Atender mejor a tus clientes", color: "text-brand-500", bg: "bg-brand-50" },
  { icon: Lightbulb, label: "Crear nuevos productos", color: "text-aurora-600", bg: "bg-aurora-300/20" },
  { icon: Store, label: "Abrir otra sucursal", color: "text-brand-700", bg: "bg-brand-100" },
  { icon: Home, label: "Compartir tiempo con tu familia", color: "text-brand-600", bg: "bg-brand-100" },
];

export function Productivity() {
  return (
    <section className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <Reveal>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-500">
                Lo que de verdad importa
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-4 text-balance font-display text-3xl font-extrabold leading-[1.1] text-ink sm:text-4xl md:text-[2.9rem]">
                Lo mejor de un negocio no está en los números.
                <br />
                <span className="text-gradient-warm">Está en las personas.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-lg text-pretty text-lg leading-relaxed text-muted">
                Cuando dedicas menos tiempo a tareas repetitivas, puedes dedicar más
                tiempo a lo realmente importante. Eso también es productividad.
              </p>
            </Reveal>
          </div>

          <motion.ul
            variants={stagger(0.12, 0.1)}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="grid gap-4 sm:grid-cols-2"
          >
            {outcomes.map((o) => (
              <motion.li
                key={o.label}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                className="card-hover flex flex-col gap-4 rounded-3xl border border-line bg-surface/70 p-6 shadow-soft"
              >
                <span className={`grid h-12 w-12 place-items-center rounded-2xl ${o.bg} ${o.color}`}>
                  <o.icon className="h-6 w-6" />
                </span>
                <span className="text-lg font-bold leading-snug text-ink">{o.label}</span>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}
