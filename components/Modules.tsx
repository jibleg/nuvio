"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, ShoppingCart, Package, Truck, Calculator, Check, ArrowRight } from "lucide-react";
import { SectionHeading } from "./ui/SectionHeading";
import { easeOutSoft } from "@/lib/motion";
import { ModulePreview } from "./ModulePreview";
import type { ModuleKey } from "./ModulePreview";

const modules: {
  key: ModuleKey;
  icon: typeof FileText;
  emoji: string;
  name: string;
  headline: string;
  text: string;
  accent: string;
}[] = [
  {
    key: "pos",
    icon: ShoppingCart,
    emoji: "🛒",
    name: "Punto de Venta",
    headline: "Cada venta cuenta.",
    text: "Atiende a tus clientes rápidamente y convierte cada venta en una oportunidad para crecer. Del mostrador a la factura, todo en un solo lugar.",
    accent: "from-aurora-400 to-aurora-600",
  },
  {
    key: "inventario",
    icon: Package,
    emoji: "📦",
    name: "Inventario",
    headline: "Siempre sabes qué tienes.",
    text: "Evita pérdidas, faltantes y compras innecesarias. Conoce el estado de tu inventario en tiempo real y toma decisiones con confianza.",
    accent: "from-sky-soft to-brand-500",
  },
  {
    key: "facturacion",
    icon: FileText,
    emoji: "🧾",
    name: "Facturación",
    headline: "Factura con tranquilidad.",
    text: "Cumple con el SAT sin complicaciones. Genera CFDI 4.0 en segundos, envíalos a tus clientes y mantén toda tu información organizada.",
    accent: "from-brand-400 to-brand-600",
  },
  {
    key: "compras",
    icon: Truck,
    emoji: "🚚",
    name: "Compras",
    headline: "Compra con inteligencia.",
    text: "Organiza proveedores, registra órdenes de compra y mantén tu inventario actualizado sin esfuerzo. Comprar bien también significa ganar más.",
    accent: "from-brand-600 to-brand-800",
  },
  {
    key: "contabilidad",
    icon: Calculator,
    emoji: "📊",
    name: "Contabilidad",
    headline: "Contabilidad fácil, sin ser contador.",
    text: "No necesitas ser experto para entender tus números. Nuvio ordena tus ingresos y egresos y te muestra la salud financiera de tu negocio en un lenguaje claro, para decidir con confianza.",
    accent: "from-aurora-500 to-brand-700",
  },
];

export function Modules() {
  const [active, setActive] = useState<ModuleKey>("pos");
  const current = modules.find((m) => m.key === active)!;

  return (
    <section id="modulos" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="Un aliado para cada día"
          title={
            <>
              Todo lo que tu negocio necesita,{" "}
              <span className="text-gradient">en una sola plataforma.</span>
            </>
          }
          description="No importa si apenas estás comenzando o si tu empresa ya está creciendo. Nuvio trabaja contigo en cada paso."
        />

        <div className="mt-14 grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Selector list */}
          <div className="flex flex-col gap-3">
            {modules.map((m) => {
              const isActive = m.key === active;
              return (
                <button
                  key={m.key}
                  onClick={() => setActive(m.key)}
                  className={`group relative overflow-hidden rounded-3xl border p-5 text-left transition-all duration-500 ${
                    isActive
                      ? "border-transparent bg-surface shadow-glow"
                      : "border-line bg-surface/50 hover:border-brand-200 hover:bg-surface"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="module-glow"
                      className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-brand-400 to-aurora-500"
                    />
                  )}
                  <div className="flex items-center gap-4">
                    <span
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${m.accent} text-white shadow-soft transition-transform duration-500 ${
                        isActive ? "scale-105" : "group-hover:scale-105"
                      }`}
                    >
                      <m.icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-ink">{m.name}</h3>
                        <span className="text-sm">{m.emoji}</span>
                      </div>
                      <p className="text-sm font-medium text-brand-500">{m.headline}</p>
                    </div>
                    <ArrowRight
                      className={`h-5 w-5 shrink-0 text-brand-400 transition-all duration-500 ${
                        isActive ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
                      }`}
                    />
                  </div>
                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: easeOutSoft }}
                        className="overflow-hidden text-[0.95rem] leading-relaxed text-muted"
                      >
                        <span className="block pt-3">{m.text}</span>
                      </motion.p>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>

          {/* Preview */}
          <div className="lg:sticky lg:top-28">
            <div className="relative overflow-hidden rounded-[2rem] border border-line bg-gradient-to-br from-cloud to-surface p-6 shadow-glow sm:p-8">
              <div className="dotted-grid pointer-events-none absolute inset-0 opacity-30" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.98 }}
                  transition={{ duration: 0.45, ease: easeOutSoft }}
                  className="relative"
                >
                  <ModulePreview module={active} />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted">
              <Check className="h-4 w-4 text-aurora-600" strokeWidth={3} />
              Cada módulo se conecta con los demás, sin capturar nada dos veces.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
