"use client";

import { motion } from "framer-motion";
import { Check, TrendingUp, TrendingDown, AlertCircle, HeartPulse } from "lucide-react";
import { easeOutSoft } from "@/lib/motion";

export type ModuleKey = "facturacion" | "pos" | "inventario" | "compras" | "contabilidad";

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

export function ModulePreview({ module }: { module: ModuleKey }) {
  switch (module) {
    case "facturacion":
      return <Facturacion />;
    case "pos":
      return <Pos />;
    case "inventario":
      return <Inventario />;
    case "compras":
      return <Compras />;
    case "contabilidad":
      return <Contabilidad />;
  }
}

function Frame({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface/90 p-5 shadow-soft backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-ink">{title}</p>
        {badge && (
          <span className="inline-flex items-center gap-1 rounded-full bg-aurora-300/25 px-2.5 py-1 text-[11px] font-bold text-aurora-600">
            <Check className="h-3 w-3" strokeWidth={3} /> {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Facturacion() {
  const rows = [
    ["RFC receptor", "XAXX010101000"],
    ["Uso de CFDI", "G03 · Gastos en general"],
    ["Subtotal", "$36,948.28"],
    ["IVA 16%", "$5,911.72"],
  ];
  return (
    <Frame title="Nueva factura · CFDI 4.0" badge="Timbrada">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-2.5">
        {rows.map(([k, v]) => (
          <motion.div
            key={k}
            variants={item}
            className="flex items-center justify-between rounded-xl bg-cloud px-3.5 py-2.5"
          >
            <span className="text-xs font-medium text-muted">{k}</span>
            <span className="text-sm font-semibold text-ink">{v}</span>
          </motion.div>
        ))}
        <motion.div
          variants={item}
          className="flex items-center justify-between rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-3.5 py-3 text-white"
        >
          <span className="text-xs font-semibold text-white/80">Total</span>
          <span className="font-display text-lg font-extrabold">$42,860.00</span>
        </motion.div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7, type: "spring", stiffness: 260, damping: 16 }}
        className="mt-3 flex items-center gap-2 rounded-xl border border-aurora-400/40 bg-aurora-300/15 px-3.5 py-2.5"
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-aurora-500 text-white">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
        <span className="text-xs font-semibold text-aurora-600">
          Enviada al cliente y guardada automáticamente
        </span>
      </motion.div>
    </Frame>
  );
}

function Pos() {
  const products = [
    ["Café de especialidad 250g", "2", "$380"],
    ["Prensa francesa", "1", "$690"],
    ["Filtros premium", "3", "$135"],
  ];
  return (
    <Frame title="Punto de venta · Ticket #4821">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
        {products.map(([name, qty, price]) => (
          <motion.div
            key={name}
            variants={item}
            className="flex items-center gap-3 rounded-xl bg-cloud px-3.5 py-2.5"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-100 text-xs font-bold text-brand-600">
              {qty}×
            </span>
            <span className="flex-1 truncate text-sm font-medium text-ink">{name}</span>
            <span className="text-sm font-semibold text-ink">{price}</span>
          </motion.div>
        ))}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, ease: easeOutSoft }}
        className="mt-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-aurora-500 to-aurora-600 px-4 py-3 text-white"
      >
        <span className="text-xs font-semibold text-white/85">Total a cobrar</span>
        <span className="font-display text-xl font-extrabold">$1,205.00</span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.75 }}
        className="mt-3 grid grid-cols-3 gap-2"
      >
        {["Efectivo", "Tarjeta", "Factura"].map((m, i) => (
          <span
            key={m}
            className={`rounded-lg py-2 text-center text-xs font-semibold ${
              i === 2 ? "bg-brand-500 text-white" : "bg-cloud text-ink-soft"
            }`}
          >
            {m}
          </span>
        ))}
      </motion.div>
    </Frame>
  );
}

