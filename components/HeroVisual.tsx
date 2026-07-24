"use client";

import { motion } from "framer-motion";
import { FileText, ShoppingCart, Package, Truck, Check, TrendingUp } from "lucide-react";
import { easeOutSoft } from "@/lib/motion";

const flow = [
  { icon: ShoppingCart, label: "Venta registrada", tone: "text-brand-500", bg: "bg-brand-50" },
  { icon: Package, label: "Inventario actualizado", tone: "text-aurora-600", bg: "bg-aurora-300/25" },
  { icon: FileText, label: "Factura CFDI lista", tone: "text-brand-600", bg: "bg-brand-100" },
];

/** Floating glass "product" panel that hints at Nuvio's connected flow. */
export function HeroVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 1, ease: easeOutSoft, delay: 0.35 }}
      style={{ perspective: 1200 }}
      className="relative mx-auto w-full min-w-0 max-w-md"
    >
      {/* Glow */}
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-300/40 via-sky-soft/30 to-aurora-300/40 blur-3xl" />

      {/* Main panel */}
      <div className="relative rounded-[1.9rem] glass p-5 shadow-glow">
        {/* Window chrome */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-400 to-aurora-500 text-white">
              <TrendingUp className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold leading-none text-ink">Nuvio</p>
              <p className="text-[10px] font-medium text-muted">Panel de tu negocio</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-aurora-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-brand-300" />
          </div>
        </div>

        {/* Revenue card */}
        <div className="mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-4 text-white shadow-soft">
          <p className="text-xs font-medium text-white/70">Ventas de hoy</p>
          <div className="mt-1 flex items-end justify-between">
            <AnimatedAmount />
            <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold">
              <TrendingUp className="h-3 w-3" /> +18%
            </span>
          </div>
          <MiniChart />
        </div>

        {/* Connected flow */}
        <div className="space-y-2.5">
          {flow.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + i * 0.25, duration: 0.6, ease: easeOutSoft }}
              className="flex items-center gap-3 rounded-2xl border border-line/80 bg-surface/70 p-3"
            >
              <span className={`grid h-9 w-9 place-items-center rounded-xl ${step.bg} ${step.tone}`}>
                <step.icon className="h-4 w-4" />
              </span>
              <span className="flex-1 text-sm font-semibold text-ink">{step.label}</span>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.15 + i * 0.25, type: "spring", stiffness: 300, damping: 15 }}
                className="grid h-5 w-5 place-items-center rounded-full bg-aurora-500 text-white"
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </motion.span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Floating chips */}
      <FloatingChip
        className="-left-8 top-16"
        delay={1.4}
        icon={<Truck className="h-4 w-4 text-brand-500" />}
        title="Compra recibida"
        subtitle="Proveedor · 12 SKUs"
      />
      <FloatingChip
        className="-right-6 bottom-20"
        delay={1.6}
        icon={<Check className="h-4 w-4 text-aurora-600" strokeWidth={3} />}
        title="Sin doble captura"
        subtitle="Todo conectado"
      />
    </motion.div>
  );
}

function FloatingChip({
  className,
  delay,
  icon,
  title,
  subtitle,
}: {
  className: string;
  delay: number;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.7, ease: easeOutSoft }}
      className={`absolute z-20 hidden sm:block ${className}`}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay }}
        className="flex items-center gap-2.5 rounded-2xl glass px-3.5 py-2.5 shadow-soft"
      >
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-surface">{icon}</span>
        <div>
          <p className="text-xs font-bold leading-tight text-ink">{title}</p>
          <p className="text-[10px] font-medium text-muted">{subtitle}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AnimatedAmount() {
  return (
    <motion.p
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.6 }}
      className="font-display text-3xl font-extrabold tracking-tight"
    >
      $42,860
    </motion.p>
  );
}

function MiniChart() {
  const bars = [40, 62, 48, 78, 58, 90, 72];
  return (
    <div className="mt-3 flex h-12 items-end gap-1.5">
      {bars.map((h, i) => (
        <motion.span
          key={i}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: `${h}%`, opacity: 1 }}
          transition={{ delay: 0.8 + i * 0.07, duration: 0.6, ease: easeOutSoft }}
          className="flex-1 rounded-full bg-gradient-to-t from-white/30 to-white/80"
        />
      ))}
    </div>
  );
}
