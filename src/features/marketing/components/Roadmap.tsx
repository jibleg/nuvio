"use client";

import { motion } from "framer-motion";
import { Users, Wallet, CalendarCheck, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { stagger, fadeUp, viewportOnce } from "@/lib/motion";

const upcoming = [
  {
    icon: Users,
    name: "CRM",
    text: "Conoce mejor a tus clientes, da seguimiento a cada oportunidad y fortalece tus relaciones comerciales.",
  },
  {
    icon: Wallet,
    name: "Nómina",
    text: "Administra a tu equipo con la misma sencillez con la que administras tu negocio.",
  },
  {
    icon: CalendarCheck,
    name: "Control de asistencias",
    text: "Registra entradas y salidas de tu equipo con facilidad y ten claridad de la asistencia día con día.",
  },
];

export function Roadmap() {
  return (
    <section id="roadmap" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="Crecemos contigo"
          title={
            <>
              Hoy tienes lo esencial.{" "}
              <span className="text-gradient">Y esto apenas comienza.</span>
            </>
          }
          description="Estamos construyendo una plataforma que crece al ritmo de nuestros clientes. Porque cuando tu negocio evoluciona, Nuvio también."
        />

        <motion.div
          variants={stagger(0.14, 0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-14 grid gap-6 md:grid-cols-3"
        >
          {upcoming.map((u) => (
            <motion.div
              key={u.name}
              variants={fadeUp}
              className="group relative overflow-hidden rounded-3xl border border-dashed border-brand-200 bg-surface/50 p-8 transition-colors duration-500 hover:border-brand-300 hover:bg-surface"
            >
              <div className="absolute right-5 top-5">
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-500">
                  <Sparkles className="h-3 w-3" /> Próximamente
                </span>
              </div>
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-100 to-cloud text-brand-500 ring-1 ring-brand-100 transition-transform duration-500 group-hover:scale-110">
                <u.icon className="h-7 w-7" />
              </span>
              <h3 className="mt-6 text-2xl font-bold text-ink">{u.name}</h3>
              <p className="mt-2 text-[0.975rem] leading-relaxed text-muted">{u.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
