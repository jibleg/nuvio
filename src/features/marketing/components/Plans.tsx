"use client";

import { motion } from "framer-motion";
import { Building2, Check, Handshake, Infinity as InfinityIcon, LayoutGrid, Rocket, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { PLANES, type PlanKey } from "@/config/plans";
import { stagger, fadeUp, viewportOnce } from "@/lib/motion";

const copy: Record<
  PlanKey,
  {
    headline: string;
    empresas: string;
    modulos: string;
    extras: string[];
    recomendado?: boolean;
    icon: typeof Rocket;
    accent: string;
  }
> = {
  emprendedor: {
    headline: "Para arrancar con todo.",
    empresas: "Hasta 2 empresas",
    modulos: "Hasta 2 módulos de negocio",
    extras: ["Usuarios ilimitados", "Sin límite de operación diaria", "Administración incluida"],
    icon: Rocket,
    accent: "from-sky-soft to-brand-500",
  },
  contigo_plus: {
    headline: "Cuando ya vas creciendo.",
    empresas: "Hasta 5 empresas",
    modulos: "Hasta 3 módulos de negocio",
    extras: ["Usuarios ilimitados", "Sin límite de operación diaria", "Administración incluida"],
    recomendado: true,
    icon: Handshake,
    accent: "from-brand-500 to-aurora-500",
  },
  empresarial: {
    headline: "Sin techo para tu operación.",
    empresas: "Empresas sin límite",
    modulos: "Todos los módulos, incluidos los que lancemos después",
    extras: ["Usuarios ilimitados", "Sin límite de operación diaria", "Administración incluida"],
    icon: InfinityIcon,
    accent: "from-aurora-500 to-brand-700",
  },
};

export function Plans() {
  return (
    <section id="planes" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="Un plan para cada etapa"
          title={
            <>
              No limitamos tu operación,{" "}
              <span className="text-gradient">solo acompañamos tu crecimiento.</span>
            </>
          }
          description="Usuarios ilimitados, sin tope de ventas, cortes o movimientos en ningún plan. La diferencia es cuántas empresas administras y cuántos módulos de negocio activas."
        />

        <motion.div
          variants={stagger(0.12, 0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-14 grid gap-6 md:grid-cols-3"
        >
          {PLANES.map((plan) => {
            const c = copy[plan.key];
            const Icon = c.icon;
            return (
              <motion.div
                key={plan.key}
                variants={fadeUp}
                className={`relative flex flex-col overflow-hidden rounded-3xl border transition-colors duration-500 ${
                  c.recomendado
                    ? "border-transparent bg-surface shadow-glow"
                    : "border-line bg-surface/50 hover:border-brand-200 hover:bg-surface"
                }`}
              >
                {c.recomendado && (
                  <span className="absolute right-6 top-6 z-10 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-700 shadow-soft">
                    <Sparkles className="h-3 w-3" /> Recomendado
                  </span>
                )}

                {/* Ilustración: ~30% de la tarjeta */}
                <div
                  className={`relative flex h-36 shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br sm:h-40 ${c.accent}`}
                >
                  <div className="dotted-grid absolute inset-0 opacity-40 mix-blend-overlay" />
                  <span className="absolute h-28 w-28 rounded-full bg-white/10 blur-2xl" />
                  <span className="relative grid h-16 w-16 place-items-center rounded-2xl bg-white/15 text-white shadow-glow ring-1 ring-white/25 backdrop-blur-sm sm:h-20 sm:w-20">
                    <Icon className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={1.75} />
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-8">
                  <h3 className="font-display text-2xl font-extrabold text-ink">{plan.nombre}</h3>
                  <p className="mt-1 text-sm font-medium text-brand-500">{c.headline}</p>

                  <ul className="mt-6 flex flex-col gap-3 text-sm text-ink-soft">
                    <li className="flex items-start gap-2.5">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600 dark:text-brand-300">
                        <Building2 className="h-3 w-3" />
                      </span>
                      <span className="font-semibold text-ink">{c.empresas}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600 dark:text-brand-300">
                        <LayoutGrid className="h-3 w-3" />
                      </span>
                      <span className="font-semibold text-ink">{c.modulos}</span>
                    </li>
                    {c.extras.map((extra) => (
                      <li key={extra} className="flex items-start gap-2.5">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cloud text-muted">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        {extra}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <Button
                      href="#cta"
                      variant={c.recomendado ? "primary" : "secondary"}
                      className="w-full"
                      withArrow
                    >
                      Comenzar gratis
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <p className="mt-8 text-center text-sm text-muted">
          ¿No sabes cuál te conviene? Escríbenos y te ayudamos a elegir.
        </p>
      </div>
    </section>
  );
}
