"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  className?: string;
  withArrow?: boolean;
  onDark?: boolean;
};

const base =
  "group relative inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap px-6 py-3 text-[0.95rem] transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-400 focus-visible:ring-offset-transparent";

export function Button({
  children,
  href = "#",
  variant = "primary",
  className = "",
  withArrow = false,
  onDark = false,
}: ButtonProps) {
  const styles: Record<Variant, string> = {
    primary:
      "text-white shadow-glow bg-brand-700 hover:bg-brand-800 dark:bg-brand-600 dark:hover:bg-brand-500 dark:text-brand-950",
    secondary: onDark
      ? "glass-dark text-white hover:bg-white/10"
      : "bg-surface text-ink border border-line hover:border-brand-300 shadow-soft",
    ghost: onDark
      ? "text-white/80 hover:text-white"
      : "text-ink-soft hover:text-brand-600",
  };

  return (
    <motion.a
      href={href}
      className={`${base} ${styles[variant]} ${className}`}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
    >
      {variant === "primary" && (
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
          <span className="ring-shimmer absolute inset-0 opacity-60" />
        </span>
      )}
      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
        {withArrow && (
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        )}
      </span>
    </motion.a>
  );
}
