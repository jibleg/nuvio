"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useMotionValueEvent, useSpring } from "framer-motion";
import { ArrowUp } from "lucide-react";

/**
 * Floating "back to top" control. Appears once the operator scrolls past the
 * first viewport and hides again near the top. The ring around it tracks how
 * far down the page they are.
 */
export function BackToTop() {
  const { scrollY, scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(false);

  // Smooth the progress so the ring doesn't jitter.
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  // Show on scroll changes...
  useMotionValueEvent(scrollY, "change", (y) => {
    setVisible(y > 520);
  });

  // ...and also if the page loads already scrolled down (deep link / restored scroll).
  useEffect(() => {
    setVisible(window.scrollY > 520);
  }, []);

  const toTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          onClick={toTop}
          aria-label="Volver al inicio"
          title="Volver al inicio"
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.92 }}
          className="group fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full glass shadow-glow sm:bottom-8 sm:right-8"
        >
          {/* Progress ring */}
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="25" className="stroke-brand-500/15" strokeWidth="3" />
            <motion.circle
              cx="28"
              cy="28"
              r="25"
              stroke="url(#backToTop)"
              strokeWidth="3"
              strokeLinecap="round"
              style={{ pathLength: progress }}
            />
            <defs>
              <linearGradient id="backToTop" x1="0" y1="0" x2="56" y2="56">
                <stop stopColor="#1a9cab" />
                <stop offset="1" stopColor="#76e6ea" />
              </linearGradient>
            </defs>
          </svg>

          {/* Pulse on hover */}
          <span className="absolute inset-1.5 rounded-full bg-brand-400/0 transition-colors duration-300 group-hover:bg-brand-400/10" />

          <ArrowUp className="relative h-5 w-5 text-brand-600 transition-transform duration-300 group-hover:-translate-y-0.5 dark:text-brand-300" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