function Inventario() {
  const stock = [
    { name: "Café de especialidad 250g", level: 82, tag: "En stock", tone: "aurora" },
    { name: "Prensa francesa", level: 38, tag: "Bajo", tone: "sunrise" },
    { name: "Filtros premium", level: 64, tag: "En stock", tone: "aurora" },
    { name: "Termo de acero", level: 12, tag: "Reordenar", tone: "brand" },
  ];
  const toneMap: Record<string, string> = {
    aurora: "from-aurora-400 to-aurora-500",
    sunrise: "from-sunrise-400 to-sunrise-500",
    brand: "from-brand-400 to-brand-600",
  };
  return (
    <Frame title="Inventario en tiempo real" badge="Actualizado">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
        {stock.map((s) => (
          <motion.div key={s.name} variants={item} className="rounded-xl bg-cloud px-3.5 py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-ink">{s.name}</span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  s.tone === "brand"
                    ? "bg-brand-100 text-brand-600"
                    : s.tone === "sunrise"
                      ? "bg-sunrise-300/40 text-sunrise-500"
                      : "bg-aurora-300/30 text-aurora-600"
                }`}
              >
                {s.tone !== "aurora" && <AlertCircle className="h-2.5 w-2.5" />}
                {s.tag}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-line">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.level}%` }}
                transition={{ delay: 0.3, duration: 0.9, ease: easeOutSoft }}
                className={`h-full rounded-full bg-gradient-to-r ${toneMap[s.tone]}`}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </Frame>
  );
}

function Compras() {
  const items = [
    ["Café verde origen", "40 kg"],
    ["Empaques kraft", "500 pz"],
    ["Etiquetas premium", "500 pz"],
  ];
  return (
    <Frame title="Orden de compra · OC-2041">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
        <motion.div
          variants={item}
          className="flex items-center gap-3 rounded-xl bg-cloud px-3.5 py-3"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold">
            CV
          </span>
          <div>
            <p className="text-sm font-bold text-ink">Café Verde SA</p>
            <p className="text-xs text-muted">Proveedor · Entrega en 3 días</p>
          </div>
        </motion.div>
        {items.map(([name, qty]) => (
          <motion.div
            key={name}
            variants={item}
            className="flex items-center justify-between rounded-xl bg-cloud px-3.5 py-2.5"
          >
            <span className="text-sm font-medium text-ink">{name}</span>
            <span className="text-sm font-semibold text-brand-600">{qty}</span>
          </motion.div>
        ))}
        <motion.div
          variants={item}
          className="flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50/60 px-3.5 py-2.5"
        >
          <TrendingUp className="h-4 w-4 text-brand-500" />
          <span className="text-xs font-semibold text-brand-700">
            Al recibirla, tu inventario se actualiza solo.
          </span>
        </motion.div>
      </motion.div>
    </Frame>
  );
}

function Contabilidad() {
  const rows = [
    { label: "Ingresos del mes", value: "$128,400", up: true },
    { label: "Egresos", value: "$86,150", up: false },
  ];
  return (
    <Frame title="Salud financiera" badge="Al día">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-2.5">
        {rows.map((r) => (
          <motion.div
            key={r.label}
            variants={item}
            className="flex items-center justify-between rounded-xl bg-cloud px-3.5 py-3"
          >
            <span className="inline-flex items-center gap-2 text-xs font-medium text-muted">
              <span
                className={`grid h-6 w-6 place-items-center rounded-lg ${
                  r.up ? "bg-aurora-300/30 text-aurora-600" : "bg-brand-100 text-brand-600"
                }`}
              >
                {r.up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              </span>
              {r.label}
            </span>
            <span className="text-sm font-semibold text-ink">{r.value}</span>
          </motion.div>
        ))}

        <motion.div
          variants={item}
          className="flex items-center justify-between rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 px-3.5 py-3 text-white"
        >
          <span className="text-xs font-semibold text-white/80">Utilidad del mes</span>
          <span className="font-display text-lg font-extrabold">$42,250</span>
        </motion.div>

        {/* Health meter */}
        <motion.div variants={item} className="rounded-xl bg-cloud px-3.5 py-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
              <HeartPulse className="h-4 w-4 text-aurora-600" />
              Salud del negocio
            </span>
            <span className="text-xs font-bold text-aurora-600">Buena</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-line">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "78%" }}
              transition={{ delay: 0.4, duration: 0.9, ease: easeOutSoft }}
              className="h-full rounded-full bg-gradient-to-r from-brand-500 via-aurora-500 to-aurora-400"
            />
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7, type: "spring", stiffness: 260, damping: 16 }}
        className="mt-3 flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50/60 px-3.5 py-2.5"
      >
        <Check className="h-4 w-4 text-brand-600" strokeWidth={3} />
        <span className="text-xs font-semibold text-brand-700">
          Sin ser contador: Nuvio calcula tu salud financiera por ti.
        </span>
      </motion.div>
    </Frame>
  );
}
