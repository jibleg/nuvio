"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const rays = Array.from({ length: 8 }, (_, i) => i);

export function ThemeToggle({ onDark = false }: { onDark?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    const root = document.documentElement;
    root.classList.toggle("dark", next);
    try {
      localStorage.setItem("nuvio-theme", next ? "dark" : "light");
    } catch {}
  };

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      className={`relative grid h-10 w-10 place-items-center overflow-hidden rounded-full border transition-colors duration-300 ${
        onDark
          ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
          : "border-line bg-surface text-ink hover:border-brand-300"
      }`}
    >
      {/* Soft glow behind */}
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full"
        animate={{
          background: mounted && isDark
            ? "radial-gradient(circle at 50% 50%, rgba(88,206,213,0.25), transparent 70%)"
            : "radial-gradient(circle at 50% 50%, rgba(255,180,90,0.22), transparent 70%)",
        }}
        transition={{ duration: 0.5 }}
      />

      <motion.svg
        viewBox="0 0 24 24"
        className="relative h-5 w-5"
        initial={false}
        animate={{ rotate: mounted && isDark ? -20 : 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <mask id="nuvio-moon">
          <rect x="0" y="0" width="24" height="24" fill="white" />
          <motion.circle
            initial={false}
            animate={{
              cx: mounted && isDark ? 16 : 26,
              cy: mounted && isDark ? 8 : 2,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            r="8"
            fill="black"
          />
        </mask>

        {/* Sun / Moon body */}
        <motion.circle
          cx="12"
          cy="12"
          fill="currentColor"
          mask="url(#nuvio-moon)"
          initial={false}
          animate={{ r: mounted && isDark ? 8 : 5.2 }}
          transition={{ type: "spring", stiffness: 200, damping: 16 }}
        />

        {/* Rays */}
        <motion.g
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          initial={false}
          animate={{
            opacity: mounted && isDark ? 0 : 1,
            scale: mounted && isDark ? 0.5 : 1,
            rotate: mounted && isDark ? 40 : 0,
          }}
          transition={{ duration: 0.4 }}
          style={{ transformOrigin: "12px 12px" }}
        >
          {rays.map((i) => {
            const angle = (i * Math.PI) / 4;
            const x1 = 12 + Math.cos(angle) * 8.5;
            const y1 = 12 + Math.sin(angle) * 8.5;
            const x2 = 12 + Math.cos(angle) * 10.8;
            const y2 = 12 + Math.sin(angle) * 10.8;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </motion.g>
      </motion.svg>
    </button>
  );
}
