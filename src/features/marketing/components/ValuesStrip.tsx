"use client";

import { Heart, Sparkles, ShieldCheck, Zap, Repeat } from "lucide-react";

const values = [
  { icon: Sparkles, label: "Simplicidad" },
  { icon: Heart, label: "Cercanía" },
  { icon: ShieldCheck, label: "Confianza" },
  { icon: Zap, label: "Innovación" },
  { icon: Repeat, label: "Evolución" },
];

export function ValuesStrip() {
  const items = [...values, ...values];
  return (
    <div className="relative overflow-hidden border-y border-line bg-surface/50 py-5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-paper to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-paper to-transparent" />
      <div className="animate-marquee flex w-max items-center gap-10 pl-10">
        {items.map((v, i) => (
          <span
            key={i}
            className="flex items-center gap-2.5 text-base font-semibold text-ink-soft"
          >
            <v.icon className="h-4.5 w-4.5 text-brand-400" />
            {v.label}
            <span className="ml-8 h-1.5 w-1.5 rounded-full bg-brand-200" />
          </span>
        ))}
      </div>
    </div>
  );
}
