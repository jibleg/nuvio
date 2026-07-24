"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  onDark = false,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  onDark?: boolean;
  className?: string;
}) {
  return (
    <motion.div
      variants={stagger(0.12)}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {eyebrow && (
        <motion.span
          variants={fadeUp}
          className={cn(
            "text-xs font-bold uppercase tracking-[0.18em]",
            onDark ? "text-aurora-300" : "text-brand-500"
          )}
        >
          {eyebrow}
        </motion.span>
      )}
      <motion.h2
        variants={fadeUp}
        className={cn(
          "max-w-3xl text-balance text-3xl font-extrabold leading-[1.08] sm:text-4xl md:text-[2.9rem]",
          onDark ? "text-white" : "text-ink"
        )}
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          variants={fadeUp}
          className={cn(
            "max-w-2xl text-pretty text-base leading-relaxed sm:text-lg",
            onDark ? "text-white/70" : "text-muted"
          )}
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  );
}
