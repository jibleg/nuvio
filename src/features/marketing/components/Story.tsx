"use client";

import { motion } from "framer-motion";
import { Clock, Eye, Compass } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { stagger, fadeUp, viewportOnce } from "@/lib/motion";

const pillars = [
  {
    icon: Clock,
    title: "Recuperar tiempo",
    text: "Menos tareas repetitivas y menos doble captura. Cada minuto que ahorras es un minuto para vender, crear o descansar.",
  },
  {
    icon: Eye,
    title: "Tener claridad",
    text: "Toda tu operación en un mismo lugar, organizada y en tiempo real. Sabes exactamente cómo va tu negocio.",
  },
  {
    icon: Compass,
    title: "Mejores decisiones",
    text: "Con información clara y confiable, decides con seguridad y avanzas con confianza hacia tu próximo paso.",
  },
];

export function Story() {
  return (
    <section className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="font-display text-2xl font-bold text-brand-400">
              Cada negocio comienza con un sueño.
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-4 text-balance font-display text-3xl font-extrabold leading-[1.1] text-ink sm:text-4xl md:text-[2.9rem]">
              Detrás de cada empresa hay{" "}
              <span className="text-gradient">personas</span> que trabajan cada día
              por salir adelante.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted">
              Atender clientes, pagar proveedores, cuidar al equipo y seguir creciendo.
              Sabemos que administrar un negocio no siempre es sencillo. Por eso nació
              Nuvio: para ayudarte a recuperar tiempo, tener claridad y tomar mejores
              decisiones.
            </p>
          </Reveal>
        </div>

        <motion.div
          variants={stagger(0.12, 0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-14 grid gap-5 sm:grid-cols-3"
        >
          {pillars.map((p) => (
            <motion.div
              key={p.title}
              variants={fadeUp}
              className="group card-hover border-conic relative overflow-hidden rounded-3xl border border-line bg-surface/70 p-7 shadow-soft hover:-translate-y-1"
            >
              <span className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-aurora-300/20 text-brand-500 ring-1 ring-brand-100 transition-transform duration-500 group-hover:scale-110">
                <p.icon className="h-6 w-6" />
              </span>
              <h3 className="text-xl font-bold text-ink">{p.title}</h3>
              <p className="mt-2 text-[0.975rem] leading-relaxed text-muted">{p.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
